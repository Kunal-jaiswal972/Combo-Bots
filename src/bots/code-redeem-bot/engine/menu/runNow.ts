import type { PromptPort } from "@/adapters/host/contracts";

import { displayRunResult } from "../../controllers/io/displayRunResult";
import { promptCredentials } from "../../controllers/io/prompts/credentials";
import { promptGameSelection } from "../../controllers/io/prompts/gameSelection";
import type { TaskSource } from "../../types";
import { createRedeemTask } from "../createRedeemTask";
import { runRedeemTask } from "../run/runRedeemTask";

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
