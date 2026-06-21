import type {
  RedeemTaskTemplate,
  RunHistoryEntry,
  ScheduledTask,
} from "@/bots/code-redeem-bot/types.js";import type { TaskScheduler } from "@/shared/tools/scheduler/scheduler.js";
import { getStorage } from "@/bots/code-redeem-bot/controllers/storage.js";
import {
  buildScheduledTasksById,
  listScheduledTasks,
} from "./scheduledTasks.js";

export interface RunHistoryListResult {
  readonly entries: readonly RunHistoryEntry[];
}

export interface RunHistoryWithTasksResult extends RunHistoryListResult {
  readonly tasksById: ReadonlyMap<string, ScheduledTask>;
}

export async function listRecentRunHistory(
  limit: number,
): Promise<RunHistoryListResult> {
  const entries = await getStorage().runHistory.listRecent(limit);
  return { entries };
}

export async function listRecentRunHistoryWithTasks(
  scheduler: TaskScheduler<RedeemTaskTemplate>,
  limit: number,
): Promise<RunHistoryWithTasksResult> {  const history = await listRecentRunHistory(limit);
  const tasks = await listScheduledTasks(scheduler);

  return {
    entries: history.entries,
    tasksById: buildScheduledTasksById(tasks),
  };
}
