import { isAborted } from "@/utils";

import type {
  Predicate,
  Step,
  StepHandler,
  Workflow,
  WorkflowContext,
} from "./types";

type BranchFn<S> = (branch: WorkflowBuilder<S>) => void;

/**
 * Fluent, typed workflow definition. Steps run in the order declared; branches
 * and loops keep their logic in real (typed) functions while the shape stays
 * declarative.
 */
export class WorkflowBuilder<S> {
  private readonly steps: Step<S>[] = [];

  constructor(private readonly name: string) {}

  /** A unit of work that may read/mutate `ctx.state`. */
  step(name: string, run: StepHandler<S>): this {
    this.steps.push({ kind: "action", name, run });
    return this;
  }

  /** Semantic alias for a step that asks the user something via `ctx.prompt`. */
  prompt(name: string, run: StepHandler<S>): this {
    return this.step(name, run);
  }

  /** Push a message to the active adapter(s). */
  notify(name: string, message: (ctx: { state: S }) => string): this {
    return this.step(name, (ctx) => {
      ctx.prompt.info(message({ state: ctx.state }));
    });
  }

  /** Run `then` steps when `when` holds, else `otherwise` steps. */
  branch(
    name: string,
    when: Predicate<S>,
    then: BranchFn<S>,
    otherwise?: BranchFn<S>,
  ): this {
    this.steps.push({
      kind: "branch",
      name,
      when,
      then: collect(name, then),
      otherwise: otherwise ? collect(name, otherwise) : [],
    });
    return this;
  }

  /** Iterate a derived list, abort-aware, running `body` per item. */
  forEach<I>(
    name: string,
    select: (state: S) => readonly I[],
    body: (
      item: I,
      index: number,
      ctx: WorkflowContext<S>,
    ) => Promise<void> | void,
  ): this {
    return this.step(name, async (ctx) => {
      const items = select(ctx.state);
      for (let index = 0; index < items.length; index += 1) {
        if (isAborted()) {
          return;
        }
        const item = items[index];
        if (item === undefined) {
          continue;
        }
        await body(item, index, ctx);
      }
    });
  }

  build(): Workflow<S> {
    return { name: this.name, steps: this.steps };
  }
}

function collect<S>(name: string, fn: BranchFn<S>): Step<S>[] {
  const branch = new WorkflowBuilder<S>(name);
  fn(branch);
  return branch.build().steps as Step<S>[];
}

export function workflow<S>(name: string): WorkflowBuilder<S> {
  return new WorkflowBuilder<S>(name);
}
