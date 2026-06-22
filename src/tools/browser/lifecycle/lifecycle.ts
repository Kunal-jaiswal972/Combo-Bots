import { execSync } from "node:child_process";
import path from "node:path";
import type { Browser } from "puppeteer-core";

import { getAppConfig, logger, sleep } from "@/utils";

import { BrowserDelays } from "../constants";

let activeBrowser: Browser | null = null;
let cleaningUp = false;
let intentionalClose = false;
let onUnexpectedDisconnect: (() => void) | null = null;

/**
 * Register what to do when the browser disconnects unexpectedly — the user
 * closed the debug window or Chrome crashed. Wired by the entry point to
 * trigger a full program shutdown; this tool stays free of process concerns.
 */
export function setOnBrowserDisconnect(handler: () => void): void {
  onUnexpectedDisconnect = handler;
}

/**
 * Force-kill any Chrome started against the debug profile (matched by its
 * user-data-dir). Leaves the user's normal Chrome untouched. Windows-only —
 * a no-op elsewhere. Best-effort: never throws.
 */
export function killExistingDebugChrome(userDataDir: string): void {
  if (process.platform !== "win32") {
    return;
  }

  const profileName = path.basename(userDataDir);

  try {
    execSync(
      `powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'chrome.exe' -and $_.CommandLine -like '*${profileName}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`,
      { stdio: "ignore" },
    );
  } catch {
    // best-effort cleanup
  }
}

export function bindBrowser(browser: Browser): void {
  activeBrowser = browser;
  intentionalClose = false;

  browser.once("disconnected", () => {
    if (intentionalClose) {
      return;
    }

    logger.warn("Debug browser closed.");
    onUnexpectedDisconnect?.();
  });
}

export async function closeBrowser(reason: string): Promise<void> {
  if (cleaningUp || !activeBrowser) {
    return;
  }

  cleaningUp = true;
  intentionalClose = true;

  const browser = activeBrowser;

  try {
    await Promise.race([
      browser.close(),
      sleep({ ms: BrowserDelays.CHROME_CLOSE_TIMEOUT }),
    ]);
  } catch {
    // best-effort — Chrome may already be gone
  } finally {
    // If the graceful close hung (e.g. the CDP connection was busy mid-run),
    // force-kill the debug Chrome so the session actually closes.
    if (browser.connected) {
      killExistingDebugChrome(getAppConfig().chrome.userDataDir);
    }

    activeBrowser = null;
    cleaningUp = false;
  }
}
