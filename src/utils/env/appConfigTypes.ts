export interface ChromeEnvConfig {
  executablePath: string;
  userDataDir: string;
  debugPort: number;
  headless: boolean;
}

export interface AppConfig {
  /** Shared data root (`DATABASE_URL` env). Bots place DB files under `<dataBaseDir>/<subfolder>/`. */
  dataBaseDir: string;
  schedulerPollIntervalMs: number;
  cliAdapterEnabled: boolean;
  telegramBotToken: string | null;
  telegramEnabled: boolean;
  /** Unset in env = enabled; set `MAL_FRIEND_REQUEST_BOT_ENABLED=false` to disable. */
  malFriendRequestBotEnabled?: boolean;
  chrome: ChromeEnvConfig;
}
