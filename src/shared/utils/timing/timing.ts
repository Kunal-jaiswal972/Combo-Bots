import { logger } from "../log/logger.js";
import type { WaitOptions, WaitUntilOptions } from "./waitTypes.js";

export function formatWaitMs(ms: number): string {
  return `${ms}ms`;
}

/** Fixed delay. Logs planned duration before waiting starts. */
export async function sleep(options: WaitOptions): Promise<void> {
  if (options.reason) {
    logger.wait(`Waiting ${formatWaitMs(options.ms)} — ${options.reason}`);
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, options.ms);
  });
}

/** Async wait (selector, network, modal, etc.). Logs before waiting. */
export async function waitUntil<T>(options: WaitUntilOptions<T>): Promise<T> {
  const maxLabel =
    options.maxMs !== undefined ? ` (max ${formatWaitMs(options.maxMs)})` : "";
  logger.wait(`Waiting — ${options.reason}${maxLabel}`);
  return options.operation();
}

export interface RetryOptions<T> {
  readonly attempts: number;
  readonly delayMs: number;
  readonly operation: () => Promise<T>;
  readonly shouldRetry?: (error: unknown) => boolean;
  readonly reason?: string;
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

export interface PollUntilOptions<T> {
  readonly intervalMs: number;
  readonly timeoutMs: number;
  readonly operation: () => Promise<T | null | undefined>;
  readonly reason?: string;
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
