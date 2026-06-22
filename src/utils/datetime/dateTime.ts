import {
  addDays,
  addSeconds,
  differenceInMinutes,
  format,
  getDay,
  getYear,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

import { getAppConfig } from "../env/appConfig";

const CALENDAR_DATE_PATTERN = "yyyy-MM-dd";
const INSTANT_DISPLAY_PATTERN = "d MMM yyyy, h:mm a";
const LONG_DATE_PATTERN = "EEEE, MMMM d, yyyy";

export interface TimeOfDayParts {
  readonly hours: number;
  readonly minutes: number;
}

export interface ZonedDateTimeParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hours: number;
  readonly minutes: number;
  readonly timeZone: string;
}

export interface FormatInstantOptions {
  timeZone?: string;
}

export function isValidIanaTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function getSchedulerTimezone(): string {
  return getAppConfig().schedulerTimezone;
}

export function getTodayRunDate(now: Date = new Date()): string {
  return formatInTimeZone(now, getSchedulerTimezone(), CALENDAR_DATE_PATTERN);
}

export function parseTimeOfDay(at: string): TimeOfDayParts {
  const match = /^(\d{1,2}):(\d{2})$/.exec(at.trim());

  if (!match?.[1] || !match[2]) {
    throw new Error(`Invalid time "${at}".`);
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time "${at}".`);
  }

  return { hours, minutes };
}

export function formatTimeOfDayString(parts: TimeOfDayParts): string {
  const hours = parts.hours.toString().padStart(2, "0");
  const minutes = parts.minutes.toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatTimeOfDayLabel(at: string): string {
  const { hours, minutes } = parseTimeOfDay(at);
  return format(new Date(2000, 0, 1, hours, minutes), "h:mm a");
}

export function to24Hour(hour12: number, period: "AM" | "PM"): number {
  if (hour12 < 1 || hour12 > 12) {
    throw new Error(`Invalid hour ${hour12}.`);
  }

  if (period === "AM") {
    return hour12 === 12 ? 0 : hour12;
  }

  return hour12 === 12 ? 12 : hour12 + 12;
}

function wallClockToUtc(parts: ZonedDateTimeParts): Date {
  const { year, month, day, hours, minutes, timeZone } = parts;

  return fromZonedTime(
    new Date(year, month - 1, day, hours, minutes, 0, 0),
    timeZone,
  );
}

export function zonedDateTimeToUtc(parts: ZonedDateTimeParts): Date {
  return wallClockToUtc(parts);
}

export function startOfDayInTimezone(date: Date, timeZone: string): Date {
  const zoned = toZonedTime(date, timeZone);
  return fromZonedTime(startOfDay(zoned), timeZone);
}

export function addCalendarDaysInTimezone(
  date: Date,
  days: number,
  timeZone: string,
): Date {
  const zoned = toZonedTime(date, timeZone);
  return fromZonedTime(startOfDay(addDays(zoned, days)), timeZone);
}

export function atTimeOnDateInTimezone(
  base: Date,
  at: string,
  timeZone: string,
): Date {
  const { hours, minutes } = parseTimeOfDay(at);
  const zoned = toZonedTime(base, timeZone);

  return wallClockToUtc({
    year: getYear(zoned),
    month: zoned.getMonth() + 1,
    day: zoned.getDate(),
    hours,
    minutes,
    timeZone,
  });
}

export function getWeekdayInTimezone(date: Date, timeZone: string): number {
  return getDay(toZonedTime(date, timeZone));
}

export function getCalendarYearInTimezone(
  date: Date,
  timeZone: string,
): number {
  return getYear(toZonedTime(date, timeZone));
}

export function formatInstantInTimezone(
  iso: string | null | undefined,
  options?: FormatInstantOptions,
): string {
  if (!iso) {
    return "none";
  }

  const date = parseISO(iso);

  if (!isValid(date)) {
    return iso;
  }

  const timeZone = options?.timeZone ?? getSchedulerTimezone();
  return formatInTimeZone(date, timeZone, INSTANT_DISPLAY_PATTERN);
}

export function formatSchedulerInstant(iso: string | null | undefined): string {
  return formatInstantInTimezone(iso, { timeZone: getSchedulerTimezone() });
}

export function formatLongDateInTimezone(date: Date, timeZone: string): string {
  return formatInTimeZone(date, timeZone, LONG_DATE_PATTERN);
}

export function formatTimeUntil(iso: string, now: Date = new Date()): string {
  const target = parseISO(iso);

  if (!isValid(target)) {
    return "";
  }

  const diffMinutes = differenceInMinutes(target, now);

  if (diffMinutes <= 0) {
    return "due now";
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours >= 24) {
    const diffDays = Math.floor(diffHours / 24);
    const dayLabel = diffDays === 1 ? "day" : "day(s)";
    return `${diffDays} ${dayLabel} left`;
  }

  if (diffHours >= 1) {
    return `${diffHours} hr left`;
  }

  return `${diffMinutes} min left`;
}

export function advanceScheduleCursor(iso: string): Date {
  return addSeconds(parseISO(iso), 1);
}
