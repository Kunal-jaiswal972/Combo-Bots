import type { Browser, Frame, Page } from "puppeteer-core";

export type PageContext = Page | Frame;

export interface OpenPageOptions {
  readonly browser: Browser;
  readonly url: string;
}

export interface NavigateOptions {
  readonly page: Page;
  readonly url: string;
  readonly waitUntil?:
    | "domcontentloaded"
    | "load"
    | "networkidle0"
    | "networkidle2";
}

export interface WaitForNetworkIdleOptions {
  readonly page: Page;
  readonly timeout?: number;
  readonly reason?: string;
}

export interface EvaluateClickOptions {
  readonly page: Page;
  readonly selector: string;
  readonly timeout?: number;
  readonly reason?: string;
}

export interface ReadElementTextOptions {
  readonly page: Page;
  readonly selector: string;
  readonly timeout?: number;
}

export interface ClickElementOptions {
  readonly context: PageContext;
  readonly selector: string;
  readonly timeout?: number;
  readonly reason?: string;
}

export interface EnterTextOptions {
  readonly context: PageContext;
  readonly selector: string;
  readonly text: string;
  readonly reason?: string;
}

export interface ClearInputOptions {
  readonly context: PageContext;
  readonly selector: string;
}

export interface GetIframeContentFrameOptions {
  readonly page: Page;
  readonly iframeSelector: string;
  readonly reason?: string;
}
