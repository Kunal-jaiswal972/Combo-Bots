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
  chrome: ChromeEnvConfig;
}
