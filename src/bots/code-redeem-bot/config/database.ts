import path from "node:path";
import { getAppConfig } from "@/shared/utils/env/appConfig.js";
import { GameId, type GameIdValue } from "./constants.js";

export const gameDatabaseIds = Object.values(GameId) as [
  GameIdValue,
  ...GameIdValue[],
];

function resolveDataBaseDir(databaseUrl: string): string {
  const withoutScheme = databaseUrl.startsWith("file:")
    ? databaseUrl.slice("file:".length)
    : databaseUrl;

  return path.resolve(withoutScheme);
}

/** e.g. src/data/genshin.db, src/data/hsr.db */
export function resolveGameDatabasePath(gameId: GameIdValue): string {
  const appConfig = getAppConfig();

  return path.resolve(resolveDataBaseDir(appConfig.dataBaseDir), `${gameId}.db`);
}
