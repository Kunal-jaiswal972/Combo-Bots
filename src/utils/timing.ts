import { logger } from "./logger";

// ── Cancellation token ──────────────────────────────────────────────────────
// Process-wide token, tripped once on shutdown. Long waits (sleep) and run
// loops observe it so they bail out immediately instead of finishing their
// current iteration / fixed delay. Lives in utils (the lowest layer) so any
// module can read it without depending on the entry point.

const controller = new AbortController();

export const abortSignal: AbortSignal = controller.signal;

export function isAborted(): boolean {
  return controller.signal.aborted;
}

/** Trip the token. Idempotent — owned by the shutdown sequence. */
export function triggerAbort(): void {
  if (!controller.signal.aborted) {
    controller.abort();
  }
}

// ── Options ─────────────────────────────────────────────────────────────────

export interface WaitOptions {
  ms: number;
  reason?: string;
}

export interface WaitUntilOptions<T> {
  reason: string;
  operation: () => Promise<T>;
  maxMs?: number;
}

export interface GetRandomDelayOptions {
  min: number;
  max: number;
}

export interface RetryOptions<T> {
  readonly attempts: number;
  readonly delayMs: number;
  readonly operation: () => Promise<T>;
  readonly shouldRetry?: (error: unknown) => boolean;
  readonly reason?: string;
}

export interface PollUntilOptions<T> {
  readonly intervalMs: number;
  readonly timeoutMs: number;
  readonly operation: () => Promise<T | null | undefined>;
  readonly reason?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function formatWaitMs(ms: number): string {
  return `${ms}ms`;
}

export function getRandomDelay(options: GetRandomDelayOptions): number {
  return (
    Math.floor(Math.random() * (options.max - options.min + 1)) + options.min
  );
}

/** Fixed delay. Resolves early if shutdown is requested. */
export async function sleep(options: WaitOptions): Promise<void> {
  if (abortSignal.aborted) {
    return;
  }

  if (options.reason) {
    logger.wait(`Waiting ${formatWaitMs(options.ms)} — ${options.reason}`);
  }

  await new Promise<void>((resolve) => {
    const onAbort = (): void => {
      clearTimeout(timer);
      resolve();
    };

    const timer = setTimeout(() => {
      abortSignal.removeEventListener("abort", onAbort);
      resolve();
    }, options.ms);

    abortSignal.addEventListener("abort", onAbort, { once: true });
  });
}

/** Async wait (selector, network, modal, etc.). Logs before waiting. */
export async function waitUntil<T>(options: WaitUntilOptions<T>): Promise<T> {
  const maxLabel =
    options.maxMs !== undefined ? ` (max ${formatWaitMs(options.maxMs)})` : "";
  logger.wait(`Waiting — ${options.reason}${maxLabel}`);
  return options.operation();
}

export async function retry<T>(options: RetryOptions<T>): Promise<T> {
  const shouldRetry = options.shouldRetry ?? (() => true);
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await options.operation();
    } catch (error) {
      lastError = error;
      if (attempt >= options.attempts || !shouldRetry(error)) {
        break;
      }
      const label = options.reason ?? "retry";
      logger.wait(
        `${label}: attempt ${attempt}/${options.attempts} failed, retrying in ${formatWaitMs(options.delayMs)}`,
      );
      await sleep({ ms: options.delayMs });
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error(String(lastError));
}

export async function pollUntil<T>(options: PollUntilOptions<T>): Promise<T> {
  const deadline = Date.now() + options.timeoutMs;

  while (Date.now() < deadline) {
    const result = await options.operation();
    if (result !== null && result !== undefined) {
      return result;
    }
    await sleep({ ms: options.intervalMs, reason: options.reason });
  }

  throw new Error(
    options.reason
      ? `pollUntil timed out: ${options.reason}`
      : "pollUntil timed out",
  );
}

export function backoffDelay(
  attempt: number,
  baseMs: number,
  maxMs: number,
): number {
  const delay = baseMs * 2 ** Math.max(0, attempt - 1);
  return Math.min(delay, maxMs);
}
