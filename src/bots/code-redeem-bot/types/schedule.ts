import { z } from "zod";
import { recurrenceSpecSchema, type ScheduledJob } from "@/tools/scheduler";
import { redeemTaskTemplateSchema, type RedeemTaskTemplate } from "./task";

export const scheduledTaskRecordSchema = z.object({
  id: z.string().min(1),
  payloadTemplate: redeemTaskTemplateSchema,
  schedule: recurrenceSpecSchema,
  enabled: z.boolean(),
  lastRunAt: z.string().nullable(),
  nextRunAt: z.string().nullable(),
});

export type ScheduledTask = ScheduledJob<RedeemTaskTemplate>;
export type ScheduledTaskRecord = z.infer<typeof scheduledTaskRecordSchema>;
