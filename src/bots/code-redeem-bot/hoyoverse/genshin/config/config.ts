import {
  GenshinServer,
  type GenshinServerValue,
} from "@/bots/code-redeem-bot/config/constants";
import { genshinElements } from "./elements";

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
} as const;

export function getServerMenuSelector(nthChild: number): string {
  return `${genshinConfig.selectors.serverMenu} > div:nth-child(${nthChild})`;
}

export const genshinServerNthChild: Record<GenshinServerValue, number> = {
  [GenshinServer.AMERICA]: 1,
  [GenshinServer.EUROPE]: 2,
  [GenshinServer.ASIA]: 3,
  [GenshinServer.TW_HK_MO]: 4,
};

const genshinServerValues = Object.values(GenshinServer);

export function isGenshinServer(server: string): GenshinServerValue {
  if (!genshinServerValues.includes(server as GenshinServerValue)) {
    throw new Error(`Invalid Genshin server: ${server}`);
  }

  return server as GenshinServerValue;
}
