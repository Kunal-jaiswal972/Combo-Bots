import type { BotContext, BotMenuAction } from "@/adapters/host/contracts";
import type { ChromeSession } from "@/tools/browser";

import { sendBulkFriendRequests } from "./runFriendRequestFlow";

/** `getSession` returns the MAL browser session opened when entering the bot. */
export function buildMenuActions(
  getSession: () => ChromeSession | null,
): BotMenuAction[] {
  return [
    {
      id: "run",
      label: "Send bulk friend requests",
      run: async (ctx: BotContext) => {
        const session = getSession();

        if (!session) {
          ctx.prompt.error("No active MAL session — re-enter the bot.");
          return;
        }

        await sendBulkFriendRequests(session.page, ctx.prompt);
      },
    },
  ];
}
