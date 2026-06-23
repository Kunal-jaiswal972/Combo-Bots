import { logger } from "@/utils";

import type { GameIdValue } from "../../config/constants";
import { getStorage } from "../../controllers/storage";
import type { ScrapeStats } from "../../types";
import { normalizeScrapedRows } from "../../utils/normalizeCodes";
import { getGameModule } from "../gameRegistry";

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
