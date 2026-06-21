import { randomUUID } from "node:crypto";
import type { GameIdValue } from "@/bots/code-redeem-bot/config/constants.js";
import { validateGameCredentials } from "@/bots/code-redeem-bot/hoyoverse/shared/credentials.js";
import {
  redeemTaskSchema,
  type GameLoginCredentials,
  type RedeemTask,
  type ScrapePolicy,
  type TaskSource,
} from "@/bots/code-redeem-bot/types.js";
import { validateTaskSource } from "@/shared/adapters/host/registry/taskSource.js";

export interface CreateRedeemTaskInput {
  gameId: GameIdValue;
  credentials: GameLoginCredentials;
  scrapePolicy: ScrapePolicy;
  source: TaskSource;
  metadata?: Record<string, string>;
}

/** Builds a validated `RedeemTask` from menu/scheduler user input. */
export function createRedeemTask(input: CreateRedeemTaskInput): RedeemTask {
  const credentials = validateGameCredentials(input.gameId, input.credentials);
  const source = validateTaskSource(input.source);

  const task: RedeemTask = {
    id: randomUUID(),
    gameId: input.gameId,
    credentials,
    scrapePolicy: input.scrapePolicy,
    source,
    createdAt: new Date().toISOString(),
    metadata: input.metadata,
  };

  redeemTaskSchema.parse(task);
  return task;
}
