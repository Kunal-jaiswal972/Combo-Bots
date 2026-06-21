import type { SchedulerTriggerHandler } from "@/tools/scheduler/scheduler";
import type {
  SchedulableRunPayload,
  ScheduledRunNotifier,
} from "@/adapters/host/contracts/scheduledRunNotifier";

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
