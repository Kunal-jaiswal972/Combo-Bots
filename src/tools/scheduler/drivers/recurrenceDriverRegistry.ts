import type { RecurrenceSpec } from "@/tools/scheduler/types/recurrenceSpec";
import type { RecurrenceDriver } from "@/tools/scheduler/types/driver";
export interface RecurrenceDriverRegistry {
  getDriver(type: RecurrenceSpec["type"]): RecurrenceDriver;
  computeNextRunAt(recurrence: RecurrenceSpec, from?: Date): string | null;
  rescheduleAfterRun(recurrence: RecurrenceSpec, ranAt: Date): string | null;
}

export function createRecurrenceDriverRegistry(
  drivers: readonly RecurrenceDriver[],
): RecurrenceDriverRegistry {
  const byType = new Map<RecurrenceSpec["type"], RecurrenceDriver>();

  for (const driver of drivers) {
    if (byType.has(driver.type)) {
      throw new Error(`Duplicate recurrence driver for type: ${driver.type}`);
    }

    byType.set(driver.type, driver);
  }

  function getDriver(type: RecurrenceSpec["type"]): RecurrenceDriver {
    const driver = byType.get(type);

    if (!driver) {
      throw new Error(`No recurrence driver registered for type: ${type}`);
    }

    return driver;
  }

  function computeNextRunAt(
    recurrence: RecurrenceSpec,
    from: Date = new Date(),
  ): string | null {
    return getDriver(recurrence.type).computeNextRunAt(recurrence, from);
  }

  function rescheduleAfterRun(
    recurrence: RecurrenceSpec,
    ranAt: Date,
  ): string | null {
    const driver = getDriver(recurrence.type);

    if (driver.isOneShot(recurrence)) {
      return null;
    }

    return driver.computeNextRunAt(recurrence, ranAt);
  }

  return {
    getDriver,
    computeNextRunAt,
    rescheduleAfterRun,
  };
}
