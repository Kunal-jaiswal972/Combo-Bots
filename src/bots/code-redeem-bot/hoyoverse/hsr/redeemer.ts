import { RedeemStatus } from "@/bots/code-redeem-bot/config/constants.js";
import type { ChromeSession } from "@/shared/tools/browser.js";
import type { CodeRedeemResult, GameRedeemOptions } from "@/bots/code-redeem-bot/types.js";
import { hsrStubCodes } from "./config.js";

export async function redeemHsrCodes(
  _session: ChromeSession,
  options: GameRedeemOptions,
): Promise<CodeRedeemResult[]> {
  const stubResults: CodeRedeemResult[] = hsrStubCodes.map((code) => ({
    code,
    status: RedeemStatus.PENDING,
    message: "HSR redeemer not implemented — stub response.",
  }));

  if (options.codes.length === 0) {
    return [];
  }

  return stubResults.filter((result) => options.codes.includes(result.code));
}
