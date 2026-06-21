import { formatRunResultForDisplay } from "@/bots/code-redeem-bot/utils/runResult";
import type { RunResult } from "@/bots/code-redeem-bot/types";
import type { PromptPort } from "@/adapters/host/contracts/promptPort";

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
