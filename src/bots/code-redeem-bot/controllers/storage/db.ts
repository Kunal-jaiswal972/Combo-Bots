import type Database from "better-sqlite3";
import type { GameIdValue } from "../../config/constants";
import {
  gameDatabaseIds,
  resolveGameDatabasePath,
} from "../../config/database";
import {
  closeAllDatabases,
  getNativeDatabase,
  openDatabase,
} from "@/tools/database";
import { runMigrations } from "./migrations";

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
