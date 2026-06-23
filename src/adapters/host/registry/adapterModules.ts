import { cliAdapterModule } from "@/adapters/cli";
import { telegramAdapterModule } from "@/adapters/telegram";
import type { AppConfig } from "@/utils";

import type {
  Bot,
  PromptPort,
  SchedulableRunPayload,
  ScheduledRunNotifier,
  TaskInputAdapter,
} from "../contracts";
import type { TerminalPorts } from "../core/terminalPorts";

export type AdapterLifecycle = "background" | "foreground";

export interface AdapterModuleCreateOptions {
  readonly terminal: TerminalPorts;
  readonly appConfig: AppConfig;
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

/** Plug-in input surface. Register implementations in `adapterModules` below. */
export interface AdapterModule {
  readonly id: string;
  readonly label: string;
  readonly lifecycle: AdapterLifecycle;
  isEnabled(): boolean;
  create(options: AdapterModuleCreateOptions): AdapterModuleInstance;
}

/**
 * Central adapter registry. To add an adapter (e.g. Discord, HTTP API):
 * 1. Implement `AdapterModule` under `adapters/<name>/`
 * 2. Append it here
 */
export const adapterModules = [
  cliAdapterModule,
  telegramAdapterModule,
] as const satisfies readonly AdapterModule[];

export function getRegisteredAdapterIds(): readonly string[] {
  return adapterModules.map((module) => module.id);
}
