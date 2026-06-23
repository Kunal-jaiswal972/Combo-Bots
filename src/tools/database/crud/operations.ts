import type { RunResult } from "better-sqlite3";

import type { DbHandle } from "../connection/open";
import { getNativeDatabase } from "../connection/open";

export function dbRun(
  handle: DbHandle,
  sql: string,
  params: readonly unknown[] = [],
): RunResult {
  return getNativeDatabase(handle)
    .prepare(sql)
    .run(...params);
}

export function dbGet<T>(
  handle: DbHandle,
  sql: string,
  params: readonly unknown[] = [],
): T | undefined {
  return getNativeDatabase(handle)
    .prepare(sql)
    .get(...params) as T | undefined;
}

export function dbAll<T>(
  handle: DbHandle,
  sql: string,
  params: readonly unknown[] = [],
): T[] {
  return getNativeDatabase(handle)
    .prepare(sql)
    .all(...params) as T[];
}

export function dbExec(handle: DbHandle, sql: string): void {
  getNativeDatabase(handle).exec(sql);
}
