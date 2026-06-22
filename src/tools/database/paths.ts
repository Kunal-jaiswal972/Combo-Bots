import path from "node:path";

export interface ResolveDatabasePathOptions {
  readonly basePath: string;
  readonly subfolder: string;
  readonly filename: string;
}

/** Strip optional `file:` prefix from `DATABASE_URL` and resolve to an absolute directory. */
export function resolveDataBaseDir(databaseUrl: string): string {
  const withoutScheme = databaseUrl.startsWith("file:")
    ? databaseUrl.slice("file:".length)
    : databaseUrl;

  return path.resolve(withoutScheme);
}

/** e.g. `<dataBaseDir>/<botId>/genshin.db` */
export function resolveDatabasePath(
  options: ResolveDatabasePathOptions,
): string {
  return path.resolve(options.basePath, options.subfolder, options.filename);
}
