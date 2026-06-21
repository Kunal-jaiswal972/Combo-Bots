import type { SchedulerTriggerHandler } from "@/shared/tools/scheduler/scheduler.js";
import type {
  SchedulableRunPayload,
  ScheduledRunNotifier,
} from "@/shared/adapters/host/contracts/scheduledRunNotifier.js";

export interface CreateSchedulerOnTriggerOptions<TPayload extends SchedulableRunPayload> {
  readonly getScheduledRunNotifiers: () => readonly ScheduledRunNotifier[];
  readonly onFallback: (payload: TPayload) => Promise<void>;
}

export function createSchedulerOnTrigger<TPayload extends SchedulableRunPayload>(
  options: CreateSchedulerOnTriggerOptions<TPayload>,
): SchedulerTriggerHandler<TPayload> {
  const { getScheduledRunNotifiers, onFallback } = options;

  return async (payload) => {
    for (const notifier of getScheduledRunNotifiers()) {
      if (notifier.canNotify(payload)) {
        await notifier.notify(payload);
        return;
      }
    }

    await onFallback(payload);
  };
}
