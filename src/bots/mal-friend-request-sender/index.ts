import type { AppConfig } from "@/utils/env/appConfigTypes";
import type {
  Bot,
  BotModule,
  BotModuleCreateOptions,
} from "@/adapters/host/contracts/bot";
import { BOT_ID } from "./config/constants";
import {
  bootstrapMalStorage,
  closeMalDatabase,
} from "./controllers/storage/db";
import { buildMenuActions } from "./engine/menuActions";

const BOT_LABEL = "MAL Friend Request Sender";

export function createMalFriendRequestBot(
  _options: BotModuleCreateOptions,
): Bot {
  return {
    id: BOT_ID,
    label: BOT_LABEL,

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
  id: BOT_ID,
  label: BOT_LABEL,

  /**
   * Enabled by default when `MAL_FRIEND_REQUEST_BOT_ENABLED` is unset.
   * Set to `false` in `.env` to hide this bot from the app menu.
   */
  isEnabled(appConfig: AppConfig): boolean {
    return appConfig.malFriendRequestBotEnabled ?? true;
  },

  create(options: BotModuleCreateOptions): Bot {
    return createMalFriendRequestBot(options);
  },
};
