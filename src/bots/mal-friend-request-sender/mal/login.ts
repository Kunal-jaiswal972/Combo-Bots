import type { Page } from "puppeteer-core";

import type { PromptPort } from "@/adapters/host/contracts";
import {
  clearInput,
  clickElement,
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

import { loginPageUrl, MalDelays, MalSelectors } from "../config/constants";
import {
  loadMalBotState,
  saveMalBotState,
} from "../controllers/storage/store/stateStore";

async function typeLikeHuman(
  page: Page,
  selector: string,
  text: string,
): Promise<void> {
  await page.focus(selector);

  for (const character of text) {
    await page.keyboard.type(character);
    await sleep({
      ms: getRandomDelay({ min: MalDelays.typeMin, max: MalDelays.typeMax }),
      reason: "human-like typing",
    });
  }
}

/** True when logged in: loading login.php redirects away only when logged in. */
export async function verifyMalLoggedIn(page: Page): Promise<boolean> {
  await navigate({ page, url: loginPageUrl() });
  return !page.url().includes("login.php");
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
  await typeLikeHuman(page, MalSelectors.loginUsername, username);

  logger.info("Typing password...");
  await typeLikeHuman(page, MalSelectors.loginPassword, password);

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

export interface EnsureMalLoggedInOptions {
  readonly page: Page;
  readonly prompt: PromptPort;
}

/**
 * Ensures a MAL session before the friend-request flow.
 * Order: saved flag → existing browser session → prompted auto-login → manual login.
 */
export async function ensureMalLoggedIn(
  options: EnsureMalLoggedInOptions,
): Promise<void> {
  const state = loadMalBotState();

  if (state.isLoggedIn === true) {
    logger.success("Already logged in (saved from a previous run).");
    return;
  }

  if (await verifyMalLoggedIn(options.page)) {
    saveMalBotState({ isLoggedIn: true });
    logger.success("Already logged in (existing browser session).");
    return;
  }

  const useAutoLogin = await options.prompt.yesNo(
    "Log in to MAL automatically with username and password?",
    true,
  );

  if (useAutoLogin) {
    const username = await options.prompt.username("MAL account username:");
    const password = await options.prompt.password("MAL account password:");

    logger.info(
      `Logging in automatically as ${formatAccountLabel(username)}...`,
    );
    await autoLogin(options.page, username, password);

    if (await verifyMalLoggedIn(options.page)) {
      saveMalBotState({ isLoggedIn: true });
      logger.success("Auto-login succeeded — future runs will skip this step.");
      return;
    }

    logger.warn(
      "Auto-login did not succeed (wrong credentials or MAL challenge). Falling back to manual login.",
    );
  } else {
    logger.gray("Using manual login.");
  }

  await manualLogin(options.page, options.prompt);

  if (await verifyMalLoggedIn(options.page)) {
    saveMalBotState({ isLoggedIn: true });
    logger.success("Login saved — future runs will skip this step.");
    return;
  }

  logger.warn(
    "Still not detected as logged in — continuing; login will retry next run.",
  );
}

export async function resolveTargetUsername(
  prompt: PromptPort,
): Promise<string> {
  const stored = loadMalBotState().lastUsername;

  let username = "";

  while (username.length === 0) {
    const message =
      stored !== undefined
        ? `Enter MAL username whose friends to request (default: ${stored}):`
        : "Enter MAL username whose friends to request:";

    const answer = (await prompt.question(message)).trim();
    username = answer.length > 0 ? answer : (stored ?? "");

    if (username.length === 0) {
      prompt.warn("A username is required — please enter one.");
    }
  }

  saveMalBotState({ lastUsername: username });
  return username;
}
