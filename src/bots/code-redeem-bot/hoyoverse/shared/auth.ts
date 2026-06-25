import type { Browser, Page } from "puppeteer-core";

import type { PromptPort } from "@/services/bridge";
import {
  BrowserDelays,
  clickElement,
  enterText,
  evaluateClick,
  getIframeContentFrame,
  navigate,
  openPage,
  waitForNetworkIdle,
} from "@/tools/browser";
import {
  ConfigError,
  formatAccountLabel,
  getAppConfig,
  getRandomDelay,
  logger,
  maskSecret,
  RedeemError,
  sleep,
  waitUntil,
} from "@/utils";

import type { HoyoGameConfig } from "./config";

/**
 * Read the logged-in Hoyoverse account name from the live gift page.
 *
 * When logged in, the account dropdown button renders the name in a `<strong>`
 * (Hoyoverse masks it, e.g. `C****72`) and the legacy account button reads
 * `logOutLabel`. Returns the (masked) name, or `null` when not logged in.
 */
export async function getLoggedInHoyoAccount(
  page: Page,
  config: HoyoGameConfig,
): Promise<string | null> {
  const userButton = await waitUntil({
    reason: "login check (account button)",
    operation: () =>
      page.waitForSelector(config.selectors.userButton, {
        visible: true,
        timeout: BrowserDelays.LONG,
      }),
    maxMs: BrowserDelays.LONG,
  });

  if (!userButton) {
    return null;
  }

  await sleep({
    ms: BrowserDelays.SHORT,
    reason: "account header to settle",
  });

  const label = await page.evaluate(
    (element) => element.textContent?.trim() ?? "",
    userButton,
  );

  if (label !== config.logOutLabel) {
    return null;
  }

  const name = await page.evaluate((selector) => {
    const el = document.querySelector(selector);
    if (!el) return "";
    // Extract only direct text nodes so a container that also holds a "Log Out"
    // span (Genshin's gift page) returns just the masked name, not both strings.
    return Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3) // Node.TEXT_NODE
      .map((n) => n.textContent?.trim() ?? "")
      .filter(Boolean)
      .join("")
      .trim();
  }, config.selectors.accountName);

  return name.length > 0 ? name : label;
}

export async function isHoyoLoggedIn(
  page: Page,
  config: HoyoGameConfig,
): Promise<boolean> {
  return (await getLoggedInHoyoAccount(page, config)) !== null;
}

/**
 * Whether the masked account name shown on the page belongs to `username`.
 *
 * Hoyoverse masks the middle of the name (e.g. `Cool1972` → `C****72`), so we
 * compare the visible head and tail rather than the whole string. A non-masked
 * exact match also passes.
 */
export function hoyoAccountMatches(
  displayedName: string,
  username: string,
): boolean {
  const displayed = displayedName.trim().toLowerCase();
  const expected = username.trim().toLowerCase();

  if (displayed.length === 0 || expected.length === 0) {
    return false;
  }
  if (displayed === expected) {
    return true;
  }

  const masked = displayed.match(/^(.*?)\*+(.*)$/);
  if (!masked) {
    return false;
  }

  const [, head, tail] = masked;
  return expected.startsWith(head ?? "") && expected.endsWith(tail ?? "");
}

/**
 * Reconcile the live session against the account a scheduled task expects:
 * if a *different* Hoyoverse account is logged in, log it out so the redeemer
 * can sign in with the task's stored credentials. A matching account (or no
 * session) is left as-is. Assumes the page is on the redeem URL.
 */
export async function reconcileHoyoAccount(
  page: Page,
  config: HoyoGameConfig,
  expectedUsername: string,
): Promise<void> {
  const current = await getLoggedInHoyoAccount(page, config);

  if (current === null) {
    logger.gray("No account logged in — the redeemer will sign in.");
    return;
  }

  if (hoyoAccountMatches(current, expectedUsername)) {
    logger.gray(`Correct account already logged in (${current}).`);
    return;
  }

  logger.info(
    `A different account is logged in (${current}) — logging out to switch to ${formatAccountLabel(expectedUsername)}.`,
  );
  await logOutOfHoyo(page, config);
}

/**
 * Log out of the current Hoyoverse account.
 *
 * Some pages hide the logout button behind a menu toggle (`accountMenuToggle`);
 * others expose it directly (`logoutButton` alone, e.g. Genshin's gift page).
 */
export async function logOutOfHoyo(
  page: Page,
  config: HoyoGameConfig,
): Promise<void> {
  logger.info("Logging out of the current Hoyoverse account...");

  if (config.selectors.accountMenuToggle) {
    await evaluateClick({
      page,
      selector: config.selectors.accountMenuToggle,
      timeout: BrowserDelays.LONG,
      reason: "open account menu",
    });
    await sleep({ ms: BrowserDelays.SHORT, reason: "account menu to open" });
  }

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => {}),
    evaluateClick({
      page,
      selector: config.selectors.logoutButton,
      timeout: BrowserDelays.LONG,
      reason: "logout button",
    }),
  ]);

  await sleep({ ms: BrowserDelays.LONG, reason: "logout to settle" });
}

