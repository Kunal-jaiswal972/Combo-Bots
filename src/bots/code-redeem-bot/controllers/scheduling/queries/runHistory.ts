import type { TaskScheduler } from "@/tools/scheduler";

import type {
  RedeemTaskTemplate,
  RunHistoryEntry,
  ScheduledTask,
} from "../../../types";
import { getStorage } from "../../storage";
import {
  buildScheduledTasksById,
  listScheduledTasks,
} from "./scheduledTasks";

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
