import { z } from "zod";

import { GameId, type GameIdValue, HoyoServer } from "../../constants";
import type { GameLoginCredentials } from "../../types";

export interface ServerPromptChoice {
  readonly value: string;
  readonly label: string;
}

const usernameSchema = z.string().min(1, "Username is required.");
const passwordSchema = z.string().min(1, "Password is required.");

/** All Hoyoverse gift pages share the same four server regions. */
const hoyoServerValues = [
  HoyoServer.AMERICA,
  HoyoServer.EUROPE,
  HoyoServer.ASIA,
  HoyoServer.TW_HK_MO,
] as const;

const hoyoCredentialsSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  server: z.enum(hoyoServerValues),
});

/** Server choices are identical across Hoyoverse games; `gameId` is accepted for symmetry. */
export function getServerPromptChoices(
  _gameId: GameIdValue,
): ServerPromptChoice[] {
  return hoyoServerValues.map((value) => ({ value, label: value }));
}

export function validateGameCredentials(
  gameId: GameIdValue,
  credentials: GameLoginCredentials,
): GameLoginCredentials {
  const normalized = {
    username: credentials.username.trim(),
    password: credentials.password,
    server: credentials.server,
  };

  switch (gameId) {
    case GameId.GENSHIN:
    case GameId.HSR:
      return hoyoCredentialsSchema.parse(normalized);
    default: {
      const exhaustive: never = gameId;
      throw new Error(`Unsupported game: ${exhaustive}`);
    }
  }
}
