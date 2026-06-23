/** @see ../docs — bot overview, flow, storage, and layout */
import type { BotModule } from "@/adapters/host/contracts";
import { BOT_ID_MAL, BOT_LABEL_MAL } from "@/config";
import { type BotDefinition, createBotService } from "@/services/bot-builder";
import { isModuleEnabled } from "@/utils";

import {
  bootstrapMalStorage,
  closeMalDatabase,
} from "../controllers/storage/db";
import {
  createInitialState,
  malEnterWorkflow,
  type MalState,
  sendBulkWorkflow,
} from "./workflow";

const malBotDefinition: BotDefinition<MalState> = {
  id: BOT_ID_MAL,
  label: BOT_LABEL_MAL,
  usesBrowser: true,
  createState: createInitialState,
  onStart: () => bootstrapMalStorage(),
  onStop: () => closeMalDatabase(),
  // Confirm the MAL account before the action menu.
  onEnter: malEnterWorkflow,
  actions: [
    {
      id: "run",
      label: "Send bulk friend requests",
      workflow: sendBulkWorkflow,
    },
  ],
};

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

  create() {
    return createBotService(malBotDefinition);
  },
};
