// Prompt I/O contract (PromptPort) plus the "back" / "use default" navigation
// sentinels shared by every adapter. Split into separate files if this grows.

export interface PromptChoice<T extends string = string> {
  readonly value: T;
  readonly label: string;
}

export interface PromptOptions {
  /** When true, the user can go back to the previous step (adapter-specific UI). */
  readonly allowBack?: boolean;
  /**
   * Pre-filled value the user can accept without typing — Enter in the CLI,
   * a "Use default" button in Telegram. Applies to `question`.
   */
  readonly defaultValue?: string;
}

/** Interactive input/output surface for CLI, Telegram, and future adapters. */
export interface PromptPort {
  choose<T extends string>(
    message: string,
    choices: readonly PromptChoice<T>[],
    options?: PromptOptions,
  ): Promise<T>;
  question(message: string, options?: PromptOptions): Promise<string>;
  yesNo(message: string, defaultYes: boolean): Promise<boolean>;
  username(message?: string): Promise<string>;
  password(message?: string): Promise<string>;
  positiveInteger(message: string): Promise<number>;
  step(message: string): void;
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  gray(message: string): void;
  error(message: string, error?: Error): void;
}

/** Sentinel choice value used by CLI when Back is offered in a select list. */
export const PROMPT_BACK_CHOICE_VALUE = "__prompt_back__";

export const PROMPT_BACK_LABEL = "← Back";

/** Telegram inline-button callback data for Back. */
export const TELEGRAM_BACK_CALLBACK = "prompt:back";

/** Telegram inline-button callback data for "use the default value". */
export const TELEGRAM_DEFAULT_CALLBACK = "prompt:default";

/** CLI/Telegram text reply that means Back on free-form prompts. */
export const PROMPT_BACK_TEXT = "back";

export class PromptBackError extends Error {
  constructor() {
    super("User chose to go back.");
    this.name = "PromptBackError";
  }
}

export function isPromptBack(error: unknown): error is PromptBackError {
  return error instanceof PromptBackError;
}
