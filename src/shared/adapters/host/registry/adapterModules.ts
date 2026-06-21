import type { AppConfig } from "@/shared/utils/env/appConfigTypes.js";
import type { Bot } from "@/shared/adapters/host/contracts/bot.js";
import type {
  SchedulableRunPayload,
  ScheduledRunNotifier,
} from "@/shared/adapters/host/contracts/scheduledRunNotifier.js";
import type { PromptPort } from "@/shared/adapters/host/contracts/promptPort.js";
import type { TaskInputAdapter } from "@/shared/adapters/host/contracts/taskInputAdapter.js";
import type { TerminalPorts } from "@/shared/adapters/host/core/terminalPorts.js";
import { cliAdapterModule } from "@/shared/adapters/cli/core/cliAdapterModule.js";
import { telegramAdapterModule } from "@/shared/adapters/telegram/core/telegramAdapterModule.js";

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
  isEnabled(appConfig: AppConfig): boolean;
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
