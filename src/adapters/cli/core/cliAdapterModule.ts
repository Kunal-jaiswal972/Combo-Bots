import type { TerminalPorts } from "@/adapters/host/core/terminalPorts";
import type { AdapterModule } from "@/adapters/host/registry/adapterModules";

import { createCliAdapter } from "./cliAdapter";

const CLI_ADAPTER_ID = "cli";

export const cliAdapterModule: AdapterModule = {
  id: CLI_ADAPTER_ID,
  label: "CLI menu",
  lifecycle: "foreground",

  isEnabled(appConfig): boolean {
    return appConfig.cliAdapterEnabled;
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
