import { createRedeemTask } from "@/bots/code-redeem-bot/engine/createRedeemTask.js";
import type { TaskSource } from "@/bots/code-redeem-bot/types.js";
import type { ScheduleSpec } from "@/shared/tools/scheduler/scheduleSpec.js";
import type { RedeemTaskTemplate } from "@/bots/code-redeem-bot/types.js";
import type { TaskScheduler } from "@/shared/tools/scheduler/scheduler.js";
import { formatScheduleInstant } from "@/shared/utils.js";
import type { GameIdValue } from "@/bots/code-redeem-bot/config/constants.js";
import { isPromptBack } from "@/shared/adapters/host/contracts/promptBack.js";
import type { PromptPort } from "@/shared/adapters/host/contracts/promptPort.js";
import { promptCredentials } from "@/bots/code-redeem-bot/controllers/io/prompts/credentials.js";
import { promptGameSelection } from "@/bots/code-redeem-bot/controllers/io/prompts/gameSelection.js";
import { promptScheduleSpec } from "@/shared/adapters/host/core/prompts/promptSchedule.js";

export interface ScheduleMenuOptions {
  port: PromptPort;
  scheduler: TaskScheduler<RedeemTaskTemplate>;
  source: TaskSource;
  metadata?: Record<string, string>;
}

/** Menu path: prompt for schedule + game/credentials, then register a scheduled task. */
export async function scheduleMenu(
  options: ScheduleMenuOptions,
): Promise<void> {
  const { port, scheduler, source, metadata } = options;

  port.step("Schedule — configure a recurring or one-shot task.");

  while (true) {
    let schedule: ScheduleSpec;

    try {
      schedule = await promptScheduleSpec(port);
    } catch (error) {
      if (isPromptBack(error)) {
        port.gray("Schedule setup cancelled.");
        return;
      }

      throw error;
    }

    let gameId: GameIdValue;

    try {
      gameId = await promptGameSelection(port, { allowBack: true });
    } catch (error) {
      if (isPromptBack(error)) {
        continue;
      }

      throw error;
    }

    const credentials = await promptCredentials(port, gameId);

    const redeemTask = createRedeemTask({
      gameId,
      credentials,
      scrapePolicy: { type: "ifNotScrapedToday" },
      source,
      metadata,
    });

    const scheduled = await scheduler.register({
      payload: {
        gameId: redeemTask.gameId,
        credentials: redeemTask.credentials,
        scrapePolicy: redeemTask.scrapePolicy,
        metadata: redeemTask.metadata,
      },
      schedule,
    });

    port.success(`Scheduled task created: ${scheduled.id}`);
    port.gray(`Next run: ${formatScheduleInstant(scheduled.nextRunAt)}`);
    port.gray("Keep this process running — scheduled tasks fire while dev or start is active.");
    return;
  }
}
