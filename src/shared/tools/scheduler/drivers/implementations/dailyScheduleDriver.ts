import type { ScheduleSpec } from "@/shared/tools/scheduler/scheduleSpec.js";
import { atTimeOnDate } from "@/shared/tools/scheduler/timeOfDay.js";
import type { ScheduleDriver } from "@/shared/tools/scheduler/drivers/createScheduleDriverRegistry.js";

type DailySchedule = Extract<ScheduleSpec, { type: "daily" }>;

function computeDailyNextRun(at: string, from: Date): Date {
  const candidate = atTimeOnDate(from, at);

  if (candidate <= from) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate;
}

export const dailyScheduleDriver: ScheduleDriver<DailySchedule> = {
  type: "daily",

  computeNextRunAt(schedule, from): string | null {
    return computeDailyNextRun(schedule.at, from).toISOString();
  },

  isOneShot(_schedule): boolean {
    return false;
  },
};
