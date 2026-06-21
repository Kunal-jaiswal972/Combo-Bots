import { createRedeemTask } from "@/bots/code-redeem-bot/engine/createRedeemTask";
import { runRedeemTask } from "@/bots/code-redeem-bot/engine/run/runRedeemTask";
import type { TaskSource } from "@/bots/code-redeem-bot/types";
import type { PromptPort } from "@/adapters/host/contracts/promptPort";
import { displayRunResult } from "@/bots/code-redeem-bot/controllers/io/displayRunResult";
import { promptCredentials } from "@/bots/code-redeem-bot/controllers/io/prompts/credentials";
import { promptGameSelection } from "@/bots/code-redeem-bot/controllers/io/prompts/gameSelection";

export interface RunNowMenuOptions {
  port: PromptPort;
  source: TaskSource;
  metadata?: Record<string, string>;
}

/** Menu path: prompt for game/credentials, then execute a redeem run. */
export async function runNowMenu(
  options: RunNowMenuOptions,
): Promise<void> {
  const { port, source, metadata } = options;

  port.step("Run now — configure this run.");

  const gameId = await promptGameSelection(port);
  const credentials = await promptCredentials(port, gameId);
  const shouldScrape = await port.yesNo("Fetch new codes from the wiki?", true);

  const task = createRedeemTask({
    gameId,
    credentials,
    scrapePolicy: shouldScrape ? { type: "always" } : { type: "never" },
    source,
    metadata,
  });

  const result = await runRedeemTask({ task });
  displayRunResult(port, result);
}
