import type { PromptPort } from "@/services/bridge";

import { runRedeemTask } from "../functions/run/runRedeemTask";
import { displayRunResult } from "../io/displayRunResult";
import type { RedeemTask } from "../types";

/** Fallback when a scheduled task fires and no adapter notifier is registered. */
export function createScheduledRunHandler(port: PromptPort) {
  return async (task: RedeemTask) => {
    const result = await runRedeemTask({ task });
    displayRunResult(port, result);
  };
}
