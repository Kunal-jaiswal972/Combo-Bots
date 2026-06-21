import { z } from "zod";

/** When a scheduled job should run: once, daily, or on selected weekdays. */
export const recurrenceSpecSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("once"), at: z.string().min(1) }),
  z.object({ type: z.literal("daily"), at: z.string().min(1) }),
  z.object({
    type: z.literal("weekdays"),
    days: z.array(z.number().int().min(0).max(6)).min(1),
    at: z.string().min(1),
  }),
]);

export type RecurrenceSpec = z.infer<typeof recurrenceSpecSchema>;
