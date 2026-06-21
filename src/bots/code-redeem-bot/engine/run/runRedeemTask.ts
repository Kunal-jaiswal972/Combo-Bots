import type { RedeemTask } from "@/bots/code-redeem-bot/types.js";
import type { RunResult } from "@/bots/code-redeem-bot/types.js";
import { getStorage } from "@/bots/code-redeem-bot/controllers/storage.js";
import { executeRedeemRun } from "./redeemRun.js";

export interface RunRedeemTaskOptions {
  task: RedeemTask;
}

export async function runRedeemTask(
  options: RunRedeemTaskOptions,
): Promise<RunResult> {
  const result = await executeRedeemRun({ task: options.task });

  await getStorage().runHistory.record({
    task: options.task,
    result,
  });

  return result;
}
