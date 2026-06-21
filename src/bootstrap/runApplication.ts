import { botModules } from "@/bots/registry";
import { getAppConfig } from "@/utils/env/appConfig";
import { logger } from "@/utils";
import type { Bot } from "@/adapters/host/contracts/bot";
import type { SchedulableRunPayload } from "@/adapters/host/contracts/scheduledRunNotifier";
import type { PromptPort } from "@/adapters/host/contracts/promptPort";
import { createTerminalPorts } from "@/adapters/host/core/terminalPorts";
import { createEnabledAdapters } from "@/adapters/host/registry/createEnabledAdapters";
import {
  bootstrapTaskSources,
  validateTaskSource,
} from "@/adapters/host/registry/taskSource";
import { registerShutdownHook } from "@/tools/browser";
import { redeemTaskSchema } from "@/bots/code-redeem-bot/types";
import { createScheduledRunHandler } from "@/bots/code-redeem-bot/controllers/scheduling/scheduledRunHandler";

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
