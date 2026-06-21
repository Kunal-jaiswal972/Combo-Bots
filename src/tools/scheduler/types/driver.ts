import type { RecurrenceSpec } from "@/tools/scheduler/types/recurrenceSpec";

export interface RecurrenceDriver<T extends RecurrenceSpec = RecurrenceSpec> {
  readonly type: T["type"];
  computeNextRunAt(recurrence: T, from: Date): string | null;
  isOneShot(recurrence: T): boolean;
}
