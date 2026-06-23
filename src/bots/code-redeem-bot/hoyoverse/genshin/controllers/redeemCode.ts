import type { Page } from "puppeteer-core";

import {
  BrowserDelays,
  clearInput,
  clickElement,
  enterText,
} from "@/tools/browser";
import { getRandomDelay, logger, sleep } from "@/utils";

import { GameId, RedeemStatus } from "../../../config/constants";
import type { CodeRedeemResult } from "../../../types";
import { getRedeemMessageParser } from "../../shared/redeemMessageParser";
import { genshinConfig } from "../config/config";
import {
  dismissRedeemModal,
  ensureRedeemModalClosed,
  waitForRedeemModalMessage,
} from "./redeemModal";

export async function redeemSingleCode(
  page: Page,
  code: string,
): Promise<CodeRedeemResult> {
  for (
    let attempt = 1;
    attempt <= genshinConfig.maxRedeemRetries;
    attempt += 1
  ) {
    await ensureRedeemModalClosed(page);
    await clearInput({
      context: page,
      selector: genshinConfig.selectors.redeemInput,
    });
    await enterText({
      context: page,
      selector: genshinConfig.selectors.redeemInput,
      text: code,
      reason: "redeem code input",
    });
    logger.gray(
      `Submitting code: ${code}${attempt > 1 ? ` (retry ${attempt})` : ""}`,
    );
    await sleep({
      ms: getRandomDelay({ min: 100, max: 500 }),
      reason: "before submitting code",
    });
    await clickElement({
      context: page,
      selector: genshinConfig.selectors.redeemSubmit,
      timeout: BrowserDelays.LONG,
      reason: "redeem submit",
    });

    const feedback = await waitForRedeemModalMessage(page);
    const parsed = getRedeemMessageParser(GameId.GENSHIN).parse(feedback);

    logger.info(`[${code}] ${parsed.action}: ${parsed.message}`);

    if (parsed.action === "success") {
      await dismissRedeemModal(page);
      await ensureRedeemModalClosed(page);
      return {
        code,
        status: RedeemStatus.REDEEMED,
        message: parsed.message,
      };
    }

    if (parsed.action === "expired") {
      await dismissRedeemModal(page);
      await ensureRedeemModalClosed(page);
      return {
        code,
        status: RedeemStatus.EXPIRED,
        message: parsed.message,
      };
    }

    if (parsed.action === "retry") {
      await dismissRedeemModal(page);
      await ensureRedeemModalClosed(page);
      await sleep({
        ms: genshinConfig.redeemCooldownMs,
        reason: "redeem cooldown before retry",
      });
      continue;
    }

    const noModalResponse =
      parsed.action === "pending" &&
      (parsed.message === "No redemption response detected." ||
        parsed.message.length === 0);

    if (noModalResponse && attempt < genshinConfig.maxRedeemRetries) {
      await dismissRedeemModal(page);
      await ensureRedeemModalClosed(page);
      logger.warn(`No modal response for ${code} — retrying submit.`);
      await sleep({
        ms: genshinConfig.redeemCooldownMs,
        reason: "no modal response, retrying",
      });
      continue;
    }

    if (
      parsed.action === "pending" &&
      attempt < genshinConfig.maxRedeemRetries
    ) {
      await dismissRedeemModal(page);
      await ensureRedeemModalClosed(page);
      logger.warn(`Redeem inconclusive for ${code} — retrying submit.`);
      await sleep({
        ms: genshinConfig.redeemCooldownMs,
        reason: "inconclusive response, retrying",
      });
      continue;
    }

    await dismissRedeemModal(page);
    await ensureRedeemModalClosed(page);
    logger.warn(`[${code}] remains pending: ${parsed.message}`);
    return {
      code,
      status: RedeemStatus.PENDING,
      message: parsed.message,
    };
  }

  logger.warn(`[${code}] remains pending after max retries.`);
  return {
    code,
    status: RedeemStatus.PENDING,
    message: "Max retries exceeded — will retry on next run.",
  };
}
