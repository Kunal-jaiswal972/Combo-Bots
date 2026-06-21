import { codeRedeemBotModule } from "@/bots/code-redeem-bot.js";
import type { BotModule } from "@/shared/adapters/host/contracts/bot.js";

/**
 * Central bot registry. To add a bot:
 * 1. Implement `BotModule` under `bots/<name>/`
 * 2. Append it here
 */
export const botModules = [
  codeRedeemBotModule,
] as const satisfies readonly BotModule[];
