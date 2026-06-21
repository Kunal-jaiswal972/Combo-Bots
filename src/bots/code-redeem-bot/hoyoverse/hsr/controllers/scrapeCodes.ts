import type { ScrapedCodeRow } from "@/bots/code-redeem-bot/types";
import { hsrStubCodes } from "../config";

export async function scrapeHsrCodes(): Promise<ScrapedCodeRow[]> {
  return hsrStubCodes.map((code) => ({
    codes: [code],
    expired: false,
  }));
}
