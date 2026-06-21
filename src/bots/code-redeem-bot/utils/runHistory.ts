import type { RunResult, RunHistoryEntry } from "@/bots/code-redeem-bot/types";
import type { ScheduledTask } from "@/bots/code-redeem-bot/types";
import type { GameIdValue } from "@/bots/code-redeem-bot/config/constants";
import { getGameModule } from "@/bots/code-redeem-bot/engine/gameRegistry";
import { formatSchedulerInstant } from "@/utils";
import type { DisplayCard, DisplayCardRow } from "@/adapters/host/contracts/displayCard";

function formatRunStatusLabel(status: RunResult["status"]): string {
  switch (status) {
    case "success":
      return "Success";
    case "partial":
      return "Partial success";
    case "failed":
      return "Failed";
    default:
      return "Unknown";
  }
}

function formatRedeemSummary(entry: RunHistoryEntry): string {
  const summary = entry.redeemSummary;

  if (!summary) {
    return "No redeem data";
  }

  const parts: string[] = [];

  if (summary.redeemed > 0) {
    parts.push(`${summary.redeemed} redeemed`);
  }

  if (summary.expired > 0) {
    parts.push(`${summary.expired} expired`);
  }

  if (summary.stillPending > 0) {
    parts.push(`${summary.stillPending} pending`);
  }

  if (parts.length === 0) {
    return "No codes processed";
  }

  return parts.join(", ");
}

function formatDuration(startedAt: string, finishedAt: string): string {
  const start = new Date(startedAt);
  const end = new Date(finishedAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "—";
  }

  const seconds = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

export function buildRunHistoryCard(
  entry: RunHistoryEntry,
  scheduledTask?: ScheduledTask,
): DisplayCard {
  const gameId = entry.gameId as GameIdValue;
  const game = getGameModule(gameId);

  const rows: DisplayCardRow[] = [
    { label: "Game", value: game.displayName },
    { label: "Status", value: formatRunStatusLabel(entry.status) },
    { label: "Source", value: entry.source },
    { label: "Started", value: formatSchedulerInstant(entry.startedAt) },
    { label: "Finished", value: formatSchedulerInstant(entry.finishedAt) },
    { label: "Duration", value: formatDuration(entry.startedAt, entry.finishedAt) },
  ];

  if (scheduledTask) {
    const username = scheduledTask.payloadTemplate.credentials.username?.trim() ?? "";
    const server = scheduledTask.payloadTemplate.credentials.server?.trim() ?? "";

    if (username.length > 0) {
      rows.push({ label: "Account", value: username });
    }

    if (server.length > 0) {
      rows.push({ label: "Server", value: server });
    }
  }

  rows.push({
    label: "Scrape",
    value: entry.scraped ? "Yes" : "No",
  });

  rows.push({
    label: "Redeem",
    value: formatRedeemSummary(entry),
  });

  if (entry.error) {
    rows.push({ label: "Error", value: entry.error });
  }

  return {
    title: `${game.displayName} run`,
    rows,
    footer: `Run ID: ${entry.id}`,
  };
}
