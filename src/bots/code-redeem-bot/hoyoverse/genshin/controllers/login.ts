import type { Browser, Page } from "puppeteer-core";
import { BrowserDelays } from "@/tools/browser/constants";
import { RedeemError } from "@/utils/errors";
import {
  clickElement,
  enterText,
  getIframeContentFrame,
  openPage,
  waitForNetworkIdle,
} from "@/tools/browser";
import {
  formatAccountLabel,
  getRandomDelay,
  logger,
  maskSecret,
  sleep,
  waitUntil,
} from "@/utils";
import { genshinConfig } from "../config/config";

export async function isLoggedIn(page: Page): Promise<boolean> {
  const userButton = await waitUntil({
    reason: "login check (account button)",
    operation: () =>
      page.waitForSelector(genshinConfig.selectors.userButton, {
        visible: true,
        timeout: BrowserDelays.LONG,
      }),
    maxMs: BrowserDelays.LONG,
  });

  if (!userButton) {
    return false;
  }

  await sleep({ ms: BrowserDelays.SHORT, reason: "account button label to load" });

  const label = await page.evaluate(
    (element) => element.textContent?.trim() ?? "",
    userButton,
  );

  return label === genshinConfig.logOutLabel;
}

async function loginToGenshin(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  const accountLabel = formatAccountLabel(username);

  await clickElement({
    context: page,
    selector: genshinConfig.selectors.userButton,
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
    iframeSelector: genshinConfig.selectors.loginIframe,
    reason: "login iframe",
  });
  await sleep({ ms: BrowserDelays.SHORT, reason: "login iframe to initialize" });

  await enterText({
    context: frame,
    selector: genshinConfig.selectors.emailInput,
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
    selector: genshinConfig.selectors.passwordInput,
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
    selector: genshinConfig.selectors.loginSubmit,
    timeout: BrowserDelays.LONG,
    reason: "login submit",
  });
  await sleep({ ms: BrowserDelays.LONG, reason: "login request to complete" });

  const loggedIn = await isLoggedIn(page);

  if (!loggedIn) {
    throw new RedeemError("Login failed: incorrect username or password.");
  }

  logger.success(`Logged in to Hoyoverse account (${accountLabel}).`);
}

export async function ensureLoggedIn(
  browser: Browser,
  page: Page,
  username: string,
  password: string,
): Promise<Page> {
  const accountLabel = formatAccountLabel(username);
  let activePage = page;

  if (await isLoggedIn(activePage)) {
    logger.success(`Already logged in via Chrome debug profile (${accountLabel}).`);
    return activePage;
  }

  logger.info(`Not logged in — signing in as ${accountLabel}.`);

  let loginAttempts = 0;

  while (loginAttempts < genshinConfig.maxLoginAttempts) {
    try {
      await loginToGenshin(activePage, username, password);
      return activePage;
    } catch (error) {
      loginAttempts += 1;
      const cause =
        error instanceof Error ? error : new Error(String(error));
      logger.warn(
        `Login attempt ${loginAttempts}/${genshinConfig.maxLoginAttempts} failed: ${cause.message}`,
      );

      if (loginAttempts >= genshinConfig.maxLoginAttempts) {
        throw new RedeemError(
          `Failed to login after ${genshinConfig.maxLoginAttempts} attempts.`,
          cause,
        );
      }

      await activePage.close();
      activePage = await openPage({
        browser,
        url: genshinConfig.redeemPageUrl,
      });
      await sleep({ ms: BrowserDelays.LONG, reason: "before retrying login" });
    }
  }

  return activePage;
}
