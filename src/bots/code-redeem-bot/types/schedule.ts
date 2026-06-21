import { z } from "zod";
import { scheduleSpecSchema } from "@/shared/tools/scheduler/scheduleSpec.js";
import type { ScheduledJob } from "@/shared/tools/scheduler/job.js";
import { redeemTaskTemplateSchema, type RedeemTaskTemplate } from "./domain.js";

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
