import { BrowserDelays, type ChromeSession } from "@/tools/browser";
import {
  formatAccountLabel,
  isAborted,
  logger,
  RedeemError,
  sleep,
} from "@/utils";

import type { CodeRedeemResult, GameRedeemOptions } from "../../../types";
import { ensureHoyoLogin } from "../../shared/auth";
import { asHoyoServer } from "../../shared/config";
import { selectHoyoServer } from "../../shared/server";
import { genshinConfig } from "../config/genshinConfig";
import { redeemSingleCode } from "../controllers/redeemCode";
import { ensureRedeemModalClosed } from "../controllers/redeemModal";

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

  // When the caller already established the session (interactive flow), we hold
  // no password — login is skipped and only the credential guard is relaxed.
  if (
    !options.alreadyLoggedIn &&
    (credentials.username.length === 0 || credentials.password.length === 0)
  ) {
    throw new RedeemError("Genshin credentials are required for redemption.");
  }

  let page = session.page;

  logger.gray(`Navigating to redeem page for ${accountLabel}...`);
  await page.goto(genshinConfig.redeemPageUrl, {
    waitUntil: "domcontentloaded",
  });
  await sleep({ ms: BrowserDelays.SHORT, reason: "redeem page to load" });
  logger.gray(`Navigated to ${genshinConfig.redeemPageUrl}`);

  if (!options.alreadyLoggedIn) {
    page = await ensureHoyoLogin(
      browser,
      page,
      genshinConfig,
      credentials.username,
      credentials.password,
    );
  }
  await selectHoyoServer(page, genshinConfig, asHoyoServer(credentials.server));

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
      await sleep({
        ms: genshinConfig.redeemCooldownMs,
        reason: "between redeem codes",
      });
    }
  }

  return results;
}
