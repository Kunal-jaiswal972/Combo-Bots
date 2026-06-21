import type { RecurrenceSpec } from "./recurrenceSpec";

export interface ScheduledJob<TPayload> {
  readonly id: string;
  readonly payloadTemplate: TPayload;
  readonly schedule: RecurrenceSpec;
  readonly enabled: boolean;
  readonly lastRunAt: string | null;
  readonly nextRunAt: string | null;
}

export interface ScheduledJobStore<TPayload> {
  list(): Promise<ScheduledJob<TPayload>[]>;
  upsert(task: ScheduledJob<TPayload>): Promise<void>;
  delete(taskId: string): Promise<void>;
}
