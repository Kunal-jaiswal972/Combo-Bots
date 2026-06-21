import type { GameIdValue } from "@/bots/code-redeem-bot/config/constants";
import type { ParsedRedeemMessage } from "./redeemMessageTypes";
import { parseHoyoverseRedeemMessage } from "./parseHoyoverseRedeemMessage";

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

export function getRedeemMessageParser(gameId: GameIdValue): RedeemMessageParser {
  return parsersByGameId.get(gameId) ?? hoyoverseRedeemMessageParser;
}
