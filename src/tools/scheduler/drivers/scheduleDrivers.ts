import { createScheduleDriverRegistry } from "./createScheduleDriverRegistry";
import { dailyScheduleDriver } from "./implementations/dailyScheduleDriver";
import { onceScheduleDriver } from "./implementations/onceScheduleDriver";
import { weekdaysScheduleDriver } from "./implementations/weekdaysScheduleDriver";

/** Add new schedule recurrence drivers to `implementations/` and this array. */
const scheduleDriverRegistry = createScheduleDriverRegistry([
  onceScheduleDriver,
  dailyScheduleDriver,
  weekdaysScheduleDriver,
]);

export const computeNextRunAt = scheduleDriverRegistry.computeNextRunAt;
export const rescheduleAfterRun = scheduleDriverRegistry.rescheduleAfterRun;
