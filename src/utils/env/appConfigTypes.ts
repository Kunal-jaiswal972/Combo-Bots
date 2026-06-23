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
