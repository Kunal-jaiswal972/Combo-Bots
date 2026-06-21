import type { Page } from "puppeteer-core";
import { navigate } from "@/tools/browser";
import { logger, sleep } from "@/utils";
import {
  friendsPageUrl,
  MalDelays,
  MalSelectors,
} from "../config/constants";

type FriendRequestStatus =
  | { readonly type: "add"; readonly link: string }
  | { readonly type: "remove"; readonly link: string }
  | { readonly type: "invalid"; readonly link: string }
  | { readonly type: "disabled"; readonly title: string };

export async function fetchFriendProfileLinks(
  page: Page,
  username: string,
): Promise<string[]> {
  const url = friendsPageUrl(username);
  logger.step(`Visiting friends page: ${url}`);

  await navigate({ page, url });
  await sleep({ ms: MalDelays.pageSettle, reason: "friends page to settle" });

  const links = await page.evaluate((selector) => {
    return Array.from(document.querySelectorAll(selector))
      .map((anchor) => (anchor instanceof HTMLAnchorElement ? anchor.href : ""))
      .filter((href) => href.length > 0);
  }, MalSelectors.friendProfileLinks);

  logger.success(`Extracted ${links.length} friend profile links.`);

  if (links.length === 0) {
    logger.warn(
      "No friend links found — the list may be private or MAL markup changed.",
    );
  }

  return links;
}

async function sendFriendRequest(
  page: Page,
  profileUrl: string,
  friendRequestUrl: string,
): Promise<void> {
  await navigate({ page, url: friendRequestUrl });
  await sleep({ ms: MalDelays.pageSettle, reason: "friend request page to settle" });

  const clicked = await page.evaluate((submitSelector) => {
    const button = document.querySelector(submitSelector);
    if (button instanceof HTMLElement) {
      button.click();
      return true;
    }

    return false;
  }, MalSelectors.submitButton);

  if (clicked) {
    logger.success(`Friend request sent for ${profileUrl}`);
    logger.warn(
      `Waiting ${MalDelays.afterRequest / 1_000}s before the next request...`,
    );
    await sleep({
      ms: MalDelays.afterRequest,
      reason: "MAL rate limit between friend requests",
    });
    return;
  }

  logger.warn(`Friend request submit button not found for ${profileUrl}`);
}

async function getFriendRequestStatus(
  page: Page,
  profileUrl: string,
): Promise<void> {
  const status = await page.evaluate((requestSelector) => {
    const friendButton = document.querySelector(requestSelector);

    if (!(friendButton instanceof HTMLElement)) {
      return null;
    }

    const tag = friendButton.tagName.toLowerCase();

    if (tag === "a" && friendButton instanceof HTMLAnchorElement) {
      const href = friendButton.href ?? "";

      if (href.includes("go=add")) {
        return { type: "add", link: href };
      }

      if (href.includes("go=remove")) {
        return { type: "remove", link: href };
      }

      return { type: "invalid", link: href };
    }

    if (tag === "span") {
      const title = (friendButton.getAttribute("title") ?? "").toLowerCase();
      return { type: "disabled", title };
    }

    return null;
  }, MalSelectors.friendRequestButton) as FriendRequestStatus | null;

  if (status === null) {
    logger.gray(`No Add Friend button found on ${profileUrl}`);
    return;
  }

  switch (status.type) {
    case "add":
      logger.step(`Navigating to Add Friend page: ${status.link}`);
      await sendFriendRequest(page, profileUrl, status.link);
      break;
    case "remove":
      logger.info(`Already friends: ${profileUrl}`);
      break;
    case "invalid":
      logger.warn(`Not a valid friend request URL: ${status.link}`);
      break;
    case "disabled": {
      const title = status.title;

      if (title.includes("pending")) {
        logger.warn(`Friend request already pending for ${profileUrl}.`);
      } else if (title.includes("add friend")) {
        logger.warn(`User has disabled friend requests: ${profileUrl}`);
      } else {
        logger.gray(`Unknown friend-button state for ${profileUrl}.`);
      }
      break;
    }
    default:
      logger.gray(`Unhandled friend-button state for ${profileUrl}.`);
  }
}

export interface ProcessProfileLinkOptions {
  readonly page: Page;
  readonly profileUrl: string;
  readonly done: number;
  readonly total: number;
}

export async function processProfileLink(
  options: ProcessProfileLinkOptions,
): Promise<void> {
  const { page, profileUrl, done, total } = options;

  try {
    logger.info(`Visiting profile (${done + 1}/${total}): ${profileUrl}`);
    await navigate({ page, url: profileUrl });
    await sleep({ ms: MalDelays.pageSettle, reason: "profile page to settle" });
    await getFriendRequestStatus(page, profileUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown profile visit error";
    logger.error(`Error visiting profile ${profileUrl}: ${message}`);
  } finally {
    logger.success(`Completed (${done + 1}/${total})`);
  }
}
