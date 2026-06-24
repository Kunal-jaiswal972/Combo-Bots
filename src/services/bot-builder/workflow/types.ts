import type { PromptPort } from "@/services/bridge";
import type { ChromeSession } from "@/tools/browser";

/**
 * Threaded through every workflow step. `state` is the bot's typed scratch bag
 * (e.g. logged-in account, target username, fetched list); `prompt` is the
 * active adapter port, so any prompt/notify reaches CLI and Telegram alike.
 */
export interface WorkflowContext<S> {
  readonly prompt: PromptPort;
  readonly state: S;
  /** Browser session for session-backed bots; null when none was opened. */
  readonly session: ChromeSession | null;
}

export type StepHandler<S> = (ctx: WorkflowContext<S>) => Promise<void> | void;

export type Predicate<S> = (
  ctx: WorkflowContext<S>,
) => boolean | Promise<boolean>;

/**
 * The engine only knows two primitives — `action` and `branch`. Higher-level
 * sugar (prompt, forEach, notify) is compiled down to these by the builder.
 */
export type Step<S> =
  | {
      readonly kind: "action";
      readonly name: string;
      readonly run: StepHandler<S>;
    }
  | {
      readonly kind: "branch";
      readonly name: string;
      readonly when: Predicate<S>;
      readonly then: readonly Step<S>[];
      readonly otherwise: readonly Step<S>[];
    };

export interface Workflow<S> {
  readonly name: string;
  readonly steps: readonly Step<S>[];
}
