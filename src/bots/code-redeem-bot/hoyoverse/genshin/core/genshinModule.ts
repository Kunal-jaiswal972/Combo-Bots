import { GameId } from "../../../constants";
import type { GameModule } from "../../../functions/gameRegistry";
import { genshinConfig } from "../config/genshinConfig";
import { scrapeGenshinCodes } from "../controllers/genshinScrapeCodes";
import { redeemGenshinCodes } from "./genshinCodeRedeemer";

export const genshinGameModule: GameModule = {
  id: GameId.GENSHIN,
  displayName: "Genshin Impact",
  source: genshinConfig.source,
  config: genshinConfig,
  scrapeCodes: scrapeGenshinCodes,
  redeemCodes: redeemGenshinCodes,
};
