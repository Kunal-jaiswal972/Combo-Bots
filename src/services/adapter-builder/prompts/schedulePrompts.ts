import type { PromptPort } from "@/services/bridge";
import { isPromptBack } from "@/services/bridge";
import type { RecurrenceSpec } from "@/tools/scheduler";

import { promptOnceDateTime } from "./prompt-types/dateTimePrompt";
import { promptTimeOfDay } from "./prompt-types/timeOfDayPrompt";
import {
  promptMultipleWeekdays,
  promptSingleWeekday,
} from "./prompt-types/weekdayPrompt";
import {
  RECURRENCE_KIND_CHOICES,
  type RecurrenceKind,
} from "./promptConstants";

// Public entry point for the schedule builder: pick a recurrence kind, then
// gather the day(s)/date and time-of-day for that kind. The individual pickers
// live in sibling files (timeOfDayPrompt, weekdayPrompt, dateTimePrompt).

async function promptRecurrenceKind(port: PromptPort): Promise<RecurrenceKind> {
  return port.choose<RecurrenceKind>(
    "How should this run?",
    RECURRENCE_KIND_CHOICES,
    {
      allowBack: true,
    },
  );
}

async function promptDailyRecurrence(
  port: PromptPort,
): Promise<RecurrenceSpec> {
  const at = await promptTimeOfDay(port);
  return { type: "daily", at };
}

async function promptWeeklyRecurrence(
  port: PromptPort,
): Promise<RecurrenceSpec> {
  while (true) {
    const days = await promptMultipleWeekdays(port);

    try {
      const at = await promptTimeOfDay(port);
      return { type: "weekdays", days, at };
    } catch (error) {
      if (isPromptBack(error)) {
        continue;
      }

      throw error;
    }
  }
}

async function promptWeeklyOnceRecurrence(
  port: PromptPort,
): Promise<RecurrenceSpec> {
  while (true) {
    const day = await promptSingleWeekday(port);

    try {
      const at = await promptTimeOfDay(port);
      return { type: "weekdays", days: [day], at };
    } catch (error) {
      if (isPromptBack(error)) {
        continue;
      }

      throw error;
    }
  }
}

async function promptRecurrenceForKind(
  port: PromptPort,
  kind: RecurrenceKind,
): Promise<RecurrenceSpec> {
  switch (kind) {
    case "daily":
      return promptDailyRecurrence(port);
    case "weekly":
      return promptWeeklyRecurrence(port);
    case "once": {
      const at = await promptOnceDateTime(port);
      return { type: "once", at };
    }
    case "weeklyOnce":
      return promptWeeklyOnceRecurrence(port);
  }
}

export async function promptRecurrenceSpec(
  port: PromptPort,
): Promise<RecurrenceSpec> {
  while (true) {
    let kind: RecurrenceKind;

    try {
      kind = await promptRecurrenceKind(port);
    } catch (error) {
      if (isPromptBack(error)) {
        throw error;
      }

      throw error;
    }

    try {
      return await promptRecurrenceForKind(port, kind);
    } catch (error) {
      if (isPromptBack(error)) {
        continue;
      }

      throw error;
    }
  }
}
