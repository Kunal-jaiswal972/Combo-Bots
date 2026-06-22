import { createSchedulerOnTrigger } from "@/adapters/host/core/schedulerOnTrigger";
import type { ScheduledRunNotifier } from "@/adapters/host/contracts/scheduledRunNotifier";
import type { PromptPort } from "@/adapters/host/contracts/promptPort";
import type { SchedulerTriggerHandler } from "@/tools/scheduler";
import type { RedeemTask } from "@/bots/code-redeem-bot/types";
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
