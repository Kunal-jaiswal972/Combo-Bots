import { ScrapeError } from "@/shared/utils/errors.js";
import {
  attrIn,
  fetchJson,
  findNestedTexts,
  loadHtml,
  selectElements,
  type CheerioAPI,
  type Element,
} from "@/shared/tools/scraper.js";
import type { ScrapedCodeRow } from "@/bots/code-redeem-bot/types.js";
import { genshinConfig } from "../config/config.js";

interface FandomWikiError {
  code?: string;
  info?: string;
}

interface FandomParseResponse {
  parse?: {
    text?: {
      "*": string;
    };
  };
  error?: FandomWikiError;
}

const WIKI_USER_AGENT =
  "GenshinAutoCodeRedeem/2.0 (https://github.com; wiki scraper)";

function extractCodesFromRow($: CheerioAPI, row: Element): string[] {
  return findNestedTexts({
    $,
    context: row,
    outerSelector: genshinConfig.selectors.codeLink,
    innerSelector: genshinConfig.selectors.codeText,
  });
}

function isRowExpired($: CheerioAPI, row: Element): boolean {
  const style = attrIn({
    $,
    context: row,
    selector: "td:last-child",
    attribute: "style",
  });

  return !style.includes(genshinConfig.wikiActiveRowStyleMarker);
}

function parseCodeRows(html: string): ScrapedCodeRow[] {
  const $ = loadHtml(html);
  const rows = selectElements($, genshinConfig.selectors.codeTableRows);

  return rows
    .map((row) => {
      const codes = extractCodesFromRow($, row);

      return {
        codes,
        expired: isRowExpired($, row),
      };
    })
    .filter((entry) => entry.codes.length > 0);
}

async function fetchWikiHtml(): Promise<string> {
  const response = await fetchJson<FandomParseResponse>({
    url: genshinConfig.wikiApiUrl,
    params: {
      action: "parse",
      page: genshinConfig.wikiPageTitle,
      format: "json",
      prop: "text",
    },
    headers: {
      "User-Agent": WIKI_USER_AGENT,
    },
  });

  const apiError = response?.error;
  if (apiError !== undefined) {
    const detail = apiError.info ?? apiError.code ?? "unknown API error";
    throw new ScrapeError(`Fandom wiki API error: ${detail}`);
  }

  const html = response?.parse?.text?.["*"] ?? "";
  if (html.length === 0) {
    throw new ScrapeError(
      "Fandom wiki API returned empty page content — the page title may have changed.",
    );
  }

  return html;
}

export async function scrapeGenshinCodes(): Promise<ScrapedCodeRow[]> {
  try {
    const html = await fetchWikiHtml();
    const rows = parseCodeRows(html);

    if (rows.length === 0) {
      throw new ScrapeError(
        "Genshin scrape returned no codes — the wiki page structure may have changed.",
      );
    }

    return rows;
  } catch (error) {
    if (error instanceof ScrapeError) {
      throw error;
    }

    const cause =
      error instanceof Error ? error : new Error(String(error));
    throw new ScrapeError(
      "Failed to fetch Genshin promotional codes from Fandom wiki.",
      cause,
    );
  }
}
