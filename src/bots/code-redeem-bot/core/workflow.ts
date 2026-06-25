import { promptRecurrenceSpec } from "@/services/adapter-builder";
import {
  type Workflow,
  workflow,
  type WorkflowContext,
} from "@/services/bot-builder";
import { isPromptBack } from "@/services/bridge";
import { BrowserDelays, navigate, waitForNetworkIdle } from "@/tools/browser";
import type { RecurrenceSpec, TaskScheduler } from "@/tools/scheduler";
import { formatSchedulerInstant, logger } from "@/utils";

import type { GameIdValue, HoyoServerValue } from "../constants";
import { createRedeemTask } from "../functions/createRedeemTask";
import { getGameModule } from "../functions/gameRegistry";
import { runInteractiveRedeem } from "../functions/run/interactiveRedeem";
import {
  getLoggedInHoyoAccount,
  loginToHoyoInteractive,
  logOutOfHoyo,
} from "../hoyoverse/shared/auth";
import { getServerPromptChoices } from "../hoyoverse/shared/credentials";
import { displayRunResult } from "../io/displayRunResult";
import { promptCredentials } from "../io/prompts/credentials";
import { promptGameSelection } from "../io/prompts/gameSelection";
import { showRunHistoryList } from "../io/runHistoryList";
import { showScheduledTaskList } from "../io/scheduledTaskList";
import { listRecentRunHistoryWithTasks } from "../scheduling/queries/runHistory";
import {
  cancelScheduledTask,
  listScheduledTasks,
} from "../scheduling/queries/scheduledTasks";
import type { RedeemTaskTemplate } from "../types";
import { formatScheduledTaskChoiceLabel } from "../utils/scheduledTask";

/** Per-session scratch state for the Code Redeemer bot. */
export interface RedeemState {
  /** Game chosen on enter; drives the redeem page and all menu actions. */
  gameId: GameIdValue | null;
  /** Logged-in account label from the live page (masked), or null. */
  account: string | null;
  /** Server region chosen for the current redeem run. */
  server: HoyoServerValue | null;
}

export function createInitialState(): RedeemState {
  return { gameId: null, account: null, server: null };
}

function requirePage(ctx: WorkflowContext<RedeemState>) {
  if (!ctx.session) {
    throw new Error("Code Redeemer workflow requires an open browser session.");
  }
  return ctx.session.page;
}

function requireSession(ctx: WorkflowContext<RedeemState>) {
  if (!ctx.session) {
    throw new Error("Code Redeemer workflow requires an open browser session.");
  }
  return ctx.session;
}

function requireGameId(ctx: WorkflowContext<RedeemState>): GameIdValue {
  if (ctx.state.gameId === null) {
    throw new Error("No game selected — the enter workflow must run first.");
  }
  return ctx.state.gameId;
}

/**
 * Enter workflow: choose a game, open its redeem page, detect the logged-in
 * account, and offer Continue / Log out (or log in when signed out). Runs once
 * before the action menu.
 */
export const redeemEnterWorkflow: Workflow<RedeemState> = workflow<RedeemState>(
  "code-redeem-enter",
)
  .prompt("select-game", async (ctx) => {
    ctx.state.gameId = await promptGameSelection(ctx.prompt);
  })
  .step("open-redeem-page", async (ctx) => {
    const game = getGameModule(requireGameId(ctx));
    logger.step(`Opening ${game.displayName} redeem page...`);
    const page = requirePage(ctx);
    await navigate({ page, url: game.config.redeemPageUrl });
    // The gift page is a Vue SPA — DOMContentLoaded fires before components mount.
    // Wait for network idle so the app has rendered its login state UI before we
    // inspect the DOM.
    await waitForNetworkIdle({
      page,
      timeout: BrowserDelays.LONG,
      reason: `${game.displayName} redeem page SPA to finish mounting`,
    });
  })
  .step("detect-account", async (ctx) => {
    const game = getGameModule(requireGameId(ctx));
    ctx.state.account = await getLoggedInHoyoAccount(
      requirePage(ctx),
      game.config,
    );
  })
  .branch(
    "already-logged-in",
    (ctx) => ctx.state.account !== null,
    (then) =>
      then.prompt("continue-or-logout", async (ctx) => {
        const game = getGameModule(requireGameId(ctx));
        ctx.prompt.info(`Already logged in as ${ctx.state.account}.`);

        const choice = await ctx.prompt.choose(
          "How would you like to continue?",
          [
            { value: "continue", label: `Continue as ${ctx.state.account}` },
            { value: "logout", label: "Log out and use another account" },
          ],
        );

        if (choice === "logout") {
          await logOutOfHoyo(requirePage(ctx), game.config);
          ctx.state.account = null;
        }
      }),
  )
  .branch(
    "needs-login",
    (ctx) => ctx.state.account === null,
    (then) =>
      then.step("login", async (ctx) => {
        const game = getGameModule(requireGameId(ctx));
        await loginToHoyoInteractive(requirePage(ctx), game.config, ctx.prompt);
        ctx.state.account = await getLoggedInHoyoAccount(
          requirePage(ctx),
          game.config,
        );

        if (ctx.state.account) {
          ctx.prompt.success(`Logged in as ${ctx.state.account}.`);
        } else {
          ctx.prompt.warn(
            "Could not confirm login — continuing, but redemption may fail.",
          );
        }
      }),
  )
  .build();

