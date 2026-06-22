import { dbGet, dbRun } from "@/tools/database";
import { StorageError } from "@/utils";
import {
  malBotStateSchema,
  type MalBotState,
} from "../../../types/state";
import { getMalDbHandle } from "../db";

interface BotStateRow {
  readonly is_logged_in: number;
  readonly last_username: string | null;
}

const SELECT_STATE_SQL =
  "SELECT is_logged_in, last_username FROM bot_state WHERE id = 1";

const UPSERT_STATE_SQL = `
  INSERT INTO bot_state (id, is_logged_in, last_username)
  VALUES (1, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    is_logged_in = excluded.is_logged_in,
    last_username = excluded.last_username
`;

export function loadMalBotState(): MalBotState {
  const handle = getMalDbHandle();
  const row = dbGet<BotStateRow>(handle, SELECT_STATE_SQL);

  if (row === undefined) {
    return {};
  }

  const state: MalBotState = {};

  if (row.is_logged_in === 1) {
    state.isLoggedIn = true;
  }

  const username = row.last_username?.trim() ?? "";

  if (username.length > 0) {
    state.lastUsername = username;
  }

  return state;
}

export function saveMalBotState(patch: MalBotState): MalBotState {
  const next = malBotStateSchema.parse({ ...loadMalBotState(), ...patch });
  const handle = getMalDbHandle();

  const isLoggedIn = next.isLoggedIn === true ? 1 : 0;
  const lastUsername = next.lastUsername ?? null;

  try {
    dbRun(handle, UPSERT_STATE_SQL, [isLoggedIn, lastUsername]);
  } catch (error) {
    const cause = error instanceof Error ? error : undefined;
    throw new StorageError("Could not save MAL bot state.", cause);
  }

  return next;
}
