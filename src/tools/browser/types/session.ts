import type { Browser, Page } from "puppeteer-core";

export interface ChromeLaunchOptions {
  readonly executablePath: string;
  readonly userDataDir: string;
  readonly debugPort: number;
  readonly headless: boolean;
}

export interface ChromeSession {
  readonly browser: Browser;
  readonly page: Page;
}

export interface ChromeVersionResponse {
  readonly webSocketDebuggerUrl: string;
}
