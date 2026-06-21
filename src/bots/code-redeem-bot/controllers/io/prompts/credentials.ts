import type { GameIdValue } from "@/bots/code-redeem-bot/config/constants";
import { getServerPromptChoices } from "@/bots/code-redeem-bot/hoyoverse/shared/credentials";
import type { GameLoginCredentials } from "@/bots/code-redeem-bot/types";
import type { PromptPort } from "@/adapters/host/contracts/promptPort";

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
