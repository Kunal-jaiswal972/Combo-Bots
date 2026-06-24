import { promptRecurrenceSpec } from "@/services/adapter-builder";
import { isPromptBack, type PromptPort } from "@/services/bridge";
import type { RecurrenceSpec, TaskScheduler } from "@/tools/scheduler";
import { formatSchedulerInstant } from "@/utils";

import type { GameIdValue } from "../../config/constants";
import { promptCredentials } from "../../controllers/io/prompts/credentials";
import { promptGameSelection } from "../../controllers/io/prompts/gameSelection";
import type { RedeemTaskTemplate, TaskSource } from "../../types";
import { createRedeemTask } from "../createRedeemTask";

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
    let schedule: RecurrenceSpec;

    try {
      schedule = await promptRecurrenceSpec(port);
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
    port.gray(`Next run: ${formatSchedulerInstant(scheduled.nextRunAt)}`);
    port.gray(
      "Keep this process running — scheduled tasks fire while dev or start is active.",
    );
    return;
  }
}
