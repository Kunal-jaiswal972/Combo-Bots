import type {
  AdapterModule,
  Bot,
  PromptPort,
  SchedulableRunPayload,
  ScheduledRunNotifier,
  TaskInputAdapter,
  TerminalPorts,
} from "@/services/bridge";
import { ConfigError } from "@/utils";

export interface CreateEnabledAdaptersOptions {
  /** Adapter registry to instantiate from — passed in to keep this engine acyclic. */
  readonly modules: readonly AdapterModule[];
  readonly terminal: TerminalPorts;
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
  const createOptions = {
    terminal: options.terminal,
    bots: options.bots,
    onScheduledRun: options.onScheduledRun,
  };

  const background: TaskInputAdapter[] = [];
  let foreground: TaskInputAdapter | null = null;
  const scheduledRunNotifiers: ScheduledRunNotifier[] = [];
  const labels: string[] = [];

  for (const module of options.modules) {
    if (!module.isEnabled()) {
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
