import type { ScheduledTask } from "@/bots/code-redeem-bot/types";
import type { DisplayPresenter } from "@/adapters/host/contracts/displayPresenter";
import type { PromptPort } from "@/adapters/host/contracts/promptPort";
import { buildScheduledTaskCard } from "@/bots/code-redeem-bot/utils/scheduledTask";

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
