import { codeRedeemBotModule } from "@/bots/code-redeem-bot";
import type { BotModule } from "@/adapters/host/contracts/bot";

/**
 * Central bot registry. To add a bot:
 * 1. Implement `BotModule` under `bots/<name>/`
 * 2. Append it here
 */
export const botModules = [
  codeRedeemBotModule,
] as const satisfies readonly BotModule[];
