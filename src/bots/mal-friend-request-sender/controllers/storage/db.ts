import type Database from "better-sqlite3";

import {
  closeDatabase,
  type DbHandle,
  getNativeDatabase,
  openDatabase,
} from "@/tools/database";

import { resolveMalDatabasePath } from "../../config/database";
import { initSchema } from "./schema";

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
