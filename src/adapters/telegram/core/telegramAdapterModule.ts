import { ConfigError } from "@/utils";
import type { AdapterModule } from "@/adapters/host/registry/adapterModules";
import { createTelegramAdapter } from "./telegramAdapter";
import { createTelegramScheduledRunNotifier } from "@/adapters/telegram/lib/telegramScheduledRunNotifier";

export const telegramAdapterModule: AdapterModule = {
  id: "telegram",
  label: "Telegram bot",
  lifecycle: "background",

  isEnabled(appConfig): boolean {
    return appConfig.telegramEnabled;
  },

  create(options) {
    const token = options.appConfig.telegramBotToken;

    if (!token) {
      throw new ConfigError(
        "TELEGRAM_ENABLED is true but TELEGRAM_BOT_TOKEN is missing.",
      );
    }

    const bundle = createTelegramAdapter({
      botToken: token,
      bots: options.bots,
    });

    return {
      adapter: bundle.adapter,
      scheduledRunNotifier: createTelegramScheduledRunNotifier(bundle.bot, {
        onScheduledRun: async (port, payload) => {
          if (options.onScheduledRun) {
            await options.onScheduledRun(port, payload);
          }
        },
      }),
    };
  },
};
