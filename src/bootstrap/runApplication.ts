import { botModules } from "@/bots/registry.js";
import { getAppConfig } from "@/shared/utils/env/appConfig.js";
import { logger } from "@/shared/utils.js";
import type { Bot } from "@/shared/adapters/host/contracts/bot.js";
import type { SchedulableRunPayload } from "@/shared/adapters/host/contracts/scheduledRunNotifier.js";
import type { PromptPort } from "@/shared/adapters/host/contracts/promptPort.js";
import { createTerminalPorts } from "@/shared/adapters/host/core/terminalPorts.js";
import { createEnabledAdapters } from "@/shared/adapters/host/registry/createEnabledAdapters.js";
import {
  bootstrapTaskSources,
  validateTaskSource,
} from "@/shared/adapters/host/registry/taskSource.js";
import { registerShutdownHook } from "@/shared/tools/browser.js";
import { redeemTaskSchema } from "@/bots/code-redeem-bot/types.js";
import { createScheduledRunHandler } from "@/bots/code-redeem-bot/controllers/scheduling/scheduledRunHandler.js";

bootstrapTaskSources({
  triggerSourceIds: botModules.flatMap(
    (module) => module.taskTriggerSources ?? [],
  ),
});

async function runScheduledPayload(
  port: PromptPort,
  payload: SchedulableRunPayload,
): Promise<void> {
  const parsed = redeemTaskSchema.parse(payload);
  const task = { ...parsed, source: validateTaskSource(parsed.source) };
  const handler = createScheduledRunHandler(port);
  await handler(task);
}

export async function runApplication(): Promise<void> {
  const appConfig = getAppConfig();
  const terminal = createTerminalPorts();
  let scheduledRunNotifiers: ReturnType<
    typeof createEnabledAdapters
  >["scheduledRunNotifiers"] = [];

  const enabledBots: Bot[] = botModules
    .filter((module) => module.isEnabled(appConfig))
    .map((module) =>
      module.create({
        terminalPrompt: terminal.prompt,
        getScheduledRunNotifiers: () => scheduledRunNotifiers,
      }),
    );

  const enabled = createEnabledAdapters({
    terminal,
    appConfig,
    bots: enabledBots,
    onScheduledRun: runScheduledPayload,
  });

  scheduledRunNotifiers = enabled.scheduledRunNotifiers;

  for (const bot of enabledBots) {
    if (bot.start) {
      await bot.start();
    }
  }

  registerShutdownHook(async () => {
    for (const adapter of [...enabled.background].reverse()) {
      await adapter.stop();
    }

    if (enabled.foreground !== null) {
      await enabled.foreground.stop();
    }

    for (const bot of [...enabledBots].reverse()) {
      if (bot.stop) {
        await bot.stop();
      }
    }
  });

  const adapterLabels =
    enabled.labels.length > 0 ? enabled.labels.join(", ") : "none";

  const botLabels =
    enabledBots.length > 0
      ? enabledBots.map((bot) => bot.label).join(", ")
      : "none";

  logger.success("Auto Code Redeemer — enabled input adapters + bots");
  logger.gray(`Scheduler poll: ${appConfig.schedulerPollIntervalMs}ms`);
  logger.info(`Active adapters: ${adapterLabels}`);
  logger.info(`Enabled bots: ${botLabels}`);

  if (!appConfig.cliAdapterEnabled) {
    logger.gray("CLI menu: off (set CLI_ADAPTER_ENABLED=true to enable)");
  }

  if (!appConfig.telegramEnabled && appConfig.telegramBotToken) {
    logger.gray("Telegram: off (set TELEGRAM_ENABLED=true)");
  }

  await Promise.all(enabled.background.map((adapter) => adapter.start()));

  if (enabled.foreground !== null) {
    await enabled.foreground.start();
    return;
  }

  logger.info("Press Ctrl+C to stop.");
  await waitUntilShutdown();
}

function waitUntilShutdown(): Promise<void> {
  return new Promise((resolve) => {
    process.once("SIGINT", () => {
      resolve();
    });
    process.once("SIGTERM", () => {
      resolve();
    });
  });
}
