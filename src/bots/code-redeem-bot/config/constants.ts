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

export const GenshinServer = {
  AMERICA: "America",
  EUROPE: "Europe",
  ASIA: "Asia",
  TW_HK_MO: "TW, HK, MO",
} as const;

export type GenshinServerValue =
  (typeof GenshinServer)[keyof typeof GenshinServer];

/** Source id for runs triggered by the bot scheduler (not an input adapter). */
export const SCHEDULER_TASK_SOURCE = "scheduler";
