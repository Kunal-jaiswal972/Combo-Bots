import type Database from "better-sqlite3";

import { BOT_ID_MAL } from "@/config";
import {
  closeDatabase,
  type DbHandle,
  getNativeDatabase,
  openDatabase,
  resolveDataBaseDir,
  resolveDatabasePath,
} from "@/tools/database";
import { getAppConfig } from "@/utils";

import { initSchema } from "./schema";

/** e.g. src/data/mal-friend-request-sender/mal-friend-request-sender.db */
function resolveMalDatabasePath(): string {
  const appConfig = getAppConfig();

  return resolveDatabasePath({
    basePath: resolveDataBaseDir(appConfig.dataBaseDir),
    subfolder: BOT_ID_MAL,
    filename: `${BOT_ID_MAL}.db`,
  });
}

const initializedPaths = new Set<string>();
let malDbHandle: DbHandle | null = null;

export function openMalDatabase(): Database.Database {
  const databasePath = resolveMalDatabasePath();
  const handle = openDatabase({ databasePath });
  const db = getNativeDatabase(handle);

  if (!initializedPaths.has(databasePath)) {
    initSchema(db);
    initializedPaths.add(databasePath);
  }

  malDbHandle = handle;
  return db;
}

export function getMalDbHandle(): DbHandle {
  openMalDatabase();

  if (malDbHandle === null) {
    malDbHandle = openDatabase({ databasePath: resolveMalDatabasePath() });
  }

  return malDbHandle;
}

export function bootstrapMalStorage(): void {
  openMalDatabase();
}

export function closeMalDatabase(): void {
  if (malDbHandle !== null) {
    const databasePath = malDbHandle.path;
    closeDatabase(malDbHandle);
    malDbHandle = null;
    initializedPaths.delete(databasePath);
  }
}
