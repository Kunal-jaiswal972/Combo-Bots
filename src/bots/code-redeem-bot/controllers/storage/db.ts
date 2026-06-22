import type Database from "better-sqlite3";

import {
  closeAllDatabases,
  getNativeDatabase,
  openDatabase,
} from "@/tools/database";

import type { GameIdValue } from "../../config/constants";
import {
  gameDatabaseIds,
  resolveGameDatabasePath,
} from "../../config/database";
import { initSchema } from "./schema";

const initializedPaths = new Set<string>();

export function getDatabasePath(gameId: GameIdValue): string {
  return resolveGameDatabasePath(gameId);
}

/** Opens a game DB, applies schema on first connect, returns the native handle. */
export function openGameDatabase(gameId: GameIdValue): Database.Database {
  const databasePath = resolveGameDatabasePath(gameId);
  const handle = openDatabase({ databasePath });
  const db = getNativeDatabase(handle);

  if (!initializedPaths.has(databasePath)) {
    initSchema(db);
    initializedPaths.add(databasePath);
  }

  return db;
}

export function bootstrapGameDatabases(): void {
  for (const gameId of gameDatabaseIds) {
    openGameDatabase(gameId);
  }
}

export function closeBotDatabase(): void {
  closeAllDatabases();
  initializedPaths.clear();
}
