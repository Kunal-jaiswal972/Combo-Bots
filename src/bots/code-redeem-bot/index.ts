/** @see ./docs — bot overview, flow, storage, and layout */
import type {
  Bot,
  BotContext,
  BotModule,
  BotModuleCreateOptions,
} from "@/adapters/host/contracts";
import type { SchedulerRunner } from "@/tools/scheduler";
import { ConfigError, isModuleEnabled } from "@/utils";

import { BOT_ID, SCHEDULER_TASK_SOURCE } from "./config/constants";
import { createCodeRedeemSchedulerOnTrigger } from "./controllers/scheduling/onTrigger";
import { createBotScheduler } from "./controllers/scheduling/scheduler";
import {
  bootstrapStorage,
  closeBotDatabase,
  resetStorage,
} from "./controllers/storage";
import { buildMenuActions } from "./engine/menuActions";
import type { RedeemTask, RedeemTaskTemplate } from "./types";

const BOT_LABEL = "Code Redeemer";

export function createCodeRedeemBot(options: BotModuleCreateOptions): Bot {
  let scheduler: SchedulerRunner<RedeemTaskTemplate, RedeemTask> | null = null;

  return {
    id: BOT_ID,
    label: BOT_LABEL,

    async start(): Promise<void> {
      bootstrapStorage();

      if (!options.terminalPrompt) {
        throw new ConfigError(
          `${BOT_LABEL} bot requires terminalPrompt for scheduled-run fallback.`,
        );
      }

      scheduler = createBotScheduler({
        onTrigger: createCodeRedeemSchedulerOnTrigger({
          terminalPrompt: options.terminalPrompt,
          getScheduledRunNotifiers:
            options.getScheduledRunNotifiers ?? (() => []),
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
  label: BOT_LABEL,
  taskTriggerSources: [SCHEDULER_TASK_SOURCE],

  /** Enabled by default; override with `CODE_REDEEM_ENABLED` in the env. */
  isEnabled(): boolean {
    return isModuleEnabled(BOT_ID, true);
  },

  create(options: BotModuleCreateOptions): Bot {
    return createCodeRedeemBot(options);
  },
};
