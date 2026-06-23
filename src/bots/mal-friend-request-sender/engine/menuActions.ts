import type { BotContext, BotMenuAction } from "@/adapters/host/contracts";

import { runFriendRequestFlow } from "./runFriendRequestFlow";

export function buildMenuActions(): BotMenuAction[] {
  return [
    {
      id: "run",
      label: "Run — send friend requests to a user's friends",
      run: async (ctx: BotContext) => {
        await runFriendRequestFlow({ prompt: ctx.prompt });
      },
    },
  ];
}
