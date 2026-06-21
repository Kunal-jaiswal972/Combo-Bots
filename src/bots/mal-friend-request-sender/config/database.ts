import path from "node:path";
import { getAppConfig } from "@/utils/env/appConfig";

function resolveDataBaseDir(databaseUrl: string): string {
  const withoutScheme = databaseUrl.startsWith("file:")
    ? databaseUrl.slice("file:".length)
    : databaseUrl;

  return path.resolve(withoutScheme);
}

/** e.g. src/data/mal-friend-request-sender.db */
export function resolveMalDatabasePath(): string {
  const appConfig = getAppConfig();

  return path.resolve(
    resolveDataBaseDir(appConfig.dataBaseDir),
    "mal-friend-request-sender.db",
  );
}
