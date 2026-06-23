import { isAborted } from "@/utils";

import type {
  Bot,
  BotContext,
  DisplayPresenter,
  PromptPort,
} from "../contracts";

export interface RunBotRouterOptions {
  readonly port: PromptPort;
  readonly display: DisplayPresenter;
  readonly bots: readonly Bot[];
  readonly source: string;
  readonly title?: string;
  readonly metadata?: Record<string, string>;
}

async function pickBot(
  port: PromptPort,
  bots: readonly Bot[],
): Promise<Bot | "exit"> {
  const choices = [
    ...bots.map((bot) => ({ value: bot.id, label: bot.label })),
    { value: "exit" as const, label: "Exit" },
  ];

  const picked = await port.choose("Which bot?", choices);
  return picked === "exit"
    ? "exit"
    : (bots.find((bot) => bot.id === picked) ?? "exit");
}

async function runBotMenuLoop(options: {
  readonly port: PromptPort;
  readonly bot: Bot;
  readonly ctx: BotContext;
}): Promise<void> {
  try {
    if (options.bot.enter) {
      await options.bot.enter(options.ctx);
    }

    await runBotActionMenu(options);
  } catch (error) {
    // During shutdown let the error propagate so the app can exit.
    if (isAborted()) {
      throw error;
    }

    // Otherwise a bot failure (e.g. the user closed the browser) returns to the
    // bot picker instead of crashing the app.
    const message = error instanceof Error ? error.message : String(error);
    options.port.warn(
      `${options.bot.label} stopped (${message}). Returning to the bot picker.`,
    );
  } finally {
    if (options.bot.leave) {
      await options.bot.leave();
    }
  }
}

async function runBotActionMenu(options: {
  readonly port: PromptPort;
  readonly bot: Bot;
  readonly ctx: BotContext;
}): Promise<void> {
  const actions = options.bot.menuActions(options.ctx);

  while (true) {
    if (isAborted()) {
      return;
    }

    const choices = [
      ...actions.map((action) => ({ value: action.id, label: action.label })),
      { value: "back" as const, label: "Back to bot picker" },
    ];

    const actionId = await options.port.choose(
      `${options.bot.label} — what would you like to do?`,
      choices,
    );

    if (actionId === "back") {
      return;
    }

    const action = actions.find((candidate) => candidate.id === actionId);

    if (action) {
      await action.run(options.ctx);
    }

    // A run may have been interrupted by shutdown — don't re-render the menu.
    if (isAborted()) {
      return;
    }
  }
}

export async function runBotRouter(
  options: RunBotRouterOptions,
): Promise<void> {
  const ctx: BotContext = {
    prompt: options.port,
    display: options.display,
    source: options.source,
    metadata: options.metadata,
  };

  if (options.bots.length === 0) {
    options.port.warn("No bots are enabled.");
    return;
  }

  options.port.step(options.title ?? "Auto Code Redeemer");

  while (true) {
    if (isAborted()) {
      return;
    }

    const picked = await pickBot(options.port, options.bots);

    if (picked === "exit") {
      options.port.info("Goodbye.");
      return;
    }

    await runBotMenuLoop({ port: options.port, bot: picked, ctx });
  }
}
