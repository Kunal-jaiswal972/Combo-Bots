import { ADAPTER_ID_CLI, ADAPTER_LABEL_CLI } from "@/config";
import type { AdapterModule, TerminalPorts } from "@/services/bridge";
import { isModuleEnabled } from "@/utils";

import { createCliAdapter } from "./cliAdapter";

export const cliAdapterModule: AdapterModule = {
  id: ADAPTER_ID_CLI,
  label: ADAPTER_LABEL_CLI,
  lifecycle: "foreground",

  /** Enabled by default; override with `CLI_ENABLED` in the env. */
  isEnabled(): boolean {
    return isModuleEnabled(ADAPTER_ID_CLI, true);
  },

  create(options) {
    const ports: TerminalPorts = options.terminal;

    return {
      adapter: createCliAdapter({
        prompt: ports.prompt,
        display: ports.display,
        bots: options.bots,
        source: ADAPTER_ID_CLI,
      }),
    };
  },
};
