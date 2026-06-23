export type AdapterId = (typeof ADAPTER_IDS)[number];
export type BotId = (typeof BOT_IDS)[number];

// ─── Adapter IDs and labels ─────────────────────────────────────────────────
export const ADAPTER_ID_CLI = "cli" as const;
export const ADAPTER_LABEL_CLI = "CLI menu" as const;

export const ADAPTER_ID_TELEGRAM = "telegram" as const;
export const ADAPTER_LABEL_TELEGRAM = "Telegram bot" as const;

export const ADAPTER_IDS = [ADAPTER_ID_CLI, ADAPTER_ID_TELEGRAM] as const;

// ─── Bot IDs and labels ───────────────────────────────────────────────────────
export const BOT_ID_CODE_REDEEM = "code-redeem" as const;
export const BOT_LABEL_CODE_REDEEM = "Code Redeemer" as const;

export const BOT_ID_MAL = "mal-friend-request-sender" as const;
export const BOT_LABEL_MAL = "MAL Friend Request Sender" as const;

export const BOT_IDS = [BOT_ID_CODE_REDEEM, BOT_ID_MAL] as const;

// ─── Task trigger sources (non-adapter) ───────────────────────────────────────
export const TASK_SOURCE_SCHEDULER = "scheduler" as const;

/**
 * Human-readable label for every registered module (adapters + bots).
 * Useful in log output, CLI menus, and Telegram messages without importing
 * the full module.
 */
export const MODULE_LABELS = {
  [ADAPTER_ID_CLI]: ADAPTER_LABEL_CLI,
  [ADAPTER_ID_TELEGRAM]: ADAPTER_LABEL_TELEGRAM,
  [BOT_ID_CODE_REDEEM]: BOT_LABEL_CODE_REDEEM,
  [BOT_ID_MAL]: BOT_LABEL_MAL,
} as const satisfies Record<AdapterId | BotId, string>;

// ─── Application-wide defaults ────────────────────────────────────────────────
export const APP_DEFAULTS = {
  // env name - DATABASE_URL
  databaseUrl: "file:./src/data",
  // env name - SCHEDULER_TIMEZONE
  schedulerTimezone: "Asia/Kolkata",
  // env name - SCHEDULER_POLL_INTERVAL_MS
  schedulerPollIntervalMs: 10_000,
  // env name - CHROME_DEBUG_PORT
  chromeDebugPort: 9222,
} as const;

// ─── Module enable-flag env key convention ────────────────────────────────────

/**
 * Returns the env var key that gates a module.
 *
 * @example
 * moduleEnvKey("code-redeem")   // "CODE_REDEEM_ENABLED"
 * moduleEnvKey("telegram")      // "TELEGRAM_ENABLED"
 *
 * The authoritative implementation lives in `src/utils/env.ts`
 * (`moduleEnabledEnvKey`); this is a co-located documentation alias so
 * readers of this file can see the convention without chasing imports.
 */
export function moduleEnvKey(id: string): string {
  return `${id.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase()}_ENABLED`;
}
