import { randomUUID } from "node:crypto";
import { formatSchedulerInstant, isAborted, logger } from "@/utils";
import { computeNextRunAt, rescheduleAfterRun } from "../drivers/recurrenceDrivers";
import type { ScheduledJob, ScheduledJobStore } from "../types/scheduledJob";
import type {
  RegisterScheduledJobOptions,
  SchedulerTriggerHandler,
  TaskScheduler,
} from "../types/taskScheduler";

const DEFAULT_POLL_INTERVAL_MS = 60_000;
const MAX_DUE_TIMER_MS = 2_147_483_647;

export interface SchedulerRunnerOptions<TTemplate, TTrigger> {
  store: ScheduledJobStore<TTemplate>;
  onTrigger: SchedulerTriggerHandler<TTrigger>;
  materialize: (template: TTemplate, jobId: string) => TTrigger;
  pollIntervalMs?: number;
}

export class SchedulerRunner<
  TTemplate,
  TTrigger,
> implements TaskScheduler<TTemplate> {
  private readonly store: ScheduledJobStore<TTemplate>;
  private readonly onTrigger: SchedulerTriggerHandler<TTrigger>;
  private readonly materialize: (
    template: TTemplate,
    jobId: string,
  ) => TTrigger;
  private readonly pollIntervalMs: number;
  private pollTimer: NodeJS.Timeout | null = null;
  private dueTimer: NodeJS.Timeout | null = null;
  private ticking = false;

  constructor(options: SchedulerRunnerOptions<TTemplate, TTrigger>) {
    this.store = options.store;
    this.onTrigger = options.onTrigger;
    this.materialize = options.materialize;
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  }

  async register(
    options: RegisterScheduledJobOptions<TTemplate>,
  ): Promise<ScheduledJob<TTemplate>> {
    const task: ScheduledJob<TTemplate> = {
      id: randomUUID(),
      payloadTemplate: options.payload,
      schedule: options.schedule,
      enabled: true,
      lastRunAt: null,
      nextRunAt: computeNextRunAt(options.schedule),
    };

    await this.store.upsert(task);
    this.armDueTimer();
    return task;
  }

  async cancel(taskId: string): Promise<void> {
    await this.store.delete(taskId);
    this.armDueTimer();
  }

  async list(): Promise<ScheduledJob<TTemplate>[]> {
    return this.store.list();
  }

  async start(): Promise<void> {
    if (this.pollTimer) {
      return;
    }

    this.pollTimer = setInterval(() => {
      void this.tick();
    }, this.pollIntervalMs);

    void this.tick();
    this.armDueTimer();
  }

  async stop(): Promise<void> {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.dueTimer) {
      clearTimeout(this.dueTimer);
      this.dueTimer = null;
    }
  }

  private armDueTimer(): void {
    if (this.dueTimer) {
      clearTimeout(this.dueTimer);
      this.dueTimer = null;
    }

    void this.scheduleDueTimer();
  }

  private async scheduleDueTimer(): Promise<void> {
    const tasks = await this.store.list();
    const now = Date.now();
    let nearestDueMs: number | null = null;

    for (const scheduled of tasks) {
      if (!scheduled.enabled || !scheduled.nextRunAt) {
        continue;
      }

      const dueAt = new Date(scheduled.nextRunAt).getTime();

      if (Number.isNaN(dueAt) || dueAt <= now) {
        continue;
      }

      if (nearestDueMs === null || dueAt < nearestDueMs) {
        nearestDueMs = dueAt;
      }
    }

    if (nearestDueMs === null) {
      return;
    }

    const delay = Math.min(nearestDueMs - now, MAX_DUE_TIMER_MS);

    this.dueTimer = setTimeout(() => {
      void this.tick();
    }, delay);
  }

  private async tick(): Promise<void> {
    if (this.ticking || isAborted()) {
      return;
    }

    this.ticking = true;

    try {
      const now = Date.now();
      const tasks = await this.store.list();

      for (const scheduled of tasks) {
        if (!scheduled.enabled || !scheduled.nextRunAt) {
          continue;
        }

        const dueAt = new Date(scheduled.nextRunAt).getTime();

        if (Number.isNaN(dueAt) || dueAt > now) {
          continue;
        }

        await this.runScheduledTask(scheduled);
      }
    } finally {
      this.ticking = false;
      this.armDueTimer();
    }
  }

  private async runScheduledTask(
    scheduled: ScheduledJob<TTemplate>,
  ): Promise<void> {
    const claimedAt = new Date();
    const nextRunAt = rescheduleAfterRun(scheduled.schedule, claimedAt);

    await this.store.upsert({
      ...scheduled,
      lastRunAt: claimedAt.toISOString(),
      nextRunAt,
      enabled: nextRunAt !== null,
    });

    const triggerPayload = this.materialize(
      scheduled.payloadTemplate,
      scheduled.id,
    );

    logger.step(
      `Scheduled task ${scheduled.id} triggered at ${formatSchedulerInstant(claimedAt.toISOString())}.`,
    );

    if (nextRunAt) {
      logger.gray(`Next run: ${formatSchedulerInstant(nextRunAt)}`);
    }

    try {
      await this.onTrigger(triggerPayload);
    } catch (error) {
      const cause = error instanceof Error ? error : new Error(String(error));
      logger.error(`Scheduled task ${scheduled.id} failed:`, cause);
    }

    if (!nextRunAt) {
      logger.info(`Scheduled task ${scheduled.id} completed (one-shot).`);
    }
  }
}
