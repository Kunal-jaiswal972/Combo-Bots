import { z } from "zod";
import { scheduleSpecSchema } from "@/tools/scheduler/scheduleSpec";
import type { ScheduledJob } from "@/tools/scheduler/job";
import { redeemTaskTemplateSchema, type RedeemTaskTemplate } from "./domain";

export const scheduledTaskRecordSchema = z.object({
  id: z.string().min(1),
  payloadTemplate: redeemTaskTemplateSchema,
  schedule: scheduleSpecSchema,
  enabled: z.boolean(),
  lastRunAt: z.string().nullable(),
  nextRunAt: z.string().nullable(),
});

export type ScheduledTask = ScheduledJob<RedeemTaskTemplate>;
export type ScheduledTaskRecord = z.infer<typeof scheduledTaskRecordSchema>;
