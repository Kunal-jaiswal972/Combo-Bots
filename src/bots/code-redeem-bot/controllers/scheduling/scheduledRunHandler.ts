import { runRedeemTask } from "@/bots/code-redeem-bot/engine/run/runRedeemTask";
import type { RedeemTask } from "@/bots/code-redeem-bot/types";
import type { PromptPort } from "@/adapters/host/contracts/promptPort";
import { displayRunResult } from "@/bots/code-redeem-bot/controllers/io/displayRunResult";

/** Fallback when a scheduled task fires and no adapter notifier is registered. */
export function createScheduledRunHandler(port: PromptPort) {
  return async (task: RedeemTask) => {
    const result = await runRedeemTask({ task });
    displayRunResult(port, result);
  };
}
