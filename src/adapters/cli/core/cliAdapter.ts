import type {
  Bot,
  DisplayPresenter,
  PromptPort,
  TaskInputAdapter,
} from "@/adapters/host/contracts";
import { runBotRouter } from "@/adapters/host/core/botRouter";

const CLI_ADAPTER_ID = "cli";

export interface CreateCliAdapterOptions {
  readonly prompt: PromptPort;
  readonly display: DisplayPresenter;
  readonly bots: readonly Bot[];
  readonly source: string;
  readonly title?: string;
  readonly metadata?: Record<string, string>;
}

export function createCliAdapter(
  options: CreateCliAdapterOptions,
): TaskInputAdapter {
  return {
    id: CLI_ADAPTER_ID,
    label: "CLI menu",
    async start(): Promise<void> {
      await runBotRouter({
        port: options.prompt,
        display: options.display,
        bots: options.bots,
        source: options.source,
        title: options.title,
        metadata: options.metadata,
      });
    },
    async stop(): Promise<void> {
      // Menu exit is synchronous with start(); nothing to tear down.
    },
  };
}
