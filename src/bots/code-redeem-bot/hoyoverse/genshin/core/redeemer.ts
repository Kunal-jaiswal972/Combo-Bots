import { BrowserDelays, type ChromeSession } from "@/tools/browser";
import type {
  CodeRedeemResult,
  GameRedeemOptions,
} from "@/bots/code-redeem-bot/types";
import {
  formatAccountLabel,
  isAborted,
  logger,
  sleep,
  RedeemError
} from "@/utils";
import { genshinConfig, isGenshinServer } from "../config/config";
import { ensureLoggedIn } from "../controllers/login";
import { redeemSingleCode } from "../controllers/redeemCode";
import { ensureRedeemModalClosed } from "../controllers/redeemModal";
import { selectServer } from "../controllers/selectServer";

export async function redeemGenshinCodes(
  session: ChromeSession,
  options: GameRedeemOptions,
): Promise<CodeRedeemResult[]> {
  const { browser } = session;
  const { credentials, codes } = options;
  const accountLabel = formatAccountLabel(credentials.username);

  if (codes.length === 0) {
    return [];
  }

  if (credentials.username.length === 0 || credentials.password.length === 0) {
    throw new RedeemError("Genshin credentials are required for redemption.");
  }

  let page = session.page;

  logger.gray(`Navigating to redeem page for ${accountLabel}...`);
  await page.goto(genshinConfig.redeemPageUrl, { waitUntil: "domcontentloaded" });
  await sleep({ ms: BrowserDelays.SHORT, reason: "redeem page to load" });
  logger.gray(`Navigated to ${genshinConfig.redeemPageUrl}`);

  page = await ensureLoggedIn(
    browser,
    page,
    credentials.username,
    credentials.password,
  );
  await selectServer(page, isGenshinServer(credentials.server));

  const results: CodeRedeemResult[] = [];

  for (let index = 0; index < codes.length; index += 1) {
    if (isAborted()) {
      logger.gray("Shutdown requested — stopping code redemption.");
      break;
    }

    const code = codes[index];
    if (!code) {
      continue;
    }

    const result = await redeemSingleCode(page, code);
    results.push(result);

    if (options.onCodeRedeemed) {
      await options.onCodeRedeemed(result);
    }

    const hasMoreCodes = index < codes.length - 1;
    if (hasMoreCodes) {
      await ensureRedeemModalClosed(page);
      await sleep({ ms: genshinConfig.redeemCooldownMs, reason: "between redeem codes" });
    }
  }

  return results;
}
