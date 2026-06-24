import type { PromptOptions, PromptPort } from "@/services/bridge";

import type { GameIdValue } from "../../../config/constants";
import { gameModules } from "../../../engine/gameRegistry";

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
