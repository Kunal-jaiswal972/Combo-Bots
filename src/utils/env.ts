import os from "node:os";
import dotenv from "dotenv";
import { z } from "zod";

import { APP_DEFAULTS } from "@/config";
import {
  type ChromePathSearchContext,
  expandChromeUserDataDir,
  resolveChromeExecutablePath,
} from "@/tools/browser/paths/chromePaths";

import { isValidIanaTimeZone } from "./datetime";

// ── Loading ──────────────────────────────────────────────────────────────────

/** Loads `.env` into `process.env`. This is the only module allowed to touch dotenv. */
export function loadEnvFile(): void {
  const result = dotenv.config();

  if (result.error) {
    const errnoError = result.error as NodeJS.ErrnoException;

    if (errnoError.code !== "ENOENT") {
      throw new Error(`Failed to load .env file: ${result.error.message}`);
    }
  }
}

// ── Module feature flags ─────────────────────────────────────────────────────

const TRUE_PATTERN = /^(1|true|yes|on)$/i;
const FALSE_PATTERN = /^(0|false|no|off)$/i;

/**
 * Env var that gates a module by its id, e.g.
 * `"code-redeem"` -> `CODE_REDEEM_ENABLED`, `"telegram"` -> `TELEGRAM_ENABLED`.
 */
export function moduleEnabledEnvKey(id: string): string {
  return `${id.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase()}_ENABLED`;
}

/**
 * Resolve whether a module (bot or adapter) is enabled.
 *
 * The env var `<ID>_ENABLED` takes priority when set to a recognized value;
 * otherwise the module's source-code `fallback` is used. This lets every
 * module declare its own default while staying overridable per-deployment
 * without pre-declaring each flag in the config schema.
 */
export function isModuleEnabled(id: string, fallback: boolean): boolean {
  const raw = process.env[moduleEnabledEnvKey(id)]?.trim();

  if (!raw) {
    return fallback;
  }

  if (TRUE_PATTERN.test(raw)) {
    return true;
  }

  if (FALSE_PATTERN.test(raw)) {
    return false;
  }

  return fallback;
}

// ── Application config ───────────────────────────────────────────────────────

export interface ChromeEnvConfig {
  executablePath: string;
  userDataDir: string;
  debugPort: number;
  headless: boolean;
}

export interface AppConfig {
  /** Shared data root (`DATABASE_URL` env). Bots place DB files under `<dataBaseDir>/<subfolder>/`. */
  dataBaseDir: string;
  /** IANA timezone for schedule times and display (`SCHEDULER_TIMEZONE`). */
  schedulerTimezone: string;
  schedulerPollIntervalMs: number;
  /** Telegram bot token (`TELEGRAM_BOT_TOKEN`), or null when unset. */
  telegramBotToken: string | null;
  chrome: ChromeEnvConfig;
}

const DEFAULT_DATA_BASE_DIR = APP_DEFAULTS.databaseUrl;
const DEFAULT_SCHEDULER_POLL_INTERVAL_MS = APP_DEFAULTS.schedulerPollIntervalMs;
const DEFAULT_SCHEDULER_TIMEZONE = APP_DEFAULTS.schedulerTimezone;
const DEFAULT_CHROME_DEBUG_PORT = APP_DEFAULTS.chromeDebugPort;

const booleanFromEnv = z
  .string()
  .default("false")
  .transform((value) => /^(1|true|yes|on)$/i.test(value));

const appConfigSchema = z.object({
  DATABASE_URL: z.string().min(1).default(DEFAULT_DATA_BASE_DIR),
  SCHEDULER_TIMEZONE: z
    .string()
    .min(1)
    .default(DEFAULT_SCHEDULER_TIMEZONE)
    .refine((timeZone) => isValidIanaTimeZone(timeZone), {
      message: "Must be a valid IANA timezone identifier",
    }),
  SCHEDULER_POLL_INTERVAL_MS: z.coerce
    .number()
    .int()
    .min(5_000)
    .max(3_600_000)
    .default(DEFAULT_SCHEDULER_POLL_INTERVAL_MS),
  CHROME_EXECUTABLE_PATH: z.string().optional(),
  CHROME_USER_DATA_DIR: z.string().optional(),
  CHROME_DEBUG_PORT: z.coerce
    .number()
    .int()
    .min(1024)
    .max(65535)
    .default(DEFAULT_CHROME_DEBUG_PORT),
  HEADLESS: booleanFromEnv,
  TELEGRAM_BOT_TOKEN: z.string().optional(),
});

let cachedAppConfig: AppConfig | null = null;

export function getAppConfig(): AppConfig {
  if (cachedAppConfig) {
    return cachedAppConfig;
  }

  const result = appConfigSchema.safeParse(process.env);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`Invalid application configuration:\n${details}`);
  }

  const raw = result.data;

  const localAppData = process.env.LOCALAPPDATA ?? os.homedir();
  const chromeSearchContext: ChromePathSearchContext = {
    localAppData,
    platform: process.platform,
    programFiles: process.env.PROGRAMFILES,
    programFilesX86: process.env["PROGRAMFILES(X86)"],
  };

  const chromeUserDataDir = expandChromeUserDataDir({
    configuredDir: raw.CHROME_USER_DATA_DIR,
    localAppData,
  });

  const chromeExecutablePath = raw.CHROME_EXECUTABLE_PATH?.trim();
  const telegramToken = raw.TELEGRAM_BOT_TOKEN?.trim();
  const hasTelegramToken =
    telegramToken !== undefined && telegramToken.length > 0;

  cachedAppConfig = {
    dataBaseDir: raw.DATABASE_URL,
    schedulerTimezone: raw.SCHEDULER_TIMEZONE,
    schedulerPollIntervalMs: raw.SCHEDULER_POLL_INTERVAL_MS,
    telegramBotToken: hasTelegramToken ? telegramToken : null,
    chrome: {
      executablePath: resolveChromeExecutablePath({
        configuredPath: chromeExecutablePath,
        searchContext: chromeSearchContext,
      }),
      userDataDir: chromeUserDataDir,
      debugPort: raw.CHROME_DEBUG_PORT,
      headless: raw.HEADLESS,
    },
  };

  return cachedAppConfig;
}
