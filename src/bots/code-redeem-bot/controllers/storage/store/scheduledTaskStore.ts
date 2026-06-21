import type Database from "better-sqlite3";
import type {
  RedeemTaskTemplate,
  ScheduledTask,
  ScheduledTaskStore,
} from "@/bots/code-redeem-bot/types";
import { scheduledTaskRecordSchema } from "@/bots/code-redeem-bot/types";
import { parseStoredCredentials } from "@/bots/code-redeem-bot/utils/credentials";
import type { GameIdValue } from "@/bots/code-redeem-bot/config/constants";
import { gameDatabaseIds } from "@/bots/code-redeem-bot/config/database";
import type { ScheduleSpec } from "@/tools/scheduler/scheduleSpec";
import { openGameDatabase } from "../db";

interface ScheduledTaskRow {
  id: string;
  game_id: string;
  credentials_json: string;
  scrape_policy_json: string;
  metadata_json: string | null;
  schedule_json: string;
  enabled: number;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

interface ScheduledTaskStoreContext {
  readonly listStmt: Database.Statement;
  readonly upsertStmt: Database.Statement;
  readonly deleteStmt: Database.Statement;
  readonly selectCreatedAtStmt: Database.Statement;
}

function rowToScheduledTask(row: ScheduledTaskRow): ScheduledTask {
  const payloadTemplate: RedeemTaskTemplate = {
    gameId: row.game_id as RedeemTaskTemplate["gameId"],
    credentials: parseStoredCredentials(JSON.parse(row.credentials_json)),
    scrapePolicy: JSON.parse(
      row.scrape_policy_json,
    ) as RedeemTaskTemplate["scrapePolicy"],
    metadata: row.metadata_json
      ? (JSON.parse(row.metadata_json) as Record<string, string>)
      : undefined,
  };

  const task: ScheduledTask = {
    id: row.id,
    payloadTemplate,
    schedule: JSON.parse(row.schedule_json) as ScheduleSpec,
    enabled: row.enabled === 1,
    lastRunAt: row.last_run_at,
    nextRunAt: row.next_run_at,
  };

  return scheduledTaskRecordSchema.parse(task);
}

function createScheduledTaskStoreContext(
  db: Database.Database,
): ScheduledTaskStoreContext {
  return {
    listStmt: db.prepare(`
      SELECT id, game_id, credentials_json, scrape_policy_json, metadata_json,
             schedule_json, enabled, last_run_at, next_run_at, created_at
      FROM scheduled_tasks
      ORDER BY created_at ASC
    `),
    upsertStmt: db.prepare(`
      INSERT INTO scheduled_tasks (
        id, game_id, credentials_json, scrape_policy_json, metadata_json,
        schedule_json, enabled, last_run_at, next_run_at, created_at
      ) VALUES (
        @id, @game_id, @credentials_json, @scrape_policy_json, @metadata_json,
        @schedule_json, @enabled, @last_run_at, @next_run_at, @created_at
      )
      ON CONFLICT(id) DO UPDATE SET
        game_id = excluded.game_id,
        credentials_json = excluded.credentials_json,
        scrape_policy_json = excluded.scrape_policy_json,
        metadata_json = excluded.metadata_json,
        schedule_json = excluded.schedule_json,
        enabled = excluded.enabled,
        last_run_at = excluded.last_run_at,
        next_run_at = excluded.next_run_at
    `),
    deleteStmt: db.prepare(`
      DELETE FROM scheduled_tasks WHERE id = ?
    `),
    selectCreatedAtStmt: db.prepare(`
      SELECT created_at FROM scheduled_tasks WHERE id = ?
    `),
  };
}

export function createScheduledTaskStore(): ScheduledTaskStore {
  const contexts = new Map<GameIdValue, ScheduledTaskStoreContext>();

  function getContext(gameId: GameIdValue): ScheduledTaskStoreContext {
    const existing = contexts.get(gameId);

    if (existing) {
      return existing;
    }

    const created = createScheduledTaskStoreContext(openGameDatabase(gameId));
    contexts.set(gameId, created);
    return created;
  }

  return {
    async list(): Promise<ScheduledTask[]> {
      const tasks: Array<{ task: ScheduledTask; createdAt: string }> = [];

      for (const gameId of gameDatabaseIds) {
        const { listStmt } = getContext(gameId);
        const rows = listStmt.all() as ScheduledTaskRow[];
        for (const row of rows) {
          tasks.push({
            task: rowToScheduledTask(row),
            createdAt: row.created_at,
          });
        }
      }

      return tasks
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
        .map((entry) => entry.task);
    },

    async upsert(task: ScheduledTask): Promise<void> {
      scheduledTaskRecordSchema.parse(task);

      const gameId = task.payloadTemplate.gameId;
      const { upsertStmt, selectCreatedAtStmt } = getContext(gameId);
      const existing = selectCreatedAtStmt.get(task.id) as
        | { created_at: string }
        | undefined;

      upsertStmt.run({
        id: task.id,
        game_id: gameId,
        credentials_json: JSON.stringify(task.payloadTemplate.credentials),
        scrape_policy_json: JSON.stringify(task.payloadTemplate.scrapePolicy),
        metadata_json: task.payloadTemplate.metadata
          ? JSON.stringify(task.payloadTemplate.metadata)
          : null,
        schedule_json: JSON.stringify(task.schedule),
        enabled: task.enabled ? 1 : 0,
        last_run_at: task.lastRunAt,
        next_run_at: task.nextRunAt,
        created_at: existing?.created_at ?? new Date().toISOString(),
      });
    },

    async delete(taskId: string): Promise<void> {
      for (const gameId of gameDatabaseIds) {
        const { deleteStmt } = getContext(gameId);
        const result = deleteStmt.run(taskId);

        if (result.changes > 0) {
          return;
        }
      }
    },
  };
}