/**
 * "Redeem codes" action: pick a server, optionally scrape fresh codes, then
 * redeem on the already-open, already-logged-in session.
 */
export const redeemNowWorkflow: Workflow<RedeemState> = workflow<RedeemState>(
  "code-redeem-run",
)
  .prompt("select-server", async (ctx) => {
    const choices = getServerPromptChoices(requireGameId(ctx));
    ctx.state.server = (await ctx.prompt.choose(
      "Server",
      choices,
    )) as HoyoServerValue;
  })
  .step("redeem", async (ctx) => {
    const gameId = requireGameId(ctx);
    const shouldScrape = await ctx.prompt.yesNo(
      "Fetch new codes from the wiki?",
      true,
    );

    if (ctx.state.server === null) {
      throw new Error("No server selected.");
    }

    const result = await runInteractiveRedeem({
      session: requireSession(ctx),
      gameId,
      account: ctx.state.account,
      server: ctx.state.server,
      scrapePolicy: shouldScrape ? { type: "always" } : { type: "never" },
      source: ctx.source,
      metadata: ctx.metadata,
    });

    displayRunResult(ctx.prompt, result);
  })
  .build();

/**
 * "Schedule" action: prompt for a recurrence + credentials (stored so unattended
 * runs can sign in), then register a scheduled task for the selected game.
 */
export function createScheduleWorkflow(
  scheduler: TaskScheduler<RedeemTaskTemplate>,
): Workflow<RedeemState> {
  return workflow<RedeemState>("code-redeem-schedule")
    .step("schedule", async (ctx) => {
      const gameId = requireGameId(ctx);
      ctx.prompt.step("Schedule — configure a recurring or one-shot task.");

      let schedule: RecurrenceSpec;
      try {
        schedule = await promptRecurrenceSpec(ctx.prompt);
      } catch (error) {
        if (isPromptBack(error)) {
          ctx.prompt.gray("Schedule setup cancelled.");
          return;
        }
        throw error;
      }

      const credentials = await promptCredentials(ctx.prompt, gameId);

      const redeemTask = createRedeemTask({
        gameId,
        credentials,
        scrapePolicy: { type: "ifNotScrapedToday" },
        source: ctx.source,
        metadata: ctx.metadata,
      });

      const scheduled = await scheduler.register({
        payload: {
          gameId: redeemTask.gameId,
          credentials: redeemTask.credentials,
          scrapePolicy: redeemTask.scrapePolicy,
          // Preserve the adapter that created this schedule so triggered runs
          // can route notifications back to the right channel.
          metadata: { ...redeemTask.metadata, originalSource: ctx.source },
        },
        schedule,
      });

      ctx.prompt.success(`Scheduled task created: ${scheduled.id}`);
      ctx.prompt.gray(
        `Next run: ${formatSchedulerInstant(scheduled.nextRunAt)}`,
      );
      ctx.prompt.gray(
        "Keep this process running — scheduled tasks fire while dev or start is active.",
      );
    })
    .build();
}

/** "List scheduled tasks" action. */
export function createListWorkflow(
  scheduler: TaskScheduler<RedeemTaskTemplate>,
): Workflow<RedeemState> {
  return workflow<RedeemState>("code-redeem-list")
    .step("list", async (ctx) => {
      const tasks = await listScheduledTasks(scheduler);

      if (tasks.length === 0) {
        ctx.prompt.info("No scheduled tasks.");
        return;
      }

      showScheduledTaskList(ctx.prompt, ctx.display, tasks);
    })
    .build();
}

/** "Cancel a scheduled task" action. */
export function createCancelWorkflow(
  scheduler: TaskScheduler<RedeemTaskTemplate>,
): Workflow<RedeemState> {
  return workflow<RedeemState>("code-redeem-cancel")
    .step("cancel", async (ctx) => {
      const tasks = await listScheduledTasks(scheduler);

      if (tasks.length === 0) {
        ctx.prompt.info("No scheduled tasks.");
        return;
      }

      const choices = tasks.map((task) => ({
        value: task.id,
        label: formatScheduledTaskChoiceLabel(task),
      }));
      const taskId = await ctx.prompt.choose("Cancel which task?", choices);
      await cancelScheduledTask(scheduler, taskId);
      ctx.prompt.success(`Cancelled scheduled task ${taskId}.`);
    })
    .build();
}

/** "View recent run history" action. */
export function createHistoryWorkflow(
  scheduler: TaskScheduler<RedeemTaskTemplate>,
): Workflow<RedeemState> {
  return workflow<RedeemState>("code-redeem-history")
    .step("history", async (ctx) => {
      const history = await listRecentRunHistoryWithTasks(scheduler, 10);
      showRunHistoryList(
        ctx.prompt,
        ctx.display,
        history.entries,
        history.tasksById,
      );
    })
    .build();
}
