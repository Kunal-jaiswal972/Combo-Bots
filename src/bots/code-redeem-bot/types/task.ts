import { z } from "zod";

import { GameId, type GameIdValue } from "../config/constants";

export const credentialsSchema = z.preprocess((value) => {
  if (typeof value !== "object" || value === null) {
    return value;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.username === "string") {
    return value;
  }

  return value;
}, z.object({
  username: z.string().min(1),
  password: z.string(),
  server: z.string().min(1),
}));

export type GameLoginCredentials = z.infer<typeof credentialsSchema>;

/**
 * Non-empty source id stored on tasks and run history.
 * Use `validateTaskSource()` when creating or accepting a task — not this alone.
 */
export const taskSourceSchema = z.string().trim().min(1);
export type TaskSource = z.infer<typeof taskSourceSchema>;

export const gameIdValues = [GameId.GENSHIN, GameId.HSR] as [
  GameIdValue,
  ...GameIdValue[],
];

export const gameIdSchema = z.enum(gameIdValues);

export const scrapePolicySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("always") }),
  z.object({ type: z.literal("never") }),
  z.object({ type: z.literal("ifNotScrapedToday") }),
]);

export type ScrapePolicy = z.infer<typeof scrapePolicySchema>;

export const redeemTaskTemplateSchema = z.object({
  gameId: gameIdSchema,
  credentials: credentialsSchema,
  scrapePolicy: scrapePolicySchema,
  metadata: z.record(z.string()).optional(),
});

export type RedeemTaskTemplate = z.infer<typeof redeemTaskTemplateSchema>;

export const redeemTaskSchema = redeemTaskTemplateSchema.extend({
  id: z.string().min(1),
  source: taskSourceSchema,
  createdAt: z.string().min(1),
});

export type RedeemTask = z.infer<typeof redeemTaskSchema>;
