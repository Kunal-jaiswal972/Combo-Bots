import { BOT_ID_MAL } from "@/config";
import { resolveDataBaseDir, resolveDatabasePath } from "@/tools/database";
import { getAppConfig } from "@/utils";

/** e.g. src/data/mal-friend-request-sender/mal-friend-request-sender.db */
export function resolveMalDatabasePath(): string {
  const appConfig = getAppConfig();

  return resolveDatabasePath({
    basePath: resolveDataBaseDir(appConfig.dataBaseDir),
    subfolder: BOT_ID_MAL,
    filename: `${BOT_ID_MAL}.db`,
  });
}
