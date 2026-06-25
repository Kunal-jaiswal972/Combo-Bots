import type { PromptPort } from "@/services/bridge";

import type { RunResult } from "../types";
import { formatRunResultForDisplay } from "../utils/runResult";

export function displayRunResult(port: PromptPort, result: RunResult): void {
  const formatted = formatRunResultForDisplay(result);

  port.step(formatted.title);

  for (const line of formatted.grayLines) {
    port.gray(line);
  }

  if (formatted.error) {
    port.error(formatted.error);
  }
}
