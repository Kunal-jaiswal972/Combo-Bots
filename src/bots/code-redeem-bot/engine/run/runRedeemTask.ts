import { getStorage } from "../../controllers/storage";
import type { RedeemTask, RunResult } from "../../types";
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
