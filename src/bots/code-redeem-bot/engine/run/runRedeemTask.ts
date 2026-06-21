import type { RedeemTask } from "@/bots/code-redeem-bot/types";
import type { RunResult } from "@/bots/code-redeem-bot/types";
import { getStorage } from "@/bots/code-redeem-bot/controllers/storage";
import { executeRedeemRun } from "./redeemRun";

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
