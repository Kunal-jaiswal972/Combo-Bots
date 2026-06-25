import type { SchedulerRunner } from "@/tools/scheduler";

import type { DisplayPresenter } from "./display/display";
import type { PromptPort } from "./prompts/prompts";
import type { SchedulableRunPayload, ScheduledRunNotifier } from "./scheduling";

export interface BotContext {
  readonly prompt: PromptPort;
  readonly display: DisplayPresenter;
  /** Open adapter id: `"cli"`, `"telegram"`, `"scheduler"`, … */
  readonly source: string;
  readonly metadata?: Record<string, string>;
}

export interface BotMenuAction {
  readonly id: string;
  readonly label: string;
  run(ctx: BotContext): Promise<void>;
}

export interface Bot {
  readonly id: string;
  readonly label: string;
  start?(): Promise<void>;
  stop?(): Promise<void>;
  /** Runs once when the user opens this bot, before its action menu. */
  enter?(ctx: BotContext): Promise<void>;
  /** Runs when leaving the bot (Back / shutdown), for per-session cleanup. */
  leave?(): Promise<void>;
  menuActions(ctx: BotContext): BotMenuAction[];
  /**
   * Execute a scheduler-triggered payload that belongs to this bot. The bot
   * validates the payload (e.g. against its own schema) and returns `true` if
   * it handled it, or `false` to let another bot try. Keeps scheduled-run
   * dispatch out of the bootstrap layer.
   */
  runScheduledTask?(
    port: PromptPort,
    payload: SchedulableRunPayload,
  ): Promise<boolean>;
}

export interface BotModuleCreateOptions {
  readonly getScheduledRunNotifiers?: () => readonly ScheduledRunNotifier[];
  readonly terminalPrompt?: PromptPort;
}

export interface BotModule {
  readonly id: string;
  readonly label: string;
  /** Non-adapter trigger ids this bot uses (e.g. scheduler). Registered at bootstrap. */
  readonly taskTriggerSources?: readonly string[];
  isEnabled(): boolean;
  create(options: BotModuleCreateOptions): Bot;
}

export type { SchedulerRunner };
