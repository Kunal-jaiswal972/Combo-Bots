import type { PromptPort } from "@/adapters/host/contracts";

import { runRedeemTask } from "../../engine/run/runRedeemTask";
import type { RedeemTask } from "../../types";
import { displayRunResult } from "../io/displayRunResult";

/** Fallback when a scheduled task fires and no adapter notifier is registered. */
export function createScheduledRunHandler(port: PromptPort) {
  return async (task: RedeemTask) => {
    const result = await runRedeemTask({ task });
    displayRunResult(port, result);
  };
}
