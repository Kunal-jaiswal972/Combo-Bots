import type { RecurrenceSpec } from "./recurrenceSpec";
import type { ScheduledJob } from "./scheduledJob";

export interface RegisterScheduledJobOptions<TPayload> {
  payload: TPayload;
  schedule: RecurrenceSpec;
}

export interface TaskScheduler<TPayload> {
  register(
    options: RegisterScheduledJobOptions<TPayload>,
  ): Promise<ScheduledJob<TPayload>>;
  cancel(taskId: string): Promise<void>;
  list(): Promise<ScheduledJob<TPayload>[]>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export type SchedulerTriggerHandler<TTriggerPayload> = (
  payload: TTriggerPayload,
) => Promise<void>;
