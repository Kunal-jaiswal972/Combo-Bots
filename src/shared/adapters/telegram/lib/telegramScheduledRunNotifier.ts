import type { Bot } from "grammy";
import type {
  SchedulableRunPayload,
  ScheduledRunNotifier,
} from "@/shared/adapters/host/contracts/scheduledRunNotifier.js";
import type { PromptPort } from "@/shared/adapters/host/contracts/promptPort.js";
import { TelegramPromptPort } from "@/shared/adapters/telegram/core/telegramPromptPort.js";
import { getTelegramChatSession } from "./telegramPromptSession.js";

function resolveTelegramChatId(payload: SchedulableRunPayload): number | null {
  const chatIdRaw = payload.metadata?.telegramChatId;
  const chatId =
    chatIdRaw !== undefined ? Number.parseInt(chatIdRaw, 10) : Number.NaN;

  return Number.isNaN(chatId) ? null : chatId;
}

export interface TelegramScheduledRunNotifierOptions {
  readonly onScheduledRun: (
    port: PromptPort,
    payload: SchedulableRunPayload,
  ) => Promise<void>;
}

export function createTelegramScheduledRunNotifier(
  bot: Bot,
  options: TelegramScheduledRunNotifierOptions,
): ScheduledRunNotifier {
  return {
    canNotify(payload: SchedulableRunPayload): boolean {
      return resolveTelegramChatId(payload) !== null;
    },

    async notify(payload: SchedulableRunPayload): Promise<void> {
      const chatId = resolveTelegramChatId(payload);

      if (chatId === null) {
        return;
      }

      const session = getTelegramChatSession(chatId);
      const port = new TelegramPromptPort(bot.api, chatId, session);
      await options.onScheduledRun(port, payload);
    },
  };
}
