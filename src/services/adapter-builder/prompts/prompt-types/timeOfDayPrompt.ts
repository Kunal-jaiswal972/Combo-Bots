import type { PromptPort } from "@/services/bridge";
import { isPromptBack } from "@/services/bridge";
import { formatTimeOfDayLabel, formatTimeOfDayString, to24Hour } from "@/utils";

import {
  HOUR_MAX,
  HOUR_MIN,
  MINUTE_MAX,
  MINUTE_MIN,
  PERIOD_CHOICES,
} from "../promptConstants";

type TimeStep = "hour" | "minute" | "period";

/**
 * Ask for a whole number in [min, max]. Re-prompts (and tells the user, via the
 * adapter, which rule they broke) until a valid value is entered. Propagates
 * PromptBackError so callers can navigate back.
 */
async function askIntInRange(
  port: PromptPort,
  label: string,
  min: number,
  max: number,
): Promise<number> {
  while (true) {
    const raw = (
      await port.question(`${label} (${min}-${max}):`, { allowBack: true })
    ).trim();

    const value = Number.parseInt(raw, 10);

    if (/^\d{1,2}$/.test(raw) && value >= min && value <= max) {
      return value;
    }

    port.warn(
      `Invalid ${label.toLowerCase()} "${raw}" — enter a whole number from ${min} to ${max}.`,
    );
  }
}

/** 12-hour clock entry (typed hour + minute, AM/PM select); returns 24-hour HH:mm. */
export async function promptTimeOfDay(port: PromptPort): Promise<string> {
  let step: TimeStep = "hour";
  let hour12 = HOUR_MIN;
  let minute = MINUTE_MIN;

  while (true) {
    if (step === "hour") {
      // Back at the first step bubbles up to the caller.
      hour12 = await askIntInRange(port, "Hour", HOUR_MIN, HOUR_MAX);
      step = "minute";
      continue;
    }

    if (step === "minute") {
      try {
        minute = await askIntInRange(port, "Minute", MINUTE_MIN, MINUTE_MAX);
        step = "period";
      } catch (error) {
        if (isPromptBack(error)) {
          step = "hour";
          continue;
        }
        throw error;
      }
      continue;
    }

    try {
      const period = await port.choose<"AM" | "PM">("AM or PM?", PERIOD_CHOICES, {
        allowBack: true,
      });
      const at = formatTimeOfDayString({
        hours: to24Hour(hour12, period),
        minutes: minute,
      });
      port.gray(`Time: ${formatTimeOfDayLabel(at)}`);
      return at;
    } catch (error) {
      if (isPromptBack(error)) {
        step = "minute";
        continue;
      }
      throw error;
    }
  }
}
