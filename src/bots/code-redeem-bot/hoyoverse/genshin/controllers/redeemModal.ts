import type { Page } from "puppeteer-core";
import { BrowserDelays } from "@/tools/browser/constants";
import { formatWaitMs, logger, sleep } from "@/utils";
import { genshinConfig } from "../config/config";

export async function isRedeemModalOpen(page: Page): Promise<boolean> {
  return page.evaluate((modalSelector) => {
    const modal = document.querySelector(modalSelector);
    if (!modal) {
      return false;
    }

    const style = window.getComputedStyle(modal);
    return style.display !== "none" && style.visibility !== "hidden";
  }, genshinConfig.selectors.redeemModal);
}

export async function dismissRedeemModal(page: Page): Promise<void> {
  try {
    const clicked = await page.evaluate(
      (closeSelector, modalSelector) => {
        const closeEl = document.querySelector(closeSelector);
        if (closeEl instanceof HTMLElement) {
          closeEl.click();
          return true;
        }

        const modal = document.querySelector(modalSelector);
        if (modal instanceof HTMLElement) {
          modal.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
          );
        }

        return false;
      },
      genshinConfig.selectors.redeemModalClose,
      genshinConfig.selectors.redeemModal,
    );

    if (!clicked) {
      await page.keyboard.press("Escape");
    }

    await sleep({ ms: 500, reason: "redeem modal to close" });
  } catch {
    logger.warn("Could not dismiss redeem modal — continuing.");
  }
}

export async function ensureRedeemModalClosed(page: Page): Promise<void> {
  if (!(await isRedeemModalOpen(page))) {
    return;
  }

  await dismissRedeemModal(page);

  const deadline = Date.now() + genshinConfig.modalCloseTimeoutMs;
  while (Date.now() < deadline) {
    if (!(await isRedeemModalOpen(page))) {
      return;
    }

    await sleep({ ms: genshinConfig.modalPollIntervalMs });
  }

  logger.warn("Redeem modal still open — continuing anyway.");
}

export async function waitForRedeemModalMessage(page: Page): Promise<string> {
  const messageSelector = genshinConfig.selectors.redeemModalMessage;
  const modalSelector = genshinConfig.selectors.redeemModal;
  const timeout = BrowserDelays.LONG;

  logger.wait(
    `Waiting — redeem result modal message (max ${formatWaitMs(timeout)})`,
  );

  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const text = await page.evaluate(
      (msgSel, modSel) => {
        const modal = document.querySelector(modSel);
        if (!modal) {
          return "";
        }

        const message = document.querySelector(msgSel);
        return message?.textContent?.trim() ?? "";
      },
      messageSelector,
      modalSelector,
    );

    if (text.length > 0) {
      return text;
    }

    await sleep({ ms: genshinConfig.modalPollIntervalMs });
  }

  return "";
}
