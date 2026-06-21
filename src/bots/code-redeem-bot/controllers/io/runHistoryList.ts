import type { RunHistoryEntry, ScheduledTask } from "@/bots/code-redeem-bot/types.js";
import type { DisplayPresenter } from "@/shared/adapters/host/contracts/displayPresenter.js";
import type { PromptPort } from "@/shared/adapters/host/contracts/promptPort.js";
import { buildRunHistoryCard } from "@/bots/code-redeem-bot/utils/runHistory.js";

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
