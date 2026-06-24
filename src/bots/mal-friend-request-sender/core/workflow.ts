import {
  type Workflow,
  workflow,
  type WorkflowContext,
} from "@/services/bot-builder";
import { logger, sleep } from "@/utils";

import { MalDelays } from "../constants";
import { fetchMalUserFriendProfileLinks, processMalUserProfile } from "../functions/malFriendRequestHandler";
import {
  getLoggedInMalUsername,
  loginToMal,
  logOutOfMal,
  resolveMalTargetUsername,
} from "../functions/malLogin";

export interface MalState {
  /** Logged-in MAL account (from the live page), or null when not logged in. */
  account: string | null;
  /** MAL username whose friend list is being scraped. */
  target: string;
  /** Friend profile links to send requests to. */
  friends: string[];
}

export function createInitialState(): MalState {
  return { account: null, target: "", friends: [] };
}

function requirePage(ctx: WorkflowContext<MalState>) {
  if (!ctx.session) {
    throw new Error("MAL workflow requires an open browser session.");
  }
  return ctx.session.page;
}

/**
 * Settle the MAL account before the menu: detect the logged-in user, offer to
 * continue or log out, and log in when needed. Runs on entering the bot.
 */
export const malEnterWorkflow: Workflow<MalState> = workflow<MalState>(
  "mal-confirm-account",
)
  .step("detect-account", async (ctx) => {
    ctx.state.account = await getLoggedInMalUsername(requirePage(ctx));
  })
  .branch(
    "already-logged-in",
    (ctx) => ctx.state.account !== null,
    (then) =>
      then.prompt("continue-or-logout", async (ctx) => {
        ctx.prompt.info(`Already logged in as ${ctx.state.account}.`);

        const choice = await ctx.prompt.choose("How would you like to continue?", [
          { value: "continue", label: `Continue as ${ctx.state.account}` },
          { value: "logout", label: "Log out and use another account" },
        ]);

        if (choice === "logout") {
          await logOutOfMal(requirePage(ctx));
          ctx.state.account = null;
        }
      }),
  )
  .branch(
    "needs-login",
    (ctx) => ctx.state.account === null,
    (then) =>
      then.step("login", async (ctx) => {
        await loginToMal(requirePage(ctx), ctx.prompt);
        ctx.state.account = await getLoggedInMalUsername(requirePage(ctx));

        if (ctx.state.account) {
          ctx.prompt.success(`Logged in as ${ctx.state.account}.`);
        } else {
          ctx.prompt.warn(
            "Could not confirm MAL login — continuing, but requests may fail.",
          );
        }
      }),
  )
  .build();

/** Ask for a target user, then send a friend request to each of their friends. */
export const sendBulkWorkflow: Workflow<MalState> = workflow<MalState>(
  "mal-send-bulk",
)
  .prompt("target-username", async (ctx) => {
    ctx.state.target = await resolveMalTargetUsername(ctx.prompt);
  })
  .step("fetch-friends", async (ctx) => {
    logger.step("Fetching all friend profiles...");
    ctx.state.friends = await fetchMalUserFriendProfileLinks(
      requirePage(ctx),
      ctx.state.target,
    );
  })
  .forEach(
    "send-requests",
    (state) => state.friends,
    async (profileUrl, index, ctx) => {
      if (profileUrl.length === 0) {
        return;
      }

      const total = ctx.state.friends.length;
      await processMalUserProfile({
        page: requirePage(ctx),
        profileUrl,
        done: index,
        total,
      });

      if (index < total - 1) {
        logger.gray(
          `Waiting ${MalDelays.betweenProfiles / 1_000}s before the next profile...`,
        );
        await sleep({
          ms: MalDelays.betweenProfiles,
          reason: "between MAL profile visits",
        });
      }
    },
  )
  .step("done", (ctx) => {
    ctx.prompt.success("Friend request run finished.");
  })
  .build();
