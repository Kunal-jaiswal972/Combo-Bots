import { ConfigError } from "@/shared/utils/errors.js";
import { SCHEDULER_TASK_SOURCE } from "@/bots/code-redeem-bot/config/constants.js";
import type { AppConfig } from "@/shared/utils/env/appConfigTypes.js";
import type {
  Bot,
  BotContext,
  BotModule,
  BotModuleCreateOptions,
} from "@/shared/adapters/host/contracts/bot.js";
import type { SchedulerRunner } from "@/shared/tools/scheduler/schedulerRunner.js";
import type { RedeemTask, RedeemTaskTemplate } from "@/bots/code-redeem-bot/types.js";
import { createCodeRedeemSchedulerOnTrigger } from "./controllers/scheduling/onTrigger.js";
import { createBotScheduler } from "./controllers/scheduling/scheduler.js";
import {
  bootstrapStorage,
  closeBotDatabase,
  resetStorage,
} from "@/bots/code-redeem-bot/controllers/storage.js";
import { buildMenuActions } from "./engine/menuActions.js";

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
