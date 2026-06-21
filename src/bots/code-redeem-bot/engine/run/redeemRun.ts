import {
  buildChromeLaunchOptions,
  launchChromeSession,
} from "@/shared/tools/browser.js";
import { closeBrowser } from "@/shared/tools/browser.js";
import type { RedeemTask } from "@/bots/code-redeem-bot/types.js";
import type { RunResult, RunResultStatus } from "@/bots/code-redeem-bot/types.js";
import { getGameModule } from "@/bots/code-redeem-bot/engine/gameRegistry.js";
import type { ChromeSession } from "@/shared/tools/browser.js";
import { getAppConfig } from "@/shared/utils/env/appConfig.js";
import { getDatabasePath } from "@/bots/code-redeem-bot/controllers/storage.js";
import type { RedeemSummary } from "@/bots/code-redeem-bot/types.js";
import type { ScrapeStats } from "@/bots/code-redeem-bot/types.js";
import {
  hasRedeemableCodesForGame,
  logRunSummary,
  redeemCodes,
} from "./browserRedemption.js";
import { runScrape } from "./scrapeService.js";
import { logger } from "@/shared/utils.js";
import { evaluateScrapePolicy } from "../policies/scrapePolicy.js";

export interface ExecuteRedeemRunOptions {
  task: RedeemTask;
}

function resolveRunStatus(redeemSummary: RedeemSummary | null): RunResultStatus {
  if (redeemSummary === null) {
    return "success";
  }

  if (redeemSummary.stillPending > 0) {
    return "partial";
  }

  return "success";
}

/** Execute scrape → redeem for a task that is already fully configured. */
export async function executeRedeemRun(
  options: ExecuteRedeemRunOptions,
): Promise<RunResult> {
  const startedAt = new Date().toISOString();
  const { task } = options;
  const appConfig = getAppConfig();
  const gameModule = getGameModule(task.gameId);

  logger.step(
    `Auto Code Redeemer — game: ${gameModule.displayName} (${task.gameId})`,
  );
  logger.gray(`Task: ${task.id} (source: ${task.source})`);
  logger.gray(`Chrome profile: ${appConfig.chrome.userDataDir}`);
  logger.gray(`Database: ${getDatabasePath(task.gameId)}`);

  let session: ChromeSession | null = null;
  let scrapeStats: ScrapeStats | null = null;
  let scraped = false;
  try {
    const decision = await evaluateScrapePolicy({
      policy: task.scrapePolicy,
      gameId: task.gameId,
    });

    logger.gray(decision.reason);

    if (decision.shouldScrape) {
      scrapeStats = await runScrape(task.gameId);
      scraped = true;
    } else {
      logger.info("Skipping scrape step.");
    }

    const shouldLaunchBrowser = await hasRedeemableCodesForGame(task.gameId);

    if (!shouldLaunchBrowser) {
      logger.info("No redeemable codes — skipping browser launch.");

      return {
        taskId: task.id,
        status: "success",
        scraped,
        scrapeStats,
        redeemSummary: null,
        startedAt,
        finishedAt: new Date().toISOString(),
      };
    }

    session = await launchChromeSession(buildChromeLaunchOptions());
    const redeemSummary = await redeemCodes({
      gameId: task.gameId,
      session,
      credentials: task.credentials,
    });

    logRunSummary(redeemSummary);
    logger.success("Run completed successfully.");

    return {
      taskId: task.id,
      status: resolveRunStatus(redeemSummary),
      scraped,
      scrapeStats,
      redeemSummary,
      startedAt,
      finishedAt: new Date().toISOString(),
    };
  } finally {
    if (session) {
      await closeBrowser("run finished");
    }
  }
}
