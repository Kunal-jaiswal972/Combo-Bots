import type { GameIdValue } from "@/bots/code-redeem-bot/config/constants.js";
import type { ScrapePolicy } from "@/bots/code-redeem-bot/types.js";
import { getStorage } from "@/bots/code-redeem-bot/controllers/storage.js";
import { getTodayRunDate } from "@/shared/utils.js";

export interface ScrapeDecision {
  shouldScrape: boolean;
  runDate: string;
  reason: string;
}

export interface EvaluateScrapePolicyOptions {
  policy: ScrapePolicy;
  gameId: GameIdValue;
}

export async function evaluateScrapePolicy(
  options: EvaluateScrapePolicyOptions,
): Promise<ScrapeDecision> {
  const runDate = getTodayRunDate();
  const { policy, gameId } = options;

  switch (policy.type) {
    case "always":
      return {
        shouldScrape: true,
        runDate,
        reason: "Scrape policy: always.",
      };
    case "never":
      return {
        shouldScrape: false,
        runDate,
        reason: "Scrape policy: never.",
      };
    case "ifNotScrapedToday": {
      const alreadyScraped = await getStorage().codes.hasScrapedToday(gameId);

      if (alreadyScraped) {
        return {
          shouldScrape: false,
          runDate,
          reason: "Codes already scraped today.",
        };
      }

      return {
        shouldScrape: true,
        runDate,
        reason: "Daily scrape not yet recorded.",
      };
    }
  }
}
