import { RedeemStatus } from "@/bots/code-redeem-bot/config/constants";
import type { ChromeSession } from "@/tools/browser";
import type { CodeRedeemResult, GameRedeemOptions } from "@/bots/code-redeem-bot/types";
import { hsrStubCodes } from "./config";

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
