import type { ScheduledJob } from "./job";
import type { ScheduleSpec } from "./scheduleSpec";

export interface RegisterScheduleOptions<TPayload> {
  payload: TPayload;
  schedule: ScheduleSpec;
}

export interface TaskScheduler<TPayload> {
  register(options: RegisterScheduleOptions<TPayload>): Promise<ScheduledJob<TPayload>>;
  cancel(taskId: string): Promise<void>;
  list(): Promise<ScheduledJob<TPayload>[]>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export type SchedulerTriggerHandler<TTriggerPayload> = (
  payload: TTriggerPayload,
) => Promise<void>;
