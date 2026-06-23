/** @see ./docs — bot overview, flow, storage, and layout */
import type {
  Bot,
  BotContext,
  BotModule,
  BotModuleCreateOptions,
} from "@/adapters/host/contracts";
import { BOT_ID_MAL, BOT_LABEL_MAL } from "@/config";
import {
  buildChromeLaunchOptions,
  type ChromeSession,
  closeBrowser,
  launchChromeSession,
} from "@/tools/browser";
import { isModuleEnabled } from "@/utils";

import {
  bootstrapMalStorage,
  closeMalDatabase,
} from "./controllers/storage/db";
import { buildMenuActions } from "./engine/menuActions";
import { ensureMalAccount } from "./mal/login";

export function createMalFriendRequestBot(
  _options: BotModuleCreateOptions,
): Bot {
  // Browser session is opened when the user enters the bot (after login is
  // settled) and reused by the action; closed when leaving the bot.
  let session: ChromeSession | null = null;

  return {
    id: BOT_ID_MAL,
    label: BOT_LABEL_MAL,

    async start(): Promise<void> {
      bootstrapMalStorage();
    },

    async stop(): Promise<void> {
      closeMalDatabase();
    },

    /** Confirm the MAL account before showing the menu. */
    async enter(ctx: BotContext): Promise<void> {
      session = await launchChromeSession(buildChromeLaunchOptions());
      await ensureMalAccount(session.page, ctx.prompt);
    },

    async leave(): Promise<void> {
      session = null;
      await closeBrowser(`left ${BOT_LABEL_MAL} bot`);
    },

    menuActions() {
      return buildMenuActions(() => session);
    },
  };
}

export const malFriendRequestBotModule: BotModule = {
  id: BOT_ID_MAL,
  label: BOT_LABEL_MAL,

  /**
   * Enabled by default; override with `MAL_FRIEND_REQUEST_SENDER_ENABLED` in
   * the env. Set to `false` to hide this bot from the app menu.
   */
  isEnabled(): boolean {
    return isModuleEnabled(BOT_ID_MAL, true);
  },

  create(options: BotModuleCreateOptions): Bot {
    return createMalFriendRequestBot(options);
  },
};
