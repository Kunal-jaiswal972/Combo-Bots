import { GameId, type GameIdValue } from "@/bots/code-redeem-bot/config/constants";
import type { ChromeSession } from "@/tools/browser";
import type {
  CodeRedeemResult,
  GameRedeemOptions,
  ScrapedCodeRow,
} from "@/bots/code-redeem-bot/types";
import { ConfigError } from "@/utils";
import { genshinGameModule } from "../hoyoverse/genshin/core/genshinModule";
import { hsrGameModule } from "../hoyoverse/hsr/hsrModule";

export type GameScraper = () => Promise<ScrapedCodeRow[]>;

export type GameRedeemer = (
  session: ChromeSession,
  options: GameRedeemOptions,
) => Promise<CodeRedeemResult[]>;

/** Full game plug-in. Register new games in `gameModules` below. */
export interface GameModule {
  readonly id: GameIdValue;
  readonly displayName: string;
  readonly source: string;
  readonly scrapeCodes: GameScraper;
  readonly redeemCodes: GameRedeemer;
}

export const gameModules = [
  genshinGameModule,
  hsrGameModule,
] as const satisfies readonly GameModule[];

const modulesById = new Map<GameIdValue, GameModule>(
  gameModules.map((module) => [module.id, module]),
);

function validateRegisteredModules(): void {
  for (const module of gameModules) {
    const knownIds = Object.values(GameId);
    if (!knownIds.includes(module.id)) {
      throw new ConfigError(
        `Game module "${module.id}" is not declared in GameId (config/constants.ts).`,
      );
    }
  }
}

validateRegisteredModules();

export const registeredGameIds = gameModules.map(
  (module) => module.id,
) as [GameIdValue, ...GameIdValue[]];

export function getGameModule(gameId: GameIdValue): GameModule {
  const module = modulesById.get(gameId);

  if (!module) {
    throw new ConfigError(
      `No game module registered for gameId: ${gameId}. Add it to engine/gameRegistry.ts.`,
    );
  }

  return module;
}
