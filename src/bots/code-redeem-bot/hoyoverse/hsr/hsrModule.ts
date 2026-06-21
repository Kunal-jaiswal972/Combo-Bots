import { GameId } from "@/bots/code-redeem-bot/config/constants";
import type { GameModule } from "@/bots/code-redeem-bot/engine/gameRegistry";
import { hsrConfig } from "./config";
import { redeemHsrCodes } from "./redeemer";
import { scrapeHsrCodes } from "./controllers/scrapeCodes";

export const hsrGameModule: GameModule = {
  id: GameId.HSR,
  displayName: "Honkai: Star Rail",
  source: hsrConfig.source,
  scrapeCodes: scrapeHsrCodes,
  redeemCodes: redeemHsrCodes,
};
