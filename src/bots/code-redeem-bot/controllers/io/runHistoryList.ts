import type { RunHistoryEntry, ScheduledTask } from "@/bots/code-redeem-bot/types";
import type { DisplayPresenter } from "@/adapters/host/contracts/displayPresenter";
import type { PromptPort } from "@/adapters/host/contracts/promptPort";
import { buildRunHistoryCard } from "@/bots/code-redeem-bot/utils/runHistory";

export function showRunHistoryList(
  prompt: PromptPort,
  display: DisplayPresenter,
  entries: readonly RunHistoryEntry[],
  scheduledTasksById?: ReadonlyMap<string, ScheduledTask>,
): void {
  if (entries.length === 0) {
    prompt.info("No run history yet.");
    return;
  }

  prompt.info(`Recent runs (${entries.length})`);

  const cards = entries.map((entry) => {
    const scheduledTask =
      entry.scheduledTaskId !== null
        ? scheduledTasksById?.get(entry.scheduledTaskId)
        : undefined;

    return buildRunHistoryCard(entry, scheduledTask);
  });

  display.displayCards(cards);
}
