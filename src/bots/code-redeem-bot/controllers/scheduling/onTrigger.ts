import { createSchedulerOnTrigger } from "@/shared/adapters/host/core/schedulerOnTrigger.js";
import type { ScheduledRunNotifier } from "@/shared/adapters/host/contracts/scheduledRunNotifier.js";
import type { PromptPort } from "@/shared/adapters/host/contracts/promptPort.js";
import type { SchedulerTriggerHandler } from "@/shared/tools/scheduler/scheduler.js";
import type { RedeemTask } from "@/bots/code-redeem-bot/types.js";
import { createScheduledRunHandler } from "./scheduledRunHandler.js";

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
