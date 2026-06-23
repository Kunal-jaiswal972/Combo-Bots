import type { TerminalPorts } from "@/adapters/host/core/terminalPorts";
import type { AdapterModule } from "@/adapters/host/registry/adapterModules";
import { isModuleEnabled } from "@/utils";

import { createCliAdapter } from "./cliAdapter";

const CLI_ADAPTER_ID = "cli";

export const cliAdapterModule: AdapterModule = {
  id: CLI_ADAPTER_ID,
  label: "CLI menu",
  lifecycle: "foreground",

  /** Enabled by default; override with `CLI_ENABLED` in the env. */
  isEnabled(): boolean {
    return isModuleEnabled(CLI_ADAPTER_ID, true);
  },

  create(options) {
    const ports: TerminalPorts = options.terminal;

    return {
      adapter: createCliAdapter({
        prompt: ports.prompt,
        display: ports.display,
        bots: options.bots,
        source: CLI_ADAPTER_ID,
      }),
    };
  },
};
