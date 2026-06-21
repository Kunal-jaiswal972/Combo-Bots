import type { ScheduleSpec } from "@/tools/scheduler/scheduleSpec";
import type { ScheduleDriver } from "@/tools/scheduler/drivers/createScheduleDriverRegistry";

type OnceSchedule = Extract<ScheduleSpec, { type: "once" }>;

export const onceScheduleDriver: ScheduleDriver<OnceSchedule> = {
  type: "once",

  computeNextRunAt(schedule, from): string | null {
    const at = new Date(schedule.at);

    if (Number.isNaN(at.getTime())) {
      throw new Error(`Invalid datetime "${schedule.at}". Use ISO format.`);
    }

    return at > from ? at.toISOString() : null;
  },

  isOneShot(_schedule): boolean {
    return true;
  },
};
