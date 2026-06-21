import type { AppConfig } from "@/utils/env/appConfigTypes";
import type { Bot } from "@/adapters/host/contracts/bot";
import type {
  SchedulableRunPayload,
  ScheduledRunNotifier,
} from "@/adapters/host/contracts/scheduledRunNotifier";
import type { PromptPort } from "@/adapters/host/contracts/promptPort";
import type { TaskInputAdapter } from "@/adapters/host/contracts/taskInputAdapter";
import type { TerminalPorts } from "@/adapters/host/core/terminalPorts";
import { cliAdapterModule } from "@/adapters/cli/core/cliAdapterModule";
import { telegramAdapterModule } from "@/adapters/telegram/core/telegramAdapterModule";

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
