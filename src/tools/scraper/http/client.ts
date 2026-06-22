import axios from "axios";
import type { CheerioAPI } from "cheerio";
import { loadHtml } from "../dom/query";
import { HttpError, ScrapeError } from "@/utils";

export interface FetchHtmlOptions {
  readonly url: string;
  readonly timeoutMs?: number;
  readonly headers?: Readonly<Record<string, string>>;
  readonly params?: Readonly<Record<string, string>>;
}

export async function fetchHtml(options: FetchHtmlOptions): Promise<CheerioAPI> {
  try {
    const response = await axios.get<string>(options.url, {
      params: options.params,
      timeout: options.timeoutMs ?? 30_000,
      headers: options.headers,
      responseType: "text",
      validateStatus: (status) => status >= 200 && status < 300,
    });

    const body = response.data ?? "";

    if (body.length === 0) {
      throw new ScrapeError(`Empty response body from ${options.url}`);
    }

    return loadHtml(body);
  } catch (error) {
    if (error instanceof ScrapeError) {
      throw error;
    }

    const cause = error instanceof Error ? error : new Error(String(error));
    throw new HttpError(`HTTP request failed for ${options.url}`, cause);
  }
}

export interface FetchJsonOptions {
  readonly url: string;
  readonly timeoutMs?: number;
  readonly headers?: Readonly<Record<string, string>>;
  readonly params?: Readonly<Record<string, string>>;
}

export async function fetchJson<T>(options: FetchJsonOptions): Promise<T> {
  try {
    const response = await axios.get<T>(options.url, {
      params: options.params,
      timeout: options.timeoutMs ?? 30_000,
      headers: options.headers,
      responseType: "json",
      validateStatus: (status) => status >= 200 && status < 300,
    });

    return response.data;
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    throw new HttpError(`HTTP JSON request failed for ${options.url}`, cause);
  }
}
