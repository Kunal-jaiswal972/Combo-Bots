import { GameId } from "@/bots/code-redeem-bot/config/constants";
import type { GameModule } from "@/bots/code-redeem-bot/engine/gameRegistry";
import { genshinConfig } from "../config/config";
import { redeemGenshinCodes } from "./redeemer";
import { scrapeGenshinCodes } from "../controllers/scrapeCodes";

export const genshinGameModule: GameModule = {
  id: GameId.GENSHIN,
  displayName: "Genshin Impact",
  source: genshinConfig.source,
  scrapeCodes: scrapeGenshinCodes,
  redeemCodes: redeemGenshinCodes,
};
