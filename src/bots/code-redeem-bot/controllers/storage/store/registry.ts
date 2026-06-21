import type {
  CodesStore,
  RunHistoryStore,
  ScheduledTaskStore,
} from "@/bots/code-redeem-bot/types.js";
import { bootstrapGameDatabases } from "../db.js";
import { createCodesStore } from "./codesStore.js";
import { createRunHistoryStore } from "./runHistoryStore.js";
import { createScheduledTaskStore } from "./scheduledTaskStore.js";

export interface BotStorage {
  readonly codes: CodesStore;
  readonly runHistory: RunHistoryStore;
  readonly scheduledTasks: ScheduledTaskStore;
}

let storage: BotStorage | null = null;

/** Opens DB, runs migrations, and wires all store implementations. */
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
