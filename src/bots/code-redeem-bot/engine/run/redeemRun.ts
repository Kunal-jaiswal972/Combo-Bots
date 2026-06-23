import {
  buildChromeLaunchOptions,
  type ChromeSession,
  closeBrowser,
  launchChromeSession,
} from "@/tools/browser";
import { getAppConfig, logger } from "@/utils";

import { getDatabasePath } from "../../controllers/storage";
import type {
  RedeemSummary,
  RedeemTask,
  RunResult,
  RunResultStatus,
  ScrapeStats,
} from "../../types";
import { getGameModule } from "../gameRegistry";
import { evaluateScrapePolicy } from "../policies/scrapePolicy";
import {
  hasRedeemableCodesForGame,
  logRunSummary,
  redeemCodes,
} from "./browserRedemption";
import { runScrape } from "./scrapeService";

export interface ExecuteRedeemRunOptions {
  task: RedeemTask;
}

function resolveRunStatus(
  redeemSummary: RedeemSummary | null,
): RunResultStatus {
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
