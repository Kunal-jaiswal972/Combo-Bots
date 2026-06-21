/** @see ./README.md — bot overview, flow, storage, and layout */
import { ConfigError } from "@/utils/errors";
import { SCHEDULER_TASK_SOURCE } from "@/bots/code-redeem-bot/config/constants";
import type { AppConfig } from "@/utils/env/appConfigTypes";
import type {
  Bot,
  BotContext,
  BotModule,
  BotModuleCreateOptions,
} from "@/adapters/host/contracts/bot";
import type { SchedulerRunner } from "@/tools/scheduler/schedulerRunner";
import type { RedeemTask, RedeemTaskTemplate } from "@/bots/code-redeem-bot/types";
import { createCodeRedeemSchedulerOnTrigger } from "./controllers/scheduling/onTrigger";
import { createBotScheduler } from "./controllers/scheduling/scheduler";
import {
  bootstrapStorage,
  closeBotDatabase,
  resetStorage,
} from "@/bots/code-redeem-bot/controllers/storage";
import { buildMenuActions } from "./engine/menuActions";

const BOT_ID = "code-redeem";

export function createCodeRedeemBot(
  options: BotModuleCreateOptions,
): Bot {
  let scheduler: SchedulerRunner<RedeemTaskTemplate, RedeemTask> | null = null;

  return {
    id: BOT_ID,
    label: "Code Redeemer",

    async start(): Promise<void> {
      bootstrapStorage();

      if (!options.terminalPrompt) {
        throw new ConfigError(
          "Code Redeemer bot requires terminalPrompt for scheduled-run fallback.",
        );
      }

      scheduler = createBotScheduler({
        onTrigger: createCodeRedeemSchedulerOnTrigger({
          terminalPrompt: options.terminalPrompt,
          getScheduledRunNotifiers: options.getScheduledRunNotifiers ?? (() => []),
        }),
      });

      await scheduler.start();
    },

    async stop(): Promise<void> {
      if (scheduler) {
        await scheduler.stop();
        scheduler = null;
      }

      resetStorage();
      closeBotDatabase();
    },

    menuActions(_ctx: BotContext) {
      if (!scheduler) {
        return [];
      }

      return buildMenuActions(scheduler);
    },
  };
}

export const codeRedeemBotModule: BotModule = {
  id: BOT_ID,
  label: "Code Redeemer",
  taskTriggerSources: [SCHEDULER_TASK_SOURCE],

  isEnabled(_appConfig: AppConfig): boolean {
    return true;
  },

  create(options: BotModuleCreateOptions): Bot {
    return createCodeRedeemBot(options);
  },
};
