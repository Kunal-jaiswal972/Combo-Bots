import { isAborted, logger } from "@/utils";

import type { Step, Workflow, WorkflowContext } from "./types";

/** Run a list of steps in order, descending into the chosen branch. */
async function runSteps<S>(
  steps: readonly Step<S>[],
  ctx: WorkflowContext<S>,
): Promise<void> {
  for (const step of steps) {
    // Abort-aware: a shutdown request stops the workflow between steps.
    if (isAborted()) {
      return;
    }

    if (step.kind === "action") {
      await step.run(ctx);
      continue;
    }

    const matched = await step.when(ctx);
    await runSteps(matched ? step.then : step.otherwise, ctx);
  }
}

/** Execute a workflow against a context. */
export async function runWorkflow<S>(
  workflow: Workflow<S>,
  ctx: WorkflowContext<S>,
): Promise<void> {
  logger.gray(`Workflow: ${workflow.name}`);
  await runSteps(workflow.steps, ctx);
}