async function loginToHoyo(
  page: Page,
  config: HoyoGameConfig,
  username: string,
  password: string,
): Promise<void> {
  const accountLabel = formatAccountLabel(username);

  await clickElement({
    context: page,
    selector: config.selectors.userButton,
    timeout: BrowserDelays.LONG,
    reason: "account menu",
  });
  await waitForNetworkIdle({
    page,
    timeout: BrowserDelays.LONG,
    reason: "login dialog to load",
  });

  const frame = await getIframeContentFrame({
    page,
    iframeSelector: config.selectors.loginIframe,
    reason: "login iframe",
  });
  await sleep({
    ms: BrowserDelays.SHORT,
    reason: "login iframe to initialize",
  });

  await enterText({
    context: frame,
    selector: config.selectors.emailInput,
    text: username,
    reason: "username field",
  });
  logger.gray(`Username entered: ${maskSecret(username)}`);
  await sleep({
    ms: getRandomDelay({
      min: BrowserDelays.RANDOM_ACTION_MIN,
      max: BrowserDelays.RANDOM_ACTION_MAX,
    }),
    reason: "after entering username",
  });

  await enterText({
    context: frame,
    selector: config.selectors.passwordInput,
    text: password,
    reason: "password field",
  });
  logger.gray("Password entered: ********");
  await sleep({
    ms: getRandomDelay({
      min: BrowserDelays.RANDOM_ACTION_MIN,
      max: BrowserDelays.RANDOM_ACTION_MAX,
    }),
    reason: "after entering password",
  });

  await clickElement({
    context: frame,
    selector: config.selectors.loginSubmit,
    timeout: BrowserDelays.LONG,
    reason: "login submit",
  });
  await sleep({ ms: BrowserDelays.LONG, reason: "login request to complete" });

  if (!(await isHoyoLoggedIn(page, config))) {
    throw new RedeemError("Login failed: incorrect username or password.");
  }

  logger.success(`Logged in to Hoyoverse account (${accountLabel}).`);
}

/**
 * Ensure the page is logged in as `username`, retrying up to
 * `config.maxLoginAttempts`. Assumes the page is already on the redeem URL.
 */
export async function ensureHoyoLogin(
  browser: Browser,
  page: Page,
  config: HoyoGameConfig,
  username: string,
  password: string,
): Promise<Page> {
  const accountLabel = formatAccountLabel(username);
  let activePage = page;

  if (await isHoyoLoggedIn(activePage, config)) {
    logger.success(`Already logged in via Chrome profile (${accountLabel}).`);
    return activePage;
  }

  logger.info(`Not logged in — signing in as ${accountLabel}.`);

  let attempts = 0;
  while (attempts < config.maxLoginAttempts) {
    try {
      await loginToHoyo(activePage, config, username, password);
      return activePage;
    } catch (error) {
      attempts += 1;
      const cause = error instanceof Error ? error : new Error(String(error));
      logger.warn(
        `Login attempt ${attempts}/${config.maxLoginAttempts} failed: ${cause.message}`,
      );

      if (attempts >= config.maxLoginAttempts) {
        throw new RedeemError(
          `Failed to login after ${config.maxLoginAttempts} attempts.`,
          cause,
        );
      }

      await activePage.close();
      activePage = await openPage({ browser, url: config.redeemPageUrl });
      await sleep({ ms: BrowserDelays.LONG, reason: "before retrying login" });
    }
  }

  return activePage;
}

async function manualHoyoLogin(
  page: Page,
  config: HoyoGameConfig,
  prompt: PromptPort,
): Promise<void> {
  if (getAppConfig().chrome.headless) {
    throw new ConfigError(
      "Manual login cannot run in headless mode. Disable HEADLESS or use automatic login.",
    );
  }

  await navigate({ page, url: config.redeemPageUrl });
  await prompt.question(
    "Log in to the opened browser, then press Enter to continue...",
  );
}

/**
 * Interactive login for the live-session flow: offer automatic (username +
 * password) or manual login, then leave the page logged in. The page should
 * already be on the game's redeem URL.
 */
export async function loginToHoyoInteractive(
  page: Page,
  config: HoyoGameConfig,
  prompt: PromptPort,
): Promise<void> {
  const useAutoLogin = await prompt.yesNo(
    "Log in automatically with username and password?",
    true,
  );

  if (useAutoLogin) {
    const username = await prompt.username("Hoyoverse account username:");
    const password = await prompt.password("Hoyoverse account password:");

    logger.info(`Logging in as ${formatAccountLabel(username)}...`);
    try {
      await loginToHoyo(page, config, username, password);
      return;
    } catch (error) {
      const cause = error instanceof Error ? error.message : String(error);
      prompt.warn(
        `Automatic login failed (${cause}). Falling back to manual login.`,
      );
    }
  } else {
    logger.gray("Using manual login.");
  }

  await manualHoyoLogin(page, config, prompt);
}
