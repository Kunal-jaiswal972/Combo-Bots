import { z } from "zod";

import type { ChromeSession } from "@/tools/browser";

import type { GameIdValue } from "../constants";
import { redeemStatusValues } from "../constants";
import { type GameLoginCredentials } from "./task";

export const redeemSummarySchema = z.object({
  codesAttempted: z.number().int().nonnegative(),
  redeemed: z.number().int().nonnegative(),
  expired: z.number().int().nonnegative(),
  unavailable: z.number().int().nonnegative(),
  stillPending: z.number().int().nonnegative(),
});

export type RedeemSummary = z.infer<typeof redeemSummarySchema>;

export const scrapeStatsSchema = z.object({
  rowsFound: z.number().int().nonnegative(),
  codesUpserted: z.number().int().nonnegative(),
  activeCodes: z.number().int().nonnegative(),
  expiredCodes: z.number().int().nonnegative(),
  newCodes: z.array(z.string()),
});

export type ScrapeStats = z.infer<typeof scrapeStatsSchema>;

export const runResultStatusSchema = z.enum(["success", "partial", "failed"]);
export type RunResultStatus = z.infer<typeof runResultStatusSchema>;

export const runResultSchema = z.object({
  taskId: z.string().min(1),
  status: runResultStatusSchema,
  scraped: z.boolean(),
  scrapeStats: scrapeStatsSchema.nullable(),
  redeemSummary: redeemSummarySchema.nullable(),
  startedAt: z.string().min(1),
  finishedAt: z.string().min(1),
  error: z.string().optional(),
});

export type RunResult = z.infer<typeof runResultSchema>;

export const codeRedeemResultSchema = z.object({
  code: z.string().min(1),
  status: z.enum(redeemStatusValues),
  message: z.string(),
});

export type CodeRedeemResult = z.infer<typeof codeRedeemResultSchema>;

export interface GameRedeemOptions {
  credentials: GameLoginCredentials;
  codes: string[];
  /**
   * Skip the login step — the caller already established the session (the
   * interactive "Redeem codes" flow logs in on enter, so no password is held).
   */
  alreadyLoggedIn?: boolean;
  onCodeRedeemed?: (result: CodeRedeemResult) => Promise<void>;
}

export const runHistoryEntrySchema = z.object({
  id: z.string().min(1),
  scheduledTaskId: z.string().nullable(),
  redeemTaskId: z.string().min(1),
  gameId: z.string().min(1),
  source: z.string().min(1),
  status: runResultStatusSchema,
  startedAt: z.string().min(1),
  finishedAt: z.string().min(1),
  scraped: z.boolean(),
  error: z.string().nullable(),
  redeemSummary: redeemSummarySchema.nullable(),
});

export type RunHistoryEntry = z.infer<typeof runHistoryEntrySchema>;

export interface RedeemCodesOptions {
  gameId: GameIdValue;
  session: ChromeSession;
  credentials: GameLoginCredentials;
  alreadyLoggedIn?: boolean;
}

export interface RedeemWithGameEngineOptions {
  gameId: GameIdValue;
  session: ChromeSession;
  credentials: GameLoginCredentials;
  codes: string[];
  alreadyLoggedIn?: boolean;
}
