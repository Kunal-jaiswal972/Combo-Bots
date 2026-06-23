import type { DisplayPresenter, PromptPort } from "@/adapters/host/contracts";

import type { RunHistoryEntry, ScheduledTask } from "../../types";
import { buildRunHistoryCard } from "../../utils/runHistory";

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
