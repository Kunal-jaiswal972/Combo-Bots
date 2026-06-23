import {
  addCalendarDaysInTimezone,
  atTimeOnDateInTimezone,
  getSchedulerTimezone,
  getWeekdayInTimezone,
} from "@/utils";

import type { RecurrenceDriver } from "../types/driver";
import type { RecurrenceSpec } from "../types/recurrenceSpec";
import { createRecurrenceDriverRegistry } from "./recurrenceDriverRegistry";

type OnceRecurrence = Extract<RecurrenceSpec, { type: "once" }>;
type DailyRecurrence = Extract<RecurrenceSpec, { type: "daily" }>;
type WeekdaysRecurrence = Extract<RecurrenceSpec, { type: "weekdays" }>;

const onceRecurrenceDriver: RecurrenceDriver<OnceRecurrence> = {
  type: "once",

  computeNextRunAt(recurrence, from): string | null {
    const at = new Date(recurrence.at);

    if (Number.isNaN(at.getTime())) {
      throw new Error(`Invalid datetime "${recurrence.at}". Use ISO format.`);
    }

    return at > from ? at.toISOString() : null;
  },

  isOneShot(_recurrence): boolean {
    return true;
  },
};

function computeDailyNextRun(at: string, from: Date): Date {
  const timeZone = getSchedulerTimezone();
  const candidate = atTimeOnDateInTimezone(from, at, timeZone);

  if (candidate <= from) {
    const nextDay = addCalendarDaysInTimezone(from, 1, timeZone);
    return atTimeOnDateInTimezone(nextDay, at, timeZone);
  }

  return candidate;
}

const dailyRecurrenceDriver: RecurrenceDriver<DailyRecurrence> = {
  type: "daily",

  computeNextRunAt(recurrence, from): string | null {
    return computeDailyNextRun(recurrence.at, from).toISOString();
  },

  isOneShot(_recurrence): boolean {
    return false;
  },
};

function computeWeekdaysNextRun(days: number[], at: string, from: Date): Date {
  if (days.length === 0) {
    throw new Error("Select at least one weekday.");
  }

  const timeZone = getSchedulerTimezone();
  const sortedDays = [...days].sort((left, right) => left - right);

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidateDate = addCalendarDaysInTimezone(from, offset, timeZone);
    const weekday = getWeekdayInTimezone(candidateDate, timeZone);

    if (!sortedDays.includes(weekday)) {
      continue;
    }

    const candidate = atTimeOnDateInTimezone(candidateDate, at, timeZone);

    if (candidate > from) {
      return candidate;
    }
  }

  throw new Error("Could not compute next weekday run time.");
}

const weekdaysRecurrenceDriver: RecurrenceDriver<WeekdaysRecurrence> = {
  type: "weekdays",

  computeNextRunAt(recurrence, from): string | null {
    return computeWeekdaysNextRun(
      recurrence.days,
      recurrence.at,
      from,
    ).toISOString();
  },

  isOneShot(_recurrence): boolean {
    return false;
  },
};

const recurrenceDriverRegistry = createRecurrenceDriverRegistry([
  onceRecurrenceDriver,
  dailyRecurrenceDriver,
  weekdaysRecurrenceDriver,
]);

export const computeNextRunAt = recurrenceDriverRegistry.computeNextRunAt;
export const rescheduleAfterRun = recurrenceDriverRegistry.rescheduleAfterRun;
