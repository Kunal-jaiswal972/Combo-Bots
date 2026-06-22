import type { ScrapedCodeRow } from "../../../types";
import { hsrStubCodes } from "../config";

export async function scrapeHsrCodes(): Promise<ScrapedCodeRow[]> {
  return hsrStubCodes.map((code) => ({
    codes: [code],
    expired: false,
  }));
}
