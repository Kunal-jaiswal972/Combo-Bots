import type { AppConfig } from "@/shared/utils/env/appConfigTypes.js";
import type { SchedulerRunner } from "@/shared/tools/scheduler/schedulerRunner.js";
import type { ScheduledRunNotifier } from "./scheduledRunNotifier.js";
import type { DisplayPresenter } from "./displayPresenter.js";
import type { PromptPort } from "./promptPort.js";

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
  menuActions(ctx: BotContext): BotMenuAction[];
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
  isEnabled(appConfig: AppConfig): boolean;
  create(options: BotModuleCreateOptions): Bot;
}

export type { SchedulerRunner };
