import { z } from "zod";

import { dbGet, dbRun } from "@/tools/database";
import { StorageError } from "@/utils";

import { getMalDbHandle } from "./db";

export const malBotStateSchema = z.object({
  /** Last MAL username whose friend list was scraped (default for the prompt). */
  lastScrapedUsername: z.string().min(1).optional(),
});

export type MalBotState = z.infer<typeof malBotStateSchema>;

interface BotStateRow {
  readonly last_username: string | null;
}

const SELECT_STATE_SQL = "SELECT last_username FROM bot_state WHERE id = 1";

const UPSERT_STATE_SQL = `
  INSERT INTO bot_state (id, last_username)
  VALUES (1, ?)
  ON CONFLICT(id) DO UPDATE SET
    last_username = excluded.last_username
`;

export function loadMalBotState(): MalBotState {
  const handle = getMalDbHandle();
  const row = dbGet<BotStateRow>(handle, SELECT_STATE_SQL);

  if (row === undefined) {
    return {};
  }

  const state: MalBotState = {};
  const username = row.last_username?.trim() ?? "";

  if (username.length > 0) {
    state.lastScrapedUsername = username;
  }

  return state;
}

export function saveMalBotState(patch: MalBotState): MalBotState {
  const next = malBotStateSchema.parse({ ...loadMalBotState(), ...patch });
  const handle = getMalDbHandle();
  const lastUsername = next.lastScrapedUsername ?? null;

  try {
    dbRun(handle, UPSERT_STATE_SQL, [lastUsername]);
  } catch (error) {
    const cause = error instanceof Error ? error : undefined;
    throw new StorageError("Could not save MAL bot state.", cause);
  }

  return next;
}
