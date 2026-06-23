import type {
  PromptPort,
  ScheduledRunNotifier,
} from "@/adapters/host/contracts";
import { createSchedulerOnTrigger } from "@/adapters/host/core/schedulerOnTrigger";
import type { SchedulerTriggerHandler } from "@/tools/scheduler";

import type { RedeemTask } from "../../types";
import { createScheduledRunHandler } from "./scheduledRunHandler";

export interface CreateCodeRedeemSchedulerOnTriggerOptions {
  readonly terminalPrompt: PromptPort;
  readonly getScheduledRunNotifiers: () => readonly ScheduledRunNotifier[];
}

export function createCodeRedeemSchedulerOnTrigger(
  options: CreateCodeRedeemSchedulerOnTriggerOptions,
): SchedulerTriggerHandler<RedeemTask> {
  return createSchedulerOnTrigger<RedeemTask>({
    getScheduledRunNotifiers: options.getScheduledRunNotifiers,
    onFallback: async (task) => {
      const handler = createScheduledRunHandler(options.terminalPrompt);
      await handler(task);
    },
  });
}
