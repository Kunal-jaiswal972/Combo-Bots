import { getAppConfig } from "@/utils";
import {
  resolveDataBaseDir,
  resolveDatabasePath,
} from "@/tools/database";
import { BOT_ID } from "./constants";

/** e.g. src/data/mal-friend-request-sender/mal-friend-request-sender.db */
export function resolveMalDatabasePath(): string {
  const appConfig = getAppConfig();

  return resolveDatabasePath({
    basePath: resolveDataBaseDir(appConfig.dataBaseDir),
    subfolder: BOT_ID,
    filename: `${BOT_ID}.db`,
  });
}
