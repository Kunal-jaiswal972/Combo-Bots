import { randomUUID } from "node:crypto";

import type { ChromeSession } from "@/tools/browser";
import { logger } from "@/utils";

import type { GameIdValue, HoyoServerValue } from "../../constants";
import { getStorage } from "../../storage";
import type {
  GameLoginCredentials,
  RedeemTask,
  RunResult,
  RunResultStatus,
  ScrapePolicy,
  ScrapeStats,
} from "../../types";
import { evaluateScrapePolicy } from "../policies/scrapePolicy";
import {
  hasRedeemableCodesForGame,
  logRunSummary,
  redeemCodes,
} from "./browserRedemption";
import { runScrape } from "./scrapeService";

export interface InteractiveRedeemOptions {
  /** Live session opened on bot enter and already logged in. */
  session: ChromeSession;
  gameId: GameIdValue;
  /** Logged-in account label (masked by Hoyoverse), for history/logging only. */
  account: string | null;
  server: HoyoServerValue;
  scrapePolicy: ScrapePolicy;
  /** Adapter that drove this run, for run-history attribution. */
  source: string;
  metadata?: Record<string, string>;
}

/**
 * Redeem on the already-open, already-logged-in session (the interactive
 * "Redeem codes" action). Unlike {@link executeRedeemRun}, it does not launch
 * or close a browser and does not log in — login was settled on bot enter.
 */
export async function runInteractiveRedeem(
  options: InteractiveRedeemOptions,
): Promise<RunResult> {
  const startedAt = new Date().toISOString();
  const taskId = randomUUID();

  let scraped = false;
  let scrapeStats: ScrapeStats | null = null;

  const decision = await evaluateScrapePolicy({
    policy: options.scrapePolicy,
    gameId: options.gameId,
  });
  logger.gray(decision.reason);

  if (decision.shouldScrape) {
    scrapeStats = await runScrape(options.gameId);
    scraped = true;
  } else {
    logger.info("Skipping scrape step.");
  }

  let redeemSummary: RunResult["redeemSummary"] = null;

  if (!(await hasRedeemableCodesForGame(options.gameId))) {
    logger.info("No redeemable codes — nothing to redeem.");
  } else {
    const credentials: GameLoginCredentials = {
      username: options.account ?? "current session",
      password: "",
      server: options.server,
    };

    redeemSummary = await redeemCodes({
      gameId: options.gameId,
      session: options.session,
      credentials,
      alreadyLoggedIn: true,
    });
    logRunSummary(redeemSummary);
    logger.success("Run completed successfully.");
  }

  const status: RunResultStatus =
    redeemSummary && redeemSummary.stillPending > 0 ? "partial" : "success";

  const result: RunResult = {
    taskId,
    status,
    scraped,
    scrapeStats,
    redeemSummary,
    startedAt,
    finishedAt: new Date().toISOString(),
  };

  const task: RedeemTask = {
    id: taskId,
    gameId: options.gameId,
    credentials: {
      username: options.account ?? "",
      password: "",
      server: options.server,
    },
    scrapePolicy: options.scrapePolicy,
    source: options.source,
    createdAt: startedAt,
    metadata: options.metadata,
  };

  await getStorage().runHistory.record({ task, result });

  return result;
}
