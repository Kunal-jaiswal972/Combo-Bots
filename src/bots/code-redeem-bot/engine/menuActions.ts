import type { SchedulerRunner } from "@/tools/scheduler";
import type {
  RedeemTask,
  RedeemTaskTemplate,
} from "@/bots/code-redeem-bot/types";
import type { BotContext, BotMenuAction } from "@/adapters/host/contracts/bot";
import { runNowMenu } from "./menu/runNow";
import { scheduleMenu } from "./menu/schedule";
import {
  cancelScheduledTask,
  listScheduledTasks,
} from "../controllers/scheduling/queries/scheduledTasks";
import { listRecentRunHistoryWithTasks } from "../controllers/scheduling/queries/runHistory";
import { showRunHistoryList } from "../controllers/io/runHistoryList";
import { showScheduledTaskList } from "../controllers/io/scheduledTaskList";
import { formatScheduledTaskChoiceLabel } from "../utils/scheduledTask";

export function buildMenuActions(
  scheduler: SchedulerRunner<RedeemTaskTemplate, RedeemTask>,
): BotMenuAction[] {
  return [
    {
      id: "run",
      label: "Run now — redeem immediately",
      run: async (ctx: BotContext) => {
        await runNowMenu({
          port: ctx.prompt,
          source: ctx.source,
          metadata: ctx.metadata,
        });
      },
    },
    {
      id: "schedule",
      label: "Schedule — create a recurring or one-shot task",
      run: async (ctx: BotContext) => {
        await scheduleMenu({
          port: ctx.prompt,
          scheduler,
          source: ctx.source,
          metadata: ctx.metadata,
        });
      },
    },
    {
      id: "list",
      label: "List scheduled tasks",
      run: async (ctx: BotContext) => {
        const tasks = await listScheduledTasks(scheduler);

        if (tasks.length === 0) {
          ctx.prompt.info("No scheduled tasks.");
          return;
        }

        showScheduledTaskList(ctx.prompt, ctx.display, tasks);
      },
    },
    {
      id: "cancel",
      label: "Cancel a scheduled task",
      run: async (ctx: BotContext) => {
        const tasks = await listScheduledTasks(scheduler);

        if (tasks.length === 0) {
          ctx.prompt.info("No scheduled tasks.");
          return;
        }

        const choices = tasks.map((task) => ({
          value: task.id,
          label: formatScheduledTaskChoiceLabel(task),
        }));
        const taskId = await ctx.prompt.choose("Cancel which task?", choices);
        await cancelScheduledTask(scheduler, taskId);
        ctx.prompt.success(`Cancelled scheduled task ${taskId}.`);
      },
    },
    {
      id: "history",
      label: "View recent run history",
      run: async (ctx: BotContext) => {
        const history = await listRecentRunHistoryWithTasks(scheduler, 10);

        showRunHistoryList(
          ctx.prompt,
          ctx.display,
          history.entries,
          history.tasksById,
        );
      },
    },
  ];
}
