import type {
  Bot,
  PromptPort,
  SchedulableRunPayload,
} from "@/adapters/host/contracts";
import { createTerminalPorts } from "@/adapters/host/core/terminalPorts";
import { createEnabledAdapters } from "@/adapters/host/registry/createEnabledAdapters";
import {
  bootstrapTaskSources,
  validateTaskSource,
} from "@/adapters/host/registry/taskSource";
import { onShutdown, requestShutdown } from "@/bootstrap/shutdown";
import { createScheduledRunHandler } from "@/bots/code-redeem-bot/controllers/scheduling/scheduledRunHandler";
import { redeemTaskSchema } from "@/bots/code-redeem-bot/types";
import { botModules } from "@/bots/registry";
import { closeBrowser, setOnBrowserDisconnect } from "@/tools/browser";
import { getAppConfig, isAborted, logger } from "@/utils";

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

  // Closing the debug browser tears the whole program down.
  setOnBrowserDisconnect(() => {
    void requestShutdown("BROWSER_DISCONNECTED", 0);
  });

  // Its own hook so it runs immediately on shutdown (concurrently with the
  // slower adapter teardown) — closing the browser aborts any in-flight run.
  onShutdown(() => closeBrowser("shutdown"));

  onShutdown(async () => {
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
    // The foreground menu returning means the user chose "Exit" — tear the
    // whole program (background adapters, bots, browser) down from here.
    try {
      await enabled.foreground.start();
    } catch (error) {
      // A prompt cancelled by Ctrl+C while shutting down is expected, not fatal.
      if (!isAborted()) {
        throw error;
      }
    }
    await requestShutdown("CLI_EXIT", 0);
    return;
  }

  logger.info("Press Ctrl+C to stop.");
  // Stay alive until a signal triggers shutdown (owned by installShutdownHandlers).
  await new Promise<void>(() => {});
}
