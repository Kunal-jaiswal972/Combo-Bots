import { randomUUID } from "node:crypto";

import { validateTaskSource } from "@/services/adapter-builder";

import type { GameIdValue } from "../constants";
import { validateGameCredentials } from "../hoyoverse/shared/credentials";
import {
  type GameLoginCredentials,
  type RedeemTask,
  redeemTaskSchema,
  type ScrapePolicy,
  type TaskSource,
} from "../types";

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
