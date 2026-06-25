import type {
  Bot,
  BotContext,
  BotMenuAction,
  PromptPort,
  SchedulableRunPayload,
} from "@/services/bridge";
import {
  buildChromeLaunchOptions,
  type ChromeSession,
  closeBrowser,
  launchChromeSession,
} from "@/tools/browser";

import { runWorkflow } from "./workflow/engine";
import type { Workflow, WorkflowContext } from "./workflow/types";

export interface BotActionDefinition<S> {
  readonly id: string;
  readonly label: string;
  readonly workflow: Workflow<S>;
}

export interface BotDefinition<S> {
  readonly id: string;
  readonly label: string;
  /** Fresh per-session scratch state, created when the user enters the bot. */
  readonly createState: () => S;
  /** Open a shared browser session on enter (closed on leave). */
  readonly usesBrowser?: boolean;
  /** App-lifetime storage hooks. */
  readonly onStart?: () => void | Promise<void>;
  readonly onStop?: () => void | Promise<void>;
  /** Runs when the user opens the bot, before the action menu (e.g. login). */
  readonly onEnter?: Workflow<S>;
  readonly actions: readonly BotActionDefinition<S>[];
  /**
   * Handle a scheduler-triggered payload owned by this bot (validate + run).
   * Returns `true` if handled. Surfaced as {@link Bot.runScheduledTask}.
   */
  readonly runScheduledTask?: (
    port: PromptPort,
    payload: SchedulableRunPayload,
  ) => Promise<boolean>;
}

/**
 * Turn a declarative {@link BotDefinition} into a {@link Bot}: storage lifecycle,
 * a browser session held across the bot's menu session, and each menu action
 * backed by a workflow. Common plumbing lives here, not in each bot.
 */
export function createBotService<S>(def: BotDefinition<S>): Bot {
  let state: S | null = null;
  let session: ChromeSession | null = null;

  const contextFor = (ctx: BotContext): WorkflowContext<S> => {
    if (state === null) {
      state = def.createState();
    }
    return {
      prompt: ctx.prompt,
      display: ctx.display,
      state,
      session,
      source: ctx.source,
      metadata: ctx.metadata,
    };
  };

  return {
    id: def.id,
    label: def.label,

    async start(): Promise<void> {
      await def.onStart?.();
    },

    async stop(): Promise<void> {
      await def.onStop?.();
    },

    async enter(ctx: BotContext): Promise<void> {
      state = def.createState();
      if (def.usesBrowser) {
        session = await launchChromeSession(buildChromeLaunchOptions());
      }
      if (def.onEnter) {
        await runWorkflow(def.onEnter, contextFor(ctx));
      }
    },

    async leave(): Promise<void> {
      state = null;
      session = null;
      if (def.usesBrowser) {
        await closeBrowser(`left ${def.label}`);
      }
    },

    menuActions(): BotMenuAction[] {
      return def.actions.map((action) => ({
        id: action.id,
        label: action.label,
        run: async (runCtx: BotContext) => {
          await runWorkflow(action.workflow, contextFor(runCtx));
        },
      }));
    },

    runScheduledTask: def.runScheduledTask,
  };
}
