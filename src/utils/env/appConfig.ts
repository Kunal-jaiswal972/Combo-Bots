import os from "node:os";
import { z } from "zod";

import {
  type ChromePathSearchContext,
  expandChromeUserDataDir,
  resolveChromeExecutablePath,
} from "@/tools/browser/paths/chromePaths";

import { isValidIanaTimeZone } from "../datetime/dateTime";
import type { AppConfig } from "./appConfigTypes";

const DEFAULT_DATA_BASE_DIR = "file:./src/data";
const DEFAULT_SCHEDULER_POLL_INTERVAL_MS = 10_000;
const DEFAULT_SCHEDULER_TIMEZONE = "Asia/Kolkata";

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
  CHROME_DEBUG_PORT: z.coerce.number().int().min(1024).max(65535).default(9222),
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
