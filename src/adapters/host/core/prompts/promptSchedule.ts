import type { RecurrenceSpec } from "@/tools/scheduler";

import { isPromptBack, type PromptPort } from "../../contracts";
import { promptOnceDateTime } from "./promptDatePicker";
import { promptTimeOfDay } from "./promptTimePicker";
import { promptMultipleWeekdays, promptSingleWeekday } from "./promptWeekdays";

type RecurrenceKind = "daily" | "weekly" | "once" | "weeklyOnce";

const RECURRENCE_KIND_CHOICES = [
  { value: "daily" as const, label: "Every day at a set time" },
  {
    value: "weekly" as const,
    label: "On selected days every week at a set time",
  },
  { value: "once" as const, label: "Once at a specific date and time" },
  {
    value: "weeklyOnce" as const,
    label: "Every week on one day at a set time",
  },
];

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
