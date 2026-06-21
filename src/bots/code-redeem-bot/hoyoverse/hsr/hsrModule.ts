import { GameId } from "@/bots/code-redeem-bot/config/constants.js";
import type { GameModule } from "@/bots/code-redeem-bot/engine/gameRegistry.js";
import { hsrConfig } from "./config.js";
import { redeemHsrCodes } from "./redeemer.js";
import { scrapeHsrCodes } from "./controllers/scrapeCodes.js";

export const hsrGameModule: GameModule = {
  id: GameId.HSR,
  displayName: "Honkai: Star Rail",
  source: hsrConfig.source,
  scrapeCodes: scrapeHsrCodes,
  redeemCodes: redeemHsrCodes,
};
