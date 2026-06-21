import { z } from "zod";
import {
  type CodeStatusValue,
  type RedeemStatusValue,
} from "../config/constants";

export const scrapedCodeRowSchema = z.object({
  codes: z.array(z.string().min(1)),
  expired: z.boolean(),
});

/** Raw row returned by a game scraper before normalization. */
export type ScrapedCodeRow = z.infer<typeof scrapedCodeRowSchema>;

export interface CodeStoreEntry {
  code: string;
  wikiStatus: CodeStatusValue;
  redeemStatus: RedeemStatusValue;
  message?: string;
  scrapedAt: string;
  attemptedAt?: string;
  source?: string;
}

export interface CodeStoreMergeResult {
  newCodes: string[];
  activeCodes: number;
  expiredCodes: number;
}

export interface NormalizedScrapedCode {
  code: string;
  status: CodeStatusValue;
}
