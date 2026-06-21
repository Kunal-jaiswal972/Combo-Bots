import { GameId } from "@/bots/code-redeem-bot/config/constants.js";
import type { GameModule } from "@/bots/code-redeem-bot/engine/gameRegistry.js";
import { genshinConfig } from "../config/config.js";
import { redeemGenshinCodes } from "./redeemer.js";
import { scrapeGenshinCodes } from "../controllers/scrapeCodes.js";

export const genshinGameModule: GameModule = {
  id: GameId.GENSHIN,
  displayName: "Genshin Impact",
  source: genshinConfig.source,
  scrapeCodes: scrapeGenshinCodes,
  redeemCodes: redeemGenshinCodes,
};
