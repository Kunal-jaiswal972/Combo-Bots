import { getTodayRunDate } from "@/utils";

import type { GameIdValue } from "../../config/constants";
import { getStorage } from "../../controllers/storage";
import type { ScrapePolicy } from "../../types";

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
