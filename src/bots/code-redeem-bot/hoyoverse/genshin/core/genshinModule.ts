import { GameId } from "../../../config/constants";
import type { GameModule } from "../../../engine/gameRegistry";
import { genshinConfig } from "../config/config";
import { scrapeGenshinCodes } from "../controllers/scrapeCodes";
import { redeemGenshinCodes } from "./redeemer";

export const genshinGameModule: GameModule = {
  id: GameId.GENSHIN,
  displayName: "Genshin Impact",
  source: genshinConfig.source,
  scrapeCodes: scrapeGenshinCodes,
  redeemCodes: redeemGenshinCodes,
};
