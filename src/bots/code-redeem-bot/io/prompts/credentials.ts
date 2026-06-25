import type { PromptPort } from "@/services/bridge";

import type { GameIdValue } from "../../constants";
import { getServerPromptChoices } from "../../hoyoverse/shared/credentials";
import type { GameLoginCredentials } from "../../types";

export async function promptCredentials(
  port: PromptPort,
  gameId: GameIdValue,
): Promise<GameLoginCredentials> {
  const username = await port.username();
  const password = await port.password();
  const serverChoices = getServerPromptChoices(gameId);
  const server = await port.choose("Server", serverChoices);

  return {
    username: username.trim(),
    password,
    server,
  };
}
