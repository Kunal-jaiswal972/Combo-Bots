export {
  CodeStatus,
  GameId,
  GenshinServer,
  RedeemStatus,
  codeStatusValues,
  redeemStatusValues,
  type CodeStatusValue,
  type GameIdValue,
  type GenshinServerValue,
  type RedeemStatusValue,
} from "../config/constants.js";

export type {
  GameLoginCredentials,
  RedeemTask,
  RedeemTaskTemplate,
  ScrapePolicy,
  TaskSource,
} from "./domain.js";
export {
  credentialsSchema,
  gameIdSchema,
  gameIdValues,
  redeemTaskSchema,
  redeemTaskTemplateSchema,
  scrapePolicySchema,
  taskSourceSchema,
} from "./domain.js";

export type { ScheduledTask, ScheduledTaskRecord } from "./schedule.js";
export { scheduledTaskRecordSchema } from "./schedule.js";

export type {
  CodeRedeemResult,
  GameRedeemOptions,
  RedeemCodesOptions,
  RedeemSummary,
  RedeemWithGameEngineOptions,
  RunHistoryEntry,
  RunResult,
  RunResultStatus,
  ScrapeStats,
} from "./run.js";
export {
  codeRedeemResultSchema,
  redeemSummarySchema,
  runHistoryEntrySchema,
  runResultSchema,
  runResultStatusSchema,
  scrapeStatsSchema,
} from "./run.js";

export type {
  CodeStoreEntry,
  CodeStoreMergeResult,
  NormalizedScrapedCode,
  ScrapedCodeRow,
} from "./codes.js";
export { scrapedCodeRowSchema } from "./codes.js";

export type {
  CodesStore,
  MergeScrapedCodesOptions,
  PersistRedeemResultOptions,
  RecordRunHistoryOptions,
  RunHistoryStore,
  ScheduledTaskStore,
} from "./storage.js";
