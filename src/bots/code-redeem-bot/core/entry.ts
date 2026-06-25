/** @see ../docs — bot overview, flow, storage, and layout */
import {
  BOT_ID_CODE_REDEEM,
  BOT_LABEL_CODE_REDEEM,
  TASK_SOURCE_SCHEDULER,
} from "@/config";
import { validateTaskSource } from "@/services/adapter-builder";
import { type BotDefinition, createBotService } from "@/services/bot-builder";
import type { BotModule, BotModuleCreateOptions } from "@/services/bridge";
import type { SchedulerRunner } from "@/tools/scheduler";
import { ConfigError, isModuleEnabled } from "@/utils";

import { createCodeRedeemSchedulerOnTrigger } from "../scheduling/onTrigger";
import { createScheduledRunHandler } from "../scheduling/scheduledRunHandler";
import { createBotScheduler } from "../scheduling/scheduler";
import { bootstrapStorage, closeBotDatabase, resetStorage } from "../storage";
import {
  type RedeemTask,
  redeemTaskSchema,
  type RedeemTaskTemplate,
} from "../types";
import {
  createCancelWorkflow,
  createHistoryWorkflow,
  createInitialState,
  createListWorkflow,
  createScheduleWorkflow,
  redeemEnterWorkflow,
  redeemNowWorkflow,
  type RedeemState,
} from "./workflow";

/**
 * Build the workflow-based bot definition, wiring the background scheduler
 * (created from the module's create-options) into the storage lifecycle and
 * the scheduling menu actions.
 */
function buildBotDefinition(
  options: BotModuleCreateOptions,
): BotDefinition<RedeemState> {
  if (!options.terminalPrompt) {
    throw new ConfigError(
      `${BOT_LABEL_CODE_REDEEM} bot requires terminalPrompt for scheduled-run fallback.`,
    );
  }

  const scheduler: SchedulerRunner<RedeemTaskTemplate, RedeemTask> =
    createBotScheduler({
      onTrigger: createCodeRedeemSchedulerOnTrigger({
        terminalPrompt: options.terminalPrompt,
        getScheduledRunNotifiers:
          options.getScheduledRunNotifiers ?? (() => []),
      }),
    });

  return {
    id: BOT_ID_CODE_REDEEM,
    label: BOT_LABEL_CODE_REDEEM,
    usesBrowser: true,
    createState: createInitialState,
    onStart: async () => {
      bootstrapStorage();
      await scheduler.start();
    },
    onStop: async () => {
      await scheduler.stop();
      resetStorage();
      closeBotDatabase();
    },
    // Choose a game and settle the Hoyoverse account before the action menu.
    onEnter: redeemEnterWorkflow,
    // Owns its scheduled-payload execution so the bootstrap stays bot-agnostic.
    runScheduledTask: async (port, payload) => {
      const parsed = redeemTaskSchema.safeParse(payload);
      if (!parsed.success) {
        return false;
      }
      const task: RedeemTask = {
        ...parsed.data,
        source: validateTaskSource(parsed.data.source),
      };
      await createScheduledRunHandler(port)(task);
      return true;
    },
    actions: [
      { id: "run", label: "Redeem codes", workflow: redeemNowWorkflow },
      {
        id: "schedule",
        label: "Schedule a recurring or one-shot task",
        workflow: createScheduleWorkflow(scheduler),
      },
      {
        id: "list",
        label: "List scheduled tasks",
        workflow: createListWorkflow(scheduler),
      },
      {
        id: "cancel",
        label: "Cancel a scheduled task",
        workflow: createCancelWorkflow(scheduler),
      },
      {
        id: "history",
        label: "View recent run history",
        workflow: createHistoryWorkflow(scheduler),
      },
    ],
  };
}

export const codeRedeemBotModule: BotModule = {
  id: BOT_ID_CODE_REDEEM,
  label: BOT_LABEL_CODE_REDEEM,
  taskTriggerSources: [TASK_SOURCE_SCHEDULER],

  /** Enabled by default; override with `CODE_REDEEM_ENABLED` in the env. */
  isEnabled(): boolean {
    return isModuleEnabled(BOT_ID_CODE_REDEEM, true);
  },

  create(options: BotModuleCreateOptions) {
    return createBotService(buildBotDefinition(options));
  },
};
