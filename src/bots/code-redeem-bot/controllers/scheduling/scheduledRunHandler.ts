import { runRedeemTask } from "@/bots/code-redeem-bot/engine/run/runRedeemTask.js";
import type { RedeemTask } from "@/bots/code-redeem-bot/types.js";
import type { PromptPort } from "@/shared/adapters/host/contracts/promptPort.js";
import { displayRunResult } from "@/bots/code-redeem-bot/controllers/io/displayRunResult.js";

/** Fallback when a scheduled task fires and no adapter notifier is registered. */
export function createScheduledRunHandler(port: PromptPort) {
  return async (task: RedeemTask) => {
    const result = await runRedeemTask({ task });
    displayRunResult(port, result);
  };
}
