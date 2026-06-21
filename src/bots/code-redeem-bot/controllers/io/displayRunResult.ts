import { formatRunResultForDisplay } from "@/bots/code-redeem-bot/utils/runResult.js";
import type { RunResult } from "@/bots/code-redeem-bot/types.js";
import type { PromptPort } from "@/shared/adapters/host/contracts/promptPort.js";

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
