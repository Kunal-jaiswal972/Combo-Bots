const TRUE_PATTERN = /^(1|true|yes|on)$/i;
const FALSE_PATTERN = /^(0|false|no|off)$/i;

/**
 * Env var that gates a module by its id, e.g.
 * `"code-redeem"` -> `CODE_REDEEM_ENABLED`, `"telegram"` -> `TELEGRAM_ENABLED`.
 */
export function moduleEnabledEnvKey(id: string): string {
  return `${id.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase()}_ENABLED`;
}

/**
 * Resolve whether a module (bot or adapter) is enabled.
 *
 * The env var `<ID>_ENABLED` takes priority when set to a recognized value;
 * otherwise the module's source-code `fallback` is used. This lets every
 * module declare its own default while staying overridable per-deployment
 * without pre-declaring each flag in the config schema.
 */
export function isModuleEnabled(id: string, fallback: boolean): boolean {
  const raw = process.env[moduleEnabledEnvKey(id)]?.trim();

  if (!raw) {
    return fallback;
  }

  if (TRUE_PATTERN.test(raw)) {
    return true;
  }

  if (FALSE_PATTERN.test(raw)) {
    return false;
  }

  return fallback;
}
