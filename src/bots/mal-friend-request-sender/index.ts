/** @see ./docs — bot overview, flow, storage, and layout */
import type {
  Bot,
  BotModule,
  BotModuleCreateOptions,
} from "@/adapters/host/contracts";
import { isModuleEnabled } from "@/utils";
import { BOT_ID_MAL, BOT_LABEL_MAL } from "@/config";

import {
  bootstrapMalStorage,
  closeMalDatabase,
} from "./controllers/storage/db";
import { buildMenuActions } from "./engine/menuActions";

export function createMalFriendRequestBot(
  _options: BotModuleCreateOptions,
): Bot {
  return {
    id: BOT_ID_MAL,
    label: BOT_LABEL_MAL,

    async start(): Promise<void> {
      bootstrapMalStorage();
    },

    async stop(): Promise<void> {
      closeMalDatabase();
    },

    menuActions() {
      return buildMenuActions();
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
