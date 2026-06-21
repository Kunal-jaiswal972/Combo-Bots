import type { PromptPort } from "@/adapters/host/contracts/promptPort";
import {
  buildChromeLaunchOptions,
  closeBrowser,
  launchChromeSession,
} from "@/tools/browser";
import { logger, sleep } from "@/utils";
import { MalDelays } from "../config/constants";
import { fetchFriendProfileLinks, processProfileLink } from "../mal/friends";
import { ensureMalLoggedIn, resolveTargetUsername } from "../mal/login";

export interface RunFriendRequestFlowOptions {
  readonly prompt: PromptPort;
}

export async function runFriendRequestFlow(
  options: RunFriendRequestFlowOptions,
): Promise<void> {
  const launchOptions = buildChromeLaunchOptions();

  try {
    const session = await launchChromeSession(launchOptions);
    const { page } = session;

    await ensureMalLoggedIn({ page, prompt: options.prompt });

    const username = await resolveTargetUsername(options.prompt);

    logger.step("Fetching all friend profiles...");
    const profileLinks = await fetchFriendProfileLinks(page, username);

    const total = profileLinks.length;

    for (let index = 0; index < total; index += 1) {
      const profileUrl = profileLinks[index];

      if (profileUrl === undefined || profileUrl.length === 0) {
        continue;
      }

      await processProfileLink({
        page,
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
    }

    options.prompt.success("Friend request run finished.");
  } finally {
    await closeBrowser("MAL friend request run finished");
  }
}
