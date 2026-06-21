import type { ScheduledTask } from "@/bots/code-redeem-bot/types.js";
import type { DisplayPresenter } from "@/shared/adapters/host/contracts/displayPresenter.js";
import type { PromptPort } from "@/shared/adapters/host/contracts/promptPort.js";
import { buildScheduledTaskCard } from "@/bots/code-redeem-bot/utils/scheduledTask.js";

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
