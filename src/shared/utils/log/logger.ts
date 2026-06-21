import chalk from "chalk";
import type { GetRandomDelayOptions } from "../timing/waitTypes.js";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandomDelay(options: GetRandomDelayOptions): number {
  return randomInt(options.min, options.max);
}

export function maskSecret(text: string): string {
  if (text.length === 0) {
    return "[empty]";
  }

  if (text.length <= 2) {
    return "*".repeat(text.length);
  }

  return `${text.substring(0, 2)}${"*".repeat(text.length - 2)}`;
}

export function formatAccountLabel(username: string): string {
  return maskSecret(username.trim());
}

export const logger = {
  info(message: string): void {
    console.log(chalk.cyan(message));
  },

  success(message: string): void {
    console.log(chalk.green(message));
  },

  warn(message: string): void {
    console.log(chalk.yellow(message));
  },

  error(message: string, error?: Error): void {
    if (error) {
      console.error(chalk.red(message), error.message);
      return;
    }

    console.error(chalk.red(message));
  },

  step(message: string): void {
    console.log(chalk.blueBright(message));
  },

  gray(message: string): void {
    console.log(chalk.gray(message));
  },

  wait(message: string): void {
    console.log(chalk.magenta(message));
  },
};
