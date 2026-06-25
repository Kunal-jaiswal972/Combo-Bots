import type { HoyoGameConfig } from "../../shared/config";
import { genshinElements } from "./genshinElements";

export const genshinConfig = {
  redeemPageUrl: "https://genshin.hoyoverse.com/en/gift",
  wikiApiUrl: "https://genshin-impact.fandom.com/api.php",
  wikiPageTitle: "Promotional_Code",
  source: "genshin-impact.fandom.com",
  maxLoginAttempts: 3,
  logOutLabel: "Log Out",
  redeemCooldownMs: 5_000,
  maxRedeemRetries: 12,
  modalPollIntervalMs: 250,
  modalCloseTimeoutMs: 5_000,
  /** Substring matched in wiki table row style to detect active (non-expired) codes. */
  wikiActiveRowStyleMarker: "background-color:rgb(153,255,153,0.5)",
  selectors: genshinElements,
} as const satisfies HoyoGameConfig & Record<string, unknown>;
