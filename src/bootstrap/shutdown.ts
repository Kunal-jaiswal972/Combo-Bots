import readline from "node:readline";
import { triggerAbort } from "@/utils";

export type ShutdownHook = () => Promise<void> | void;

const SHUTDOWN_HOOKS: ShutdownHook[] = [];
const FORCE_EXIT_TIMEOUT_MS = 1_500;

let shuttingDown = false;

/** Plain (non-abortable) delay — used as the hard exit deadline during shutdown. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Register cleanup to run before the process exits. Hooks run concurrently. */
export function onShutdown(hook: ShutdownHook): void {
  SHUTDOWN_HOOKS.push(hook);
}

/**
 * Begin a graceful shutdown, then exit. Safe to call repeatedly — a second call
 * (e.g. another Ctrl+C) stops waiting and exits immediately.
 */
export async function requestShutdown(
  reason: string,
  exitCode: number,
): Promise<void> {
  if (shuttingDown) {
    process.exit(exitCode);
  }
  shuttingDown = true;

  // Trip the shared cancellation token so in-flight run loops and their fixed
  // delays bail out immediately instead of running to completion.
  triggerAbort();

  restoreTerminal();

  // Run cleanup concurrently, but never let it gate the exit beyond the grace
  // window — control returns to the terminal fast even if a hook hangs (e.g.
  // Telegram failing to abort its long-poll). Cleanup is best-effort.
  await Promise.race([
    Promise.allSettled(SHUTDOWN_HOOKS.map((hook) => Promise.resolve().then(hook))),
    delay(FORCE_EXIT_TIMEOUT_MS),
  ]);

  process.exit(exitCode);
}

function restoreTerminal(): void {
  try {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
  } catch {
    // stdin may not be a TTY
  }
}

/**
 * Install process-level termination handling. This is the program's single
 * owner of how it stops — tools and adapters only register cleanup via
 * {@link onShutdown} or trigger it via {@link requestShutdown}.
 *
 * SIGINT/SIGTERM/SIGHUP cover the case where no prompt is active (e.g. mid-run).
 * While @clack/prompts owns a prompt it puts stdin in raw mode, so Ctrl+C is
 * delivered as the keypress byte `\x03` instead of a SIGINT signal — the
 * keypress listener catches that so Ctrl+C also terminates from a menu.
 */
export function installShutdownHandlers(): void {
  process.on("SIGINT", () => void requestShutdown("SIGINT", 130));
  process.on("SIGTERM", () => void requestShutdown("SIGTERM", 0));
  process.on("SIGHUP", () => void requestShutdown("SIGHUP", 0));

  if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.on("keypress", (_str, key) => {
      if (key && key.ctrl && key.name === "c") {
        void requestShutdown("SIGINT", 130);
      }
    });
  }
}
