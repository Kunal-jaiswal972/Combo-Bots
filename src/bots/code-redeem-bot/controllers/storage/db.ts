import type Database from "better-sqlite3";
import type { GameIdValue } from "../../config/constants.js";
import {
  gameDatabaseIds,
  resolveGameDatabasePath,
} from "../../config/database.js";
import {
  closeAllDatabases,
  getNativeDatabase,
  openDatabase,
} from "@/shared/tools/database.js";
import { runMigrations } from "./migrations.js";

const migratedPaths = new Set<string>();

export function getDatabasePath(gameId: GameIdValue): string {
  return resolveGameDatabasePath(gameId);
}

/** Opens a game DB, runs migrations on first connect, returns the native handle. */
export function openGameDatabase(gameId: GameIdValue): Database.Database {
  const databasePath = resolveGameDatabasePath(gameId);
  const handle = openDatabase({ databasePath });
  const db = getNativeDatabase(handle);

  if (!migratedPaths.has(databasePath)) {
    runMigrations(db);
    migratedPaths.add(databasePath);
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
  migratedPaths.clear();
}
