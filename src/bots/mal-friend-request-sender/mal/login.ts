import type { Page } from "puppeteer-core";

import type { PromptPort } from "@/adapters/host/contracts";
import {
  clearInput,
  clickElement,
  enterText,
  navigate,
  readElementText,
} from "@/tools/browser";
import {
  ConfigError,
  formatAccountLabel,
  getAppConfig,
  getRandomDelay,
  logger,
  sleep,
} from "@/utils";

import {
  homeUrl,
  loginPageUrl,
  MalDelays,
  MalSelectors,
} from "../config/constants";
import {
  loadMalBotState,
  saveMalBotState,
} from "../controllers/storage/store/stateStore";

/**
 * Resolve the logged-in MAL account from the live page (not the database):
 * `login.php` redirects a logged-in user to the homepage, where the header
 * avatar button (`a.header-profile-button`) carries the username in its
 * `title`/`href`. Returns the username, or `null` when not logged in.
 */
export async function getLoggedInUsername(page: Page): Promise<string | null> {
  await navigate({ page, url: loginPageUrl() });

  if (page.url().includes("login.php")) {
    return null;
  }

  const raw = await page.evaluate((selector) => {
    const el = document.querySelector(selector);
    if (!el) {
      return null;
    }
    return el.getAttribute("title") || el.getAttribute("href") || null;
  }, MalSelectors.headerProfileButton);

  if (!raw) {
    return null;
  }

  const afterProfile = raw.split("/profile/")[1];
  const username = (afterProfile ?? raw).split(/[/?#]/)[0]?.trim() ?? "";

  return username.length > 0 ? username : null;
}

/** Submit the MAL logout form (POST to logout.php) from the profile dropdown. */
export async function logoutMal(page: Page): Promise<void> {
  logger.info("Logging out of MAL...");
  await navigate({ page, url: homeUrl() });

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => {}),
    page.evaluate((selector) => {
      const form = document.querySelector(selector);
      if (form instanceof HTMLFormElement) {
        form.submit();
      }
    }, MalSelectors.logoutForm),
  ]);

  await sleep({ ms: MalDelays.pageSettle, reason: "MAL logout to settle" });
}

async function autoLogin(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  logger.info("Opening MAL login page...");
  await navigate({ page, url: loginPageUrl() });
  await page.waitForSelector(MalSelectors.loginUsername, { timeout: 10_000 });

  logger.gray(
    `Letting autofill settle (${MalDelays.loginAutofillSettle}ms)...`,
  );
  await sleep({
    ms: MalDelays.loginAutofillSettle,
    reason: "browser autofill to settle",
  });

  logger.gray("Clearing any autofilled values...");
  await clearInput({ context: page, selector: MalSelectors.loginUsername });
  await clearInput({ context: page, selector: MalSelectors.loginPassword });

  logger.info("Typing username...");
  await enterText({
    context: page,
    selector: MalSelectors.loginUsername,
    text: username,
    reason: "MAL username",
  });

  logger.info("Typing password...");
  await enterText({
    context: page,
    selector: MalSelectors.loginPassword,
    text: password,
    reason: "MAL password",
  });

  logger.gray("Enabling remember me...");
  await page.evaluate((selector) => {
    const checkbox = document.querySelector(selector);
    if (checkbox instanceof HTMLInputElement && !checkbox.checked) {
      checkbox.click();
    }
  }, MalSelectors.loginRemember);

  const waitMs = getRandomDelay({
    min: MalDelays.beforeSubmitMin,
    max: MalDelays.beforeSubmitMax,
  });
  logger.gray(`Waiting ${waitMs}ms before clicking Login...`);
  await sleep({ ms: waitMs, reason: "before login submit" });

  logger.info("Clicking Login...");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => {}),
    clickElement({
      context: page,
      selector: MalSelectors.loginSubmit,
      reason: "MAL login submit",
    }),
  ]);

  await sleep({ ms: MalDelays.pageSettle, reason: "MAL login response" });

  const errorText = await readElementText({
    page,
    selector: MalSelectors.loginError,
  }).catch(() => "");

  if (errorText.length > 0) {
    logger.error(`MAL login error: ${errorText}`);
  }
}

async function manualLogin(page: Page, prompt: PromptPort): Promise<void> {
  const { headless } = getAppConfig().chrome;

  if (headless) {
    throw new ConfigError(
      "Manual MAL login cannot run in headless mode. Disable HEADLESS or use automatic login.",
    );
  }

  await navigate({ page, url: loginPageUrl() });
  await prompt.question(
    "Log into MAL in the opened browser, then press Enter to continue...",
  );
}

export async function loginToMal(
  page: Page,
  prompt: PromptPort,
): Promise<void> {
  const useAutoLogin = await prompt.yesNo(
    "Log in to MAL automatically with username and password?",
    true,
  );

  if (useAutoLogin) {
    const username = await prompt.username("MAL account username:");
    const password = await prompt.password("MAL account password:");

    logger.info(
      `Logging in automatically as ${formatAccountLabel(username)}...`,
    );
    await autoLogin(page, username, password);

    if ((await getLoggedInUsername(page)) !== null) {
      return;
    }

    prompt.warn(
      "Login did not succeed (wrong credentials or a MAL challenge). Falling back to manual login.",
    );
  } else {
    logger.gray("Using manual login.");
  }

  await manualLogin(page, prompt);
}

export async function resolveTargetUsername(
  prompt: PromptPort,
): Promise<string> {
  const stored = loadMalBotState().lastScrapedUsername;

  let username = "";

  while (username.length === 0) {
    const message = "Enter MAL username whose friends to request:";

    const answer = (
      await prompt.question(message, { defaultValue: stored })
    ).trim();
    username = answer.length > 0 ? answer : (stored ?? "");

    if (username.length === 0) {
      prompt.warn("A username is required — please enter one.");
    }
  }

  saveMalBotState({ lastScrapedUsername: username });
  return username;
}
