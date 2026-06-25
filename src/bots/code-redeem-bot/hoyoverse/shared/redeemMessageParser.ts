import type { GameIdValue } from "../../constants";

export type RedeemMessageAction = "success" | "expired" | "retry" | "pending";

export interface ParsedRedeemMessage {
  action: RedeemMessageAction;
  message: string;
}

/**
 * Default parser for Hoyoverse gift-page modal text (Genshin, HSR, ZZZ share
 * the same cdkey UI wording).
 */
export function parseHoyoverseRedeemMessage(
  rawMessage: string,
): ParsedRedeemMessage {
  const message = rawMessage.trim();
  const lower = message.toLowerCase();

  if (message.length === 0) {
    return {
      action: "pending",
      message: "No redemption response detected.",
    };
  }

  if (lower.includes("success")) {
    return { action: "success", message };
  }

  if (lower.includes("already") || lower.includes("in use")) {
    return { action: "success", message };
  }

  if (lower.includes("expired") || lower.includes("expire")) {
    return { action: "expired", message };
  }

  if (lower.includes("sec")) {
    return { action: "retry", message };
  }

  return { action: "pending", message };
}

/** Pluggable parser for redeem modal feedback. Swap per game when UI text diverges. */
export interface RedeemMessageParser {
  parse(rawMessage: string): ParsedRedeemMessage;
}

export const hoyoverseRedeemMessageParser: RedeemMessageParser = {
  parse: parseHoyoverseRedeemMessage,
};

const parsersByGameId = new Map<GameIdValue, RedeemMessageParser>();

export function registerRedeemMessageParser(
  gameId: GameIdValue,
  parser: RedeemMessageParser,
): void {
  parsersByGameId.set(gameId, parser);
}

export function getRedeemMessageParser(
  gameId: GameIdValue,
): RedeemMessageParser {
  return parsersByGameId.get(gameId) ?? hoyoverseRedeemMessageParser;
}
