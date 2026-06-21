import { randomUUID } from "node:crypto";
import { SchedulerRunner } from "@/tools/scheduler/schedulerRunner";
import { getAppConfig } from "@/utils/env/appConfig";
import type { SchedulerTriggerHandler } from "@/tools/scheduler/scheduler";
import { SCHEDULER_TASK_SOURCE } from "@/bots/code-redeem-bot/config/constants";
import { getStorage } from "@/bots/code-redeem-bot/controllers/storage";
import type {
  RedeemTask,
  RedeemTaskTemplate,
} from "@/bots/code-redeem-bot/types";

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
