import type { ScrapedCodeRow } from "@/bots/code-redeem-bot/types.js";
import { hsrStubCodes } from "../config.js";

export async function scrapeHsrCodes(): Promise<ScrapedCodeRow[]> {
  return hsrStubCodes.map((code) => ({
    codes: [code],
    expired: false,
  }));
}
