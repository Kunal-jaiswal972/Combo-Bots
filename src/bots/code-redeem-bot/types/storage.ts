import type { GameIdValue } from "../config/constants";
import type { RedeemTask, RedeemTaskTemplate } from "./domain";
import type { CodeRedeemResult, RunHistoryEntry, RunResult } from "./run";
import type {
  CodeStoreMergeResult,
  NormalizedScrapedCode,
} from "./codes";
import type { ScheduledJobStore } from "@/tools/scheduler/job";

export interface MergeScrapedCodesOptions {
  gameId: GameIdValue;
  scraped: NormalizedScrapedCode[];
  source: string;
}

export interface PersistRedeemResultOptions {
  gameId: GameIdValue;
  result: CodeRedeemResult;
}

export interface CodesStore {
  hasScrapedToday(gameId: GameIdValue): Promise<boolean>;
  mergeScrapedCodes(options: MergeScrapedCodesOptions): Promise<CodeStoreMergeResult>;
  getRedeemResumeStats(
    gameId: GameIdValue,
  ): Promise<{ toRedeem: string[]; skipped: number }>;
  hasRedeemableCodes(gameId: GameIdValue): Promise<boolean>;
  persistRedeemResult(options: PersistRedeemResultOptions): Promise<void>;
}

export interface RecordRunHistoryOptions {
  task: RedeemTask;
  result: RunResult;
}

export interface RunHistoryStore {
  record(options: RecordRunHistoryOptions): Promise<void>;
  listRecent(limit: number): Promise<RunHistoryEntry[]>;
}

export type ScheduledTaskStore = ScheduledJobStore<RedeemTaskTemplate>;
