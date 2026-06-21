import type { GameIdValue } from "@/bots/code-redeem-bot/config/constants.js";
import { gameModules } from "@/bots/code-redeem-bot/engine/gameRegistry.js";
import type { PromptOptions, PromptPort } from "@/shared/adapters/host/contracts/promptPort.js";

export async function promptGameSelection(
  port: PromptPort,
  options?: PromptOptions,
): Promise<GameIdValue> {
  const choices = gameModules.map((module) => ({
    value: module.id,
    label: `${module.displayName} (${module.id})`,
  }));

  const gameId = await port.choose("Select game", choices, options);
  const selected = gameModules.find((module) => module.id === gameId);
  port.gray(`Game: ${selected?.displayName ?? gameId} (${gameId})`);

  return gameId;
}
