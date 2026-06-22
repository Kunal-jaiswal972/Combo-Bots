import type { TaskScheduler } from "@/tools/scheduler";

import type { RedeemTaskTemplate, ScheduledTask } from "../../../types";

export async function listScheduledTasks(
  scheduler: TaskScheduler<RedeemTaskTemplate>,
): Promise<ScheduledTask[]> {
  return scheduler.list();
}

export async function cancelScheduledTask(
  scheduler: TaskScheduler<RedeemTaskTemplate>,
  taskId: string,
): Promise<void> {
  await scheduler.cancel(taskId);
}

export function buildScheduledTasksById(
  tasks: readonly ScheduledTask[],
): Map<string, ScheduledTask> {
  return new Map(tasks.map((task) => [task.id, task]));
}
