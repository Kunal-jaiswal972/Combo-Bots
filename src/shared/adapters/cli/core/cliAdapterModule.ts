import type { AdapterModule } from "@/shared/adapters/host/registry/adapterModules.js";
import { createCliAdapter } from "./cliAdapter.js";
import type { TerminalPorts } from "@/shared/adapters/host/core/terminalPorts.js";

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
