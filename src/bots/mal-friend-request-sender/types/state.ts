import { z } from "zod";

export const malBotStateSchema = z.object({
  /** Last MAL username whose friend list was scraped (default for the prompt). */
  lastScrapedUsername: z.string().min(1).optional(),
});

export type MalBotState = z.infer<typeof malBotStateSchema>;
