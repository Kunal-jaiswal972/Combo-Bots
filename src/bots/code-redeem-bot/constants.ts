export const CodeStatus = {
  ACTIVE: "active",
  EXPIRED: "expired",
} as const;

export type CodeStatusValue = (typeof CodeStatus)[keyof typeof CodeStatus];

export const codeStatusValues: [CodeStatusValue, ...CodeStatusValue[]] = [
  CodeStatus.ACTIVE,
  CodeStatus.EXPIRED,
];

export const RedeemStatus = {
  PENDING: "pending",
  REDEEMED: "redeemed",
  FAILED: "failed",
  EXPIRED: "expired",
  UNAVAILABLE: "unavailable",
} as const;

export type RedeemStatusValue =
  (typeof RedeemStatus)[keyof typeof RedeemStatus];

export const redeemStatusValues: [RedeemStatusValue, ...RedeemStatusValue[]] = [
  RedeemStatus.PENDING,
  RedeemStatus.REDEEMED,
  RedeemStatus.FAILED,
  RedeemStatus.EXPIRED,
  RedeemStatus.UNAVAILABLE,
];

export const GameId = {
  GENSHIN: "genshin",
  HSR: "hsr",
} as const;

export type GameIdValue = (typeof GameId)[keyof typeof GameId];

/**
 * Server regions shared by every Hoyoverse gift page (Genshin, HSR, …).
 * The redeem dropdown lists them in this order, so the index also drives the
 * server-select nth-child lookup in `hoyoverse/shared/config.ts`.
 */
export const HoyoServer = {
  AMERICA: "America",
  EUROPE: "Europe",
  ASIA: "Asia",
  TW_HK_MO: "TW, HK, MO",
} as const;

export type HoyoServerValue = (typeof HoyoServer)[keyof typeof HoyoServer];

export const hoyoServerValues: [HoyoServerValue, ...HoyoServerValue[]] = [
  HoyoServer.AMERICA,
  HoyoServer.EUROPE,
  HoyoServer.ASIA,
  HoyoServer.TW_HK_MO,
];
