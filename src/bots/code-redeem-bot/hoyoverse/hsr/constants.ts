export const HsrServer = {
  AMERICA: "America",
  EUROPE: "Europe",
  ASIA: "Asia",
  TW_HK_MO: "TW, HK, MO",
} as const;

export type HsrServerValue = (typeof HsrServer)[keyof typeof HsrServer];
