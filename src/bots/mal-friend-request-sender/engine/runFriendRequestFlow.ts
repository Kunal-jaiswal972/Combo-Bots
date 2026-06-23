import type { Page } from "puppeteer-core";

import type { PromptPort } from "@/adapters/host/contracts";
import { isAborted, logger, sleep } from "@/utils";

import { MalDelays } from "../config/constants";
import { fetchFriendProfileLinks, processProfileLink } from "../mal/friends";
import { resolveTargetUsername } from "../mal/login";

export async function sendBulkFriendRequests(
  page: Page,
  prompt: PromptPort,
): Promise<void> {
  const target = await resolveTargetUsername(prompt);

  logger.step("Fetching all friend profiles...");
  const profileLinks = await fetchFriendProfileLinks(page, target);

  const total = profileLinks.length;

  for (let index = 0; index < total; index += 1) {
    if (isAborted()) {
      logger.gray("Shutdown requested — stopping profile visits.");
      break;
    }

    const profileUrl = profileLinks[index];

    if (profileUrl === undefined || profileUrl.length === 0) {
      continue;
    }

    await processProfileLink({ page, profileUrl, done: index, total });

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

  prompt.success("Friend request run finished.");
}
