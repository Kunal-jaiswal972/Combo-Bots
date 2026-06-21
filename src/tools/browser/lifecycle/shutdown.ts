import type { Browser } from "puppeteer-core";
import { closeActiveUiPrompt } from "@/adapters/host/core/promptShutdown";
import { sleep } from "@/utils";import { BrowserDelays } from "../constants";

let activeBrowser: Browser | null = null;
let cleaningUp = false;
const shutdownHooks: Array<() => Promise<void>> = [];

export function registerShutdownHook(hook: () => Promise<void>): void {
  shutdownHooks.push(hook);
}

export function bindBrowser(browser: Browser): void {
  activeBrowser = browser;
}

export async function closeBrowser(reason: string): Promise<void> {
  if (cleaningUp || !activeBrowser) {
    return;
  }

  cleaningUp = true;

  try {
    await Promise.race([
      activeBrowser.close(),
      sleep({ ms: BrowserDelays.CHROME_CLOSE_TIMEOUT }),
    ]);
  } catch {
    // best-effort — Chrome may already be gone
  } finally {
    activeBrowser = null;
    cleaningUp = false;
  }
}

async function shutdown(reason: string, exitCode: number): Promise<void> {
  closeActiveUiPrompt();

  try {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
  } catch {
    // stdin may not be a TTY
  }

  for (const hook of shutdownHooks) {
    try {
      await hook();
    } catch {
      // best-effort shutdown
    }
  }

  await closeBrowser(reason);
  process.exit(exitCode);
}

export function registerShutdownHandlers(): void {
  process.on("SIGINT", () => {
    void shutdown("SIGINT", 130);
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM", 0);
  });

  process.on("SIGHUP", () => {
    void shutdown("SIGHUP", 0);
  });
}
