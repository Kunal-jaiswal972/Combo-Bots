import type Database from "better-sqlite3";

import { BOT_ID_CODE_REDEEM } from "@/config";
import {
  closeAllDatabases,
  getNativeDatabase,
  openDatabase,
  resolveDataBaseDir,
  resolveDatabasePath,
} from "@/tools/database";
import { getAppConfig } from "@/utils";

import { GameId, type GameIdValue } from "../constants";
import { initSchema } from "./schema";

export const gameDatabaseIds = Object.values(GameId) as [
  GameIdValue,
  ...GameIdValue[],
];

/** e.g. src/data/code-redeem/genshin.db, src/data/code-redeem/hsr.db */
export function resolveGameDatabasePath(gameId: GameIdValue): string {
  const appConfig = getAppConfig();

  return resolveDatabasePath({
    basePath: resolveDataBaseDir(appConfig.dataBaseDir),
    subfolder: BOT_ID_CODE_REDEEM,
    filename: `${gameId}.db`,
  });
}

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
