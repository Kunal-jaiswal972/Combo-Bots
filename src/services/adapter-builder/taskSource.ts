import { z } from "zod";

const taskSourceFormatSchema = z.string().trim().min(1);

let allowedSources: ReadonlySet<string> = new Set();

export function registerAllowedTaskSources(sources: readonly string[]): void {
  allowedSources = new Set(
    sources
      .map((source) => source.trim())
      .filter((source) => source.length > 0),
  );
}

export function getAllowedTaskSources(): readonly string[] {
  return [...allowedSources];
}

/**
 * Bootstrap: register every legal task `source`. Pass the input adapter ids
 * (from the adapter registry) plus per-bot trigger ids (e.g. scheduler). Call
 * once from `bootstrap/runApplication` before bots handle tasks.
 */
export function bootstrapTaskSources(options: {
  readonly adapterSourceIds: readonly string[];
  readonly triggerSourceIds: readonly string[];
}): void {
  registerAllowedTaskSources([
    ...options.adapterSourceIds,
    ...options.triggerSourceIds,
  ]);
}

export function validateTaskSource(source: string): string {
  const trimmed = taskSourceFormatSchema.parse(source);

  if (!allowedSources.has(trimmed)) {
    const registered =
      allowedSources.size > 0
        ? [...allowedSources].join(", ")
        : "(none — bootstrapTaskSources was not called)";

    throw new z.ZodError([
      {
        code: "custom",
        path: ["source"],
        message: `Unknown task source "${trimmed}". Registered: ${registered}`,
      },
    ]);
  }

  return trimmed;
}
