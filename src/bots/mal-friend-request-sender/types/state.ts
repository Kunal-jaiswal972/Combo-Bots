import { z } from "zod";

export const malBotStateSchema = z.object({
  isLoggedIn: z.boolean().optional(),
  lastUsername: z.string().min(1).optional(),
});

export type MalBotState = z.infer<typeof malBotStateSchema>;
