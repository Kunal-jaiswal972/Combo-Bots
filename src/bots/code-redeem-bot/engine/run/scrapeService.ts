import type { GameIdValue } from "@/bots/code-redeem-bot/config/constants";
import { getGameModule } from "@/bots/code-redeem-bot/engine/gameRegistry";
import { normalizeScrapedRows } from "@/bots/code-redeem-bot/utils/normalizeCodes";
import { getStorage } from "@/bots/code-redeem-bot/controllers/storage";
import type { ScrapeStats } from "@/bots/code-redeem-bot/types";
import { logger } from "@/utils";

export async function runScrape(gameId: GameIdValue): Promise<ScrapeStats> {
  const gameModule = getGameModule(gameId);

  logger.gray(`Fetching codes for ${gameModule.displayName}...`);
  const rows = await gameModule.scrapeCodes();
  const normalized = normalizeScrapedRows(rows);
  const merge = await getStorage().codes.mergeScrapedCodes({
    gameId,
    scraped: normalized,
    source: gameModule.source,
  });

  logger.success(
    `Scrape saved — codes: ${normalized.length}, new: ${merge.newCodes.length}, active: ${merge.activeCodes}, expired: ${merge.expiredCodes}`,
  );

  return {
    rowsFound: rows.length,
    codesUpserted: normalized.length,
    activeCodes: merge.activeCodes,
    expiredCodes: merge.expiredCodes,
    newCodes: merge.newCodes,
  };
}
