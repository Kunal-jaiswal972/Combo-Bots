import { ConfigError } from "@/shared/utils/errors.js";
import type { AppConfig } from "@/shared/utils/env/appConfigTypes.js";
import type { Bot } from "@/shared/adapters/host/contracts/bot.js";
import type {
  SchedulableRunPayload,
  ScheduledRunNotifier,
} from "@/shared/adapters/host/contracts/scheduledRunNotifier.js";
import type { PromptPort } from "@/shared/adapters/host/contracts/promptPort.js";
import type { TaskInputAdapter } from "@/shared/adapters/host/contracts/taskInputAdapter.js";
import type { TerminalPorts } from "@/shared/adapters/host/core/terminalPorts.js";
import { adapterModules, type AdapterModuleCreateOptions } from "./adapterModules.js";
export interface CreateEnabledAdaptersOptions {
  readonly terminal: TerminalPorts;
  readonly appConfig: AppConfig;
  readonly bots: readonly Bot[];
  readonly onScheduledRun?: (
    port: PromptPort,
    payload: SchedulableRunPayload,
  ) => Promise<void>;
}

export interface EnabledAdapters {
  readonly background: readonly TaskInputAdapter[];
  readonly foreground: TaskInputAdapter | null;
  readonly scheduledRunNotifiers: readonly ScheduledRunNotifier[];
  readonly labels: readonly string[];
}

export function createEnabledAdapters(
  options: CreateEnabledAdaptersOptions,
): EnabledAdapters {
  const { appConfig } = options;
  const createOptions: AdapterModuleCreateOptions = {
    terminal: options.terminal,
    appConfig,
    bots: options.bots,
    onScheduledRun: options.onScheduledRun,
  };

  const background: TaskInputAdapter[] = [];
  let foreground: TaskInputAdapter | null = null;
  const scheduledRunNotifiers: ScheduledRunNotifier[] = [];
  const labels: string[] = [];

  for (const module of adapterModules) {
    if (!module.isEnabled(appConfig)) {
      continue;
    }

    const instance = module.create(createOptions);

    if (module.lifecycle === "foreground") {
      if (foreground !== null) {
        throw new ConfigError(
          `Multiple foreground adapters enabled (${foreground.id}, ${module.id}). Only one is allowed.`,
        );
      }

      foreground = instance.adapter;
    } else {
      background.push(instance.adapter);
    }

    if (instance.scheduledRunNotifier) {
      scheduledRunNotifiers.push(instance.scheduledRunNotifier);
    }

    labels.push(instance.adapter.label);
  }

  return {
    background,
    foreground,
    scheduledRunNotifiers,
    labels,
  };
}
