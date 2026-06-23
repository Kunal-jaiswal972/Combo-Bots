import type { ChromeSession } from "@/tools/browser";

import { RedeemStatus } from "../../config/constants";
import type { CodeRedeemResult, GameRedeemOptions } from "../../types";
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
