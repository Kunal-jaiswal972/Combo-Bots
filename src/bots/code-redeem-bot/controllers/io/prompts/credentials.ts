import type { GameIdValue } from "@/bots/code-redeem-bot/config/constants.js";
import { getServerPromptChoices } from "@/bots/code-redeem-bot/hoyoverse/shared/credentials.js";
import type { GameLoginCredentials } from "@/bots/code-redeem-bot/types.js";
import type { PromptPort } from "@/shared/adapters/host/contracts/promptPort.js";

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
