import type { DisplayPresenter, PromptPort } from "@/adapters/host/contracts";

import type { ScheduledTask } from "../../types";
import { buildScheduledTaskCard } from "../../utils/scheduledTask";

export function showScheduledTaskList(
  prompt: PromptPort,
  display: DisplayPresenter,
  tasks: readonly ScheduledTask[],
): void {
  if (tasks.length === 0) {
    prompt.info("No scheduled tasks.");
    return;
  }

  prompt.info(`Scheduled tasks (${tasks.length})`);
  display.displayCards(tasks.map((task) => buildScheduledTaskCard(task)));
}
