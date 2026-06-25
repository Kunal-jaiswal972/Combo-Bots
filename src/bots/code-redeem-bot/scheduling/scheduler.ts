import { randomUUID } from "node:crypto";

import { TASK_SOURCE_SCHEDULER } from "@/config";
import {
  SchedulerRunner,
  type SchedulerTriggerHandler,
} from "@/tools/scheduler";
import { getAppConfig } from "@/utils";

import { getStorage } from "../storage";
import type { RedeemTask, RedeemTaskTemplate } from "../types";

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
    source: TASK_SOURCE_SCHEDULER,
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
