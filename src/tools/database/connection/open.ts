import type Database from "better-sqlite3";
import BetterSqlite3 from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { StorageError } from "@/utils";

export interface DbHandle {
  readonly path: string;
}

const registry = new Map<string, Database.Database>();

export interface OpenDatabaseOptions {
  readonly databasePath: string;
}

export function openDatabase(options: OpenDatabaseOptions): DbHandle {
  const resolvedPath = path.resolve(options.databasePath);
  const existing = registry.get(resolvedPath);

  if (existing) {
    return { path: resolvedPath };
  }

  const parentDir = path.dirname(resolvedPath);

  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  try {
    const db = new BetterSqlite3(resolvedPath);
    registry.set(resolvedPath, db);
    return { path: resolvedPath };
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new StorageError(
      `Failed to open SQLite database at ${resolvedPath}.`,
      cause,
    );
  }
}

/** Infrastructure bridge until stores use CRUD helpers directly. */
export function getNativeDatabase(handle: DbHandle): Database.Database {
  const db = registry.get(handle.path);

  if (!db) {
    throw new StorageError(`Database not open at ${handle.path}.`);
  }

  return db;
}

export function closeDatabase(handle: DbHandle): void {
  const db = registry.get(handle.path);

  if (db) {
    db.close();
    registry.delete(handle.path);
  }
}

export function closeAllDatabases(): void {
  for (const [key, db] of registry.entries()) {
    db.close();
    registry.delete(key);
  }
}
