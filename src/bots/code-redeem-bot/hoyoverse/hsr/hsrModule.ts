import { GameId } from "../../config/constants";
import type { GameModule } from "../../engine/gameRegistry";
import { hsrConfig } from "./config";
import { scrapeHsrCodes } from "./controllers/scrapeCodes";
import { redeemHsrCodes } from "./redeemer";

export const hsrGameModule: GameModule = {
  id: GameId.HSR,
  displayName: "Honkai: Star Rail",
  source: hsrConfig.source,
  scrapeCodes: scrapeHsrCodes,
  redeemCodes: redeemHsrCodes,
};
