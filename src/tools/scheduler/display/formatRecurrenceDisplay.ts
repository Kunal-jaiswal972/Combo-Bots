import type { RecurrenceSpec } from "@/tools/scheduler/types/recurrenceSpec";
import { computeNextRunAt } from "@/tools/scheduler/drivers/recurrenceDrivers";
import {
  advanceScheduleCursor,
  formatSchedulerInstant,
  formatTimeOfDayLabel,
  formatTimeUntil,
  formatWeekdayFullList,
  getWeekdayFullName,
} from "@/utils";

export function formatRecurrenceDescription(recurrence: RecurrenceSpec): string {
  switch (recurrence.type) {
    case "daily":
      return `Every day at ${formatTimeOfDayLabel(recurrence.at)}`;
    case "once": {
      const at = new Date(recurrence.at);

      if (Number.isNaN(at.getTime())) {
        return `Once at ${recurrence.at}`;
      }

      return `Once on ${formatSchedulerInstant(recurrence.at)}`;
    }
    case "weekdays": {
      const time = formatTimeOfDayLabel(recurrence.at);

      if (recurrence.days.length === 1) {
        const day = recurrence.days[0];
        const dayName = day !== undefined ? getWeekdayFullName(day) : "weekday";
        return `Every ${dayName} at ${time}`;
      }

      return `Every ${formatWeekdayFullList(recurrence.days)} at ${time}`;
    }
  }
}

export function computeUpcomingRunTimes(
  recurrence: RecurrenceSpec,
  count: number,
  from: Date = new Date(),
): string[] {
  if (count < 1) {
    return [];
  }

  const times: string[] = [];
  let cursor = from;

  for (let index = 0; index < count; index += 1) {
    const nextIso = computeNextRunAt(recurrence, cursor);

    if (nextIso === null) {
      break;
    }

    times.push(nextIso);
    cursor = advanceScheduleCursor(nextIso);
  }

  return times;
}

export function formatUpcomingRuns(recurrence: RecurrenceSpec, count = 3): string {
  const upcoming = computeUpcomingRunTimes(recurrence, count);
  const now = new Date();

  if (upcoming.length === 0) {
    return "None scheduled";
  }

  return upcoming
    .map((iso, index) => {
      const instant = formatSchedulerInstant(iso);
      const timeLeft = formatTimeUntil(iso, now);
      return `${index + 1}. ${instant} (${timeLeft})`;
    })
    .join("\n");
}
