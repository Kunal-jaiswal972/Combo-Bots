import { randomUUID } from "node:crypto";
import { SchedulerRunner } from "@/shared/tools/scheduler/schedulerRunner.js";
import { getAppConfig } from "@/shared/utils/env/appConfig.js";
import type { SchedulerTriggerHandler } from "@/shared/tools/scheduler/scheduler.js";
import { SCHEDULER_TASK_SOURCE } from "@/bots/code-redeem-bot/config/constants.js";
import { getStorage } from "@/bots/code-redeem-bot/controllers/storage.js";
import type {
  RedeemTask,
  RedeemTaskTemplate,
} from "@/bots/code-redeem-bot/types.js";

export interface CreateBotSchedulerOptions {
  readonly onTrigger: SchedulerTriggerHandler<RedeemTask>;
}

function materializeRedeemTask(
  template: RedeemTaskTemplate,
  scheduledTaskId: string,
): RedeemTask {
  return {
    id: randomUUID(),
    gameId: template.gameId,
    credentials: template.credentials,
    scrapePolicy: template.scrapePolicy,
    source: SCHEDULER_TASK_SOURCE,
    createdAt: new Date().toISOString(),
    metadata: {
      scheduledTaskId,
      ...template.metadata,
    },
  };
}

export function createBotScheduler(
  options: CreateBotSchedulerOptions,
): SchedulerRunner<RedeemTaskTemplate, RedeemTask> {
  const appConfig = getAppConfig();

  return new SchedulerRunner({
    store: getStorage().scheduledTasks,
    onTrigger: options.onTrigger,
    materialize: materializeRedeemTask,
    pollIntervalMs: appConfig.schedulerPollIntervalMs,
  });
}
