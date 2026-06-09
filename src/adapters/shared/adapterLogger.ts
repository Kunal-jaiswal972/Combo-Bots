import { logger } from "../../utils/utils.js";

export type AdapterLogLevel = "debug" | "info" | "warn" | "error";

export interface AdapterLogOptions {
  scope?: string | number;
  level?: AdapterLogLevel;
}

export interface AdapterLogger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: Error): void;
}

export function formatAdapterLogPrefix(
  adapterId: string,
  scope?: string | number,
): string {
  if (scope !== undefined && String(scope).length > 0) {
    return `[${adapterId}:${scope}]`;
  }

  return `[${adapterId}]`;
}

export function logAdapter(
  adapterId: string,
  message: string,
  options?: AdapterLogOptions,
): void {
  const line = `${formatAdapterLogPrefix(adapterId, options?.scope)} ${message}`;
  const level = options?.level ?? "debug";

  switch (level) {
    case "info":
      logger.info(line);
      break;
    case "warn":
      logger.warn(line);
      break;
    case "error":
      logger.error(line);
      break;
    default:
      logger.gray(line);
  }
}

export function createAdapterLogger(
  adapterId: string,
  scope?: string | number,
): AdapterLogger {
  return {
    debug(message: string): void {
      logAdapter(adapterId, message, { scope, level: "debug" });
    },
    info(message: string): void {
      logAdapter(adapterId, message, { scope, level: "info" });
    },
    warn(message: string): void {
      logAdapter(adapterId, message, { scope, level: "warn" });
    },
    error(message: string, error?: Error): void {
      const prefix = formatAdapterLogPrefix(adapterId, scope);
      logger.error(`${prefix} ${message}`, error);
    },
  };
}
