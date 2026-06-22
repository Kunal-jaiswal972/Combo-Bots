/** Timeouts and pacing for browser automation (Puppeteer). */
export const BrowserDelays = {
  SHORT: 5_000,
  LONG: 10_000,
  TYPE_MIN: 10,
  TYPE_MAX: 100,
  RANDOM_ACTION_MIN: 300,
  RANDOM_ACTION_MAX: 1_000,
  CHROME_CLOSE_TIMEOUT: 4_000,
  WS_FETCH_INTERVAL: 1_000,
  POST_KILL: 1_000,
} as const;

export const BrowserConfig = {
  WS_FETCH_RETRIES: 20,
  PROTOCOL_TIMEOUT: 180_000,
  PAGE_TIMEOUT: 30_000,
  NAVIGATION_TIMEOUT: 60_000,
} as const;
