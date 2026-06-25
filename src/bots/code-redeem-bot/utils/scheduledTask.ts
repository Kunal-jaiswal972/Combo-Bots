import type { DisplayCard, DisplayCardRow } from "@/services/bridge";
import {
  formatRecurrenceDescription,
  formatUpcomingRuns,
} from "@/tools/scheduler";
import { formatSchedulerInstant } from "@/utils";

import { getGameModule } from "../functions/gameRegistry";
import type { ScheduledTask } from "../types";

export function buildScheduledTaskCard(task: ScheduledTask): DisplayCard {
  const game = getGameModule(task.payloadTemplate.gameId);
  const credentials = task.payloadTemplate.credentials;
  const username = credentials.username?.trim() ?? "";
  const server = credentials.server?.trim() ?? "";

  const rows: DisplayCardRow[] = [
    { label: "Game", value: game.displayName },
    { label: "Account", value: username.length > 0 ? username : "—" },
    { label: "Server", value: server.length > 0 ? server : "—" },
    { label: "Schedule", value: formatRecurrenceDescription(task.schedule) },
    { label: "Status", value: task.enabled ? "Active" : "Disabled" },
  ];

  if (task.lastRunAt) {
    rows.push({
      label: "Last run",
      value: formatSchedulerInstant(task.lastRunAt),
    });
  }

  rows.push({
    label: "Next runs",
    value: formatUpcomingRuns(task.schedule, 3),
  });

  return {
    title: game.displayName,
    rows,
    footer: `Task ID: ${task.id}`,
  };
}

export function formatScheduledTaskChoiceLabel(task: ScheduledTask): string {
  const game = getGameModule(task.payloadTemplate.gameId);
  const username = task.payloadTemplate.credentials.username?.trim() ?? "—";
  const schedule = formatRecurrenceDescription(task.schedule);

  return `${game.displayName} · ${username} · ${schedule}`;
}
