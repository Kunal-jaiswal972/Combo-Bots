import type { Bot } from "./bot";
import type { DisplayPresenter } from "./display/display";
import type { PromptPort } from "./prompts/prompts";
import type { SchedulableRunPayload, ScheduledRunNotifier } from "./scheduling";

/** Long-running input surface (CLI menu or Telegram bot polling). */
export interface TaskInputAdapter {
  readonly id: string;
  readonly label: string;
  start(): Promise<void>;
  stop(): Promise<void>;
}

/** Shared terminal I/O bundle — scheduler fallback and the CLI menu adapter. */
export interface TerminalPorts {
  readonly prompt: PromptPort;
  readonly display: DisplayPresenter;
}

export type AdapterLifecycle = "background" | "foreground";

export interface AdapterModuleCreateOptions {
  readonly terminal: TerminalPorts;
  readonly bots: readonly Bot[];
  readonly onScheduledRun?: (
    port: PromptPort,
    payload: SchedulableRunPayload,
  ) => Promise<void>;
}

export interface AdapterModuleInstance {
  readonly adapter: TaskInputAdapter;
  readonly scheduledRunNotifier?: ScheduledRunNotifier;
}

/** Plug-in input surface. Register implementations in `adapters/registry`. */
export interface AdapterModule {
  readonly id: string;
  readonly label: string;
  readonly lifecycle: AdapterLifecycle;
  isEnabled(): boolean;
  create(options: AdapterModuleCreateOptions): AdapterModuleInstance;
}
