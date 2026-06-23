import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";

import type { GameIdValue } from "../../../config/constants";
import { gameDatabaseIds } from "../../../config/database";
import type {
  RecordRunHistoryOptions,
  RunHistoryEntry,
  RunHistoryStore,
} from "../../../types";
import { openGameDatabase } from "../db";

interface RunHistoryRow {
  id: string;
  scheduled_task_id: string | null;
  redeem_task_id: string;
  game_id: string;
  source: string;
  status: string;
  started_at: string;
  finished_at: string;
  scraped: number;
  error: string | null;
  redeem_summary_json: string | null;
}

interface RunHistoryStoreContext {
  readonly insertStmt: Database.Statement;
  readonly listRecentStmt: Database.Statement;
}

function parseRedeemSummaryJson(
  raw: string | null,
): RunHistoryEntry["redeemSummary"] {
  if (raw === null || raw.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as NonNullable<
      RunHistoryEntry["redeemSummary"]
    >;

    if (
      typeof parsed.redeemed !== "number" ||
      typeof parsed.expired !== "number" ||
      typeof parsed.stillPending !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function rowToEntry(row: RunHistoryRow): RunHistoryEntry {
  return {
    id: row.id,
    scheduledTaskId: row.scheduled_task_id,
    redeemTaskId: row.redeem_task_id,
    gameId: row.game_id,
    source: row.source,
    status: row.status as RunHistoryEntry["status"],
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    scraped: row.scraped === 1,
    error: row.error,
    redeemSummary: parseRedeemSummaryJson(row.redeem_summary_json),
  };
}

function createRunHistoryStoreContext(
  db: Database.Database,
): RunHistoryStoreContext {
  return {
    insertStmt: db.prepare(`
      INSERT INTO run_history (
        id, scheduled_task_id, redeem_task_id, game_id, source, status,
        started_at, finished_at, scraped, scrape_stats_json,
        redeem_summary_json, error
      ) VALUES (
        @id, @scheduled_task_id, @redeem_task_id, @game_id, @source, @status,
        @started_at, @finished_at, @scraped, @scrape_stats_json,
        @redeem_summary_json, @error
      )
    `),
    listRecentStmt: db.prepare(`
      SELECT id, scheduled_task_id, redeem_task_id, game_id, source, status,
             started_at, finished_at, scraped, error, redeem_summary_json
      FROM run_history
      ORDER BY started_at DESC
      LIMIT ?
    `),
  };
}

export function createRunHistoryStore(): RunHistoryStore {
  const contexts = new Map<GameIdValue, RunHistoryStoreContext>();

  function getContext(gameId: GameIdValue): RunHistoryStoreContext {
    const existing = contexts.get(gameId);

    if (existing) {
      return existing;
    }

    const created = createRunHistoryStoreContext(openGameDatabase(gameId));
    contexts.set(gameId, created);
    return created;
  }

  return {
    async record(options: RecordRunHistoryOptions): Promise<void> {
      const { task, result } = options;
      const { insertStmt } = getContext(task.gameId);

      insertStmt.run({
        id: randomUUID(),
        scheduled_task_id: task.metadata?.scheduledTaskId ?? null,
        redeem_task_id: result.taskId,
        game_id: task.gameId,
        source: task.source,
        status: result.status,
        started_at: result.startedAt,
        finished_at: result.finishedAt,
        scraped: result.scraped ? 1 : 0,
        scrape_stats_json: result.scrapeStats
          ? JSON.stringify(result.scrapeStats)
          : null,
        redeem_summary_json: result.redeemSummary
          ? JSON.stringify(result.redeemSummary)
          : null,
        error: result.error ?? null,
      });
    },

    async listRecent(limit: number): Promise<RunHistoryEntry[]> {
      const merged: RunHistoryEntry[] = [];

      for (const gameId of gameDatabaseIds) {
        const { listRecentStmt } = getContext(gameId);
        const rows = listRecentStmt.all(limit) as RunHistoryRow[];
        merged.push(...rows.map(rowToEntry));
      }

      return merged
        .sort((left, right) => right.startedAt.localeCompare(left.startedAt))
        .slice(0, limit);
    },
  };
}
