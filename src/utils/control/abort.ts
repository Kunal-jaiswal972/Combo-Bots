const controller = new AbortController();

/**
 * Process-wide cancellation token, tripped once on shutdown. Long waits
 * ({@link sleep}) and run loops observe it so they bail out immediately instead
 * of finishing their current iteration / fixed delay. Lives in utils (the
 * lowest layer) so any module can read it without depending on the entry point.
 */
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
