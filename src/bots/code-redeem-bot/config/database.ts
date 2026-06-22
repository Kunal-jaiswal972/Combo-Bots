import {
  resolveDataBaseDir,
  resolveDatabasePath,
} from "@/tools/database";
import { getAppConfig } from "@/utils";

import { BOT_ID, GameId, type GameIdValue } from "./constants";

export const gameDatabaseIds = Object.values(GameId) as [
  GameIdValue,
  ...GameIdValue[],
];

/** e.g. src/data/code-redeem/genshin.db, src/data/code-redeem/hsr.db */
export function resolveGameDatabasePath(gameId: GameIdValue): string {
  const appConfig = getAppConfig();

  return resolveDatabasePath({
    basePath: resolveDataBaseDir(appConfig.dataBaseDir),
    subfolder: BOT_ID,
    filename: `${gameId}.db`,
  });
}
