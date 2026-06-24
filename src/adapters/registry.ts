import { cliAdapterModule } from "@/adapters/cli";
import { telegramAdapterModule } from "@/adapters/telegram";
import type { AdapterModule } from "@/services/bridge";

/**
 * Central adapter registry. To add an adapter (e.g. Discord, HTTP API):
 * 1. Implement `AdapterModule` under `adapters/<name>/`
 * 2. Append it here
 */
export const adapterModules = [
  cliAdapterModule,
  telegramAdapterModule,
] as const satisfies readonly AdapterModule[];

export function getRegisteredAdapterIds(): readonly string[] {
  return adapterModules.map((module) => module.id);
}
