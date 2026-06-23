import type {
  CodesStore,
  RunHistoryStore,
  ScheduledTaskStore,
} from "../../../types";
import { bootstrapGameDatabases } from "../db";
import { createCodesStore } from "./codesStore";
import { createRunHistoryStore } from "./runHistoryStore";
import { createScheduledTaskStore } from "./scheduledTaskStore";

export interface BotStorage {
  readonly codes: CodesStore;
  readonly runHistory: RunHistoryStore;
  readonly scheduledTasks: ScheduledTaskStore;
}

let storage: BotStorage | null = null;

/** Opens DB, applies schema, and wires all store implementations. */
export function bootstrapStorage(): BotStorage {
  bootstrapGameDatabases();

  if (!storage) {
    storage = {
      codes: createCodesStore(),
      runHistory: createRunHistoryStore(),
      scheduledTasks: createScheduledTaskStore(),
    };
  }

  return storage;
}

export function getStorage(): BotStorage {
  if (!storage) {
    return bootstrapStorage();
  }

  return storage;
}

export function resetStorage(): void {
  storage = null;
}
