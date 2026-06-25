import { GameId } from "../../../constants";
import type { GameModule } from "../../../functions/gameRegistry";
import { hsrConfig } from "../config/hsrConfig";
import { scrapeHsrCodes } from "../controllers/hsrScrapeCodes";
import { redeemHsrCodes } from "./hsrCodeRedeemer";

export const hsrGameModule: GameModule = {
  id: GameId.HSR,
  displayName: "Honkai: Star Rail",
  source: hsrConfig.source,
  config: hsrConfig,
  scrapeCodes: scrapeHsrCodes,
  redeemCodes: redeemHsrCodes,
};
