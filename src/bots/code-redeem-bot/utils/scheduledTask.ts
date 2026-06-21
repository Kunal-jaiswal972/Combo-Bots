import type { ScheduledTask } from "@/bots/code-redeem-bot/types.js";
import { getGameModule } from "@/bots/code-redeem-bot/engine/gameRegistry.js";
import {
  formatScheduleDescription,
  formatUpcomingRuns,
} from "@/shared/tools/scheduler/scheduleDisplay.js";
import { formatScheduleInstant } from "@/shared/utils.js";
import type { DisplayCard, DisplayCardRow } from "@/shared/adapters/host/contracts/displayCard.js";

export function buildScheduledTaskCard(task: ScheduledTask): DisplayCard {
  const game = getGameModule(task.payloadTemplate.gameId);
  const credentials = task.payloadTemplate.credentials;
  const username = credentials.username?.trim() ?? "";
  const server = credentials.server?.trim() ?? "";

  const rows: DisplayCardRow[] = [
    { label: "Game", value: game.displayName },
    { label: "Account", value: username.length > 0 ? username : "—" },
    { label: "Server", value: server.length > 0 ? server : "—" },
    { label: "Schedule", value: formatScheduleDescription(task.schedule) },
    { label: "Status", value: task.enabled ? "Active" : "Disabled" },
  ];

  if (task.lastRunAt) {
    rows.push({
      label: "Last run",
      value: formatScheduleInstant(task.lastRunAt),
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
  const schedule = formatScheduleDescription(task.schedule);

  return `${game.displayName} · ${username} · ${schedule}`;
}
