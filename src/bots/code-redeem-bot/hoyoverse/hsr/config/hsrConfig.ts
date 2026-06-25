import type { HoyoGameConfig } from "../../shared/config";
import { hsrElements } from "./hsrElements";

export const hsrConfig = {
  redeemPageUrl: "https://hsr.hoyoverse.com/gift",
  wikiApiUrl: "https://honkai-star-rail.fandom.com/api.php",
  wikiPageTitle: "Redemption_Code",
  source: "honkai-star-rail.fandom.com",
  logOutLabel: "Log Out",
  maxLoginAttempts: 3,
  selectors: hsrElements,
} as const satisfies HoyoGameConfig & Record<string, unknown>;

export const hsrStubCodes = ["HSR-STUB-001", "HSR-STUB-002"] as const;
