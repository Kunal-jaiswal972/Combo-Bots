import type { RedeemTaskTemplate, ScheduledTask } from "@/bots/code-redeem-bot/types.js";
import type { TaskScheduler } from "@/shared/tools/scheduler/scheduler.js";

export async function listScheduledTasks(
  scheduler: TaskScheduler<RedeemTaskTemplate>,
): Promise<ScheduledTask[]> {  return scheduler.list();
}

export async function cancelScheduledTask(
  scheduler: TaskScheduler<RedeemTaskTemplate>,
  taskId: string,
): Promise<void> {  await scheduler.cancel(taskId);
}

export function buildScheduledTasksById(
  tasks: readonly ScheduledTask[],
): Map<string, ScheduledTask> {
  return new Map(tasks.map((task) => [task.id, task]));
}
