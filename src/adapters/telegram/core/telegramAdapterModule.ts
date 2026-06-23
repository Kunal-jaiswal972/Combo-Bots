import type { AdapterModule } from "@/adapters/host/registry/adapterModules";
import { ConfigError, getAppConfig, isModuleEnabled } from "@/utils";

import { createTelegramScheduledRunNotifier } from "../lib/telegramScheduledRunNotifier";
import { createTelegramAdapter } from "./telegramAdapter";

const TELEGRAM_ADAPTER_ID = "telegram";

export const telegramAdapterModule: AdapterModule = {
  id: TELEGRAM_ADAPTER_ID,
  label: "Telegram bot",
  lifecycle: "background",

  /**
   * Override with `TELEGRAM_ENABLED`. When unset, defaults to enabled only if
   * a `TELEGRAM_BOT_TOKEN` is configured.
   */
  isEnabled(): boolean {
    return isModuleEnabled(
      TELEGRAM_ADAPTER_ID,
      getAppConfig().telegramBotToken !== null,
    );
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
