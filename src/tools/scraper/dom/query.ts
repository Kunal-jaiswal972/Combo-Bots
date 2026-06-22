import type { CheerioAPI } from "cheerio";
import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";

function isElement(node: AnyNode): node is Element {
  return node.type === "tag";
}

export function loadHtml(html: string): CheerioAPI {
  return cheerio.load(html);
}

export function selectText($: CheerioAPI, selector: string): string {
  return $(selector).first().text().trim();
}

export function selectAll($: CheerioAPI, selector: string) {
  return $(selector);
}

export function selectElements($: CheerioAPI, selector: string): Element[] {
  return $(selector).toArray().filter(isElement);
}

export function attr(
  $: CheerioAPI,
  selector: string,
  attribute: string,
): string {
  return $(selector).first().attr(attribute) ?? "";
}

export interface FindNestedTextsOptions {
  readonly $: CheerioAPI;
  readonly context: Element;
  readonly outerSelector: string;
  readonly innerSelector: string;
}

/** Collects trimmed text from `innerSelector` within each `outerSelector` match under `context`. */
export function findNestedTexts(options: FindNestedTextsOptions): string[] {
  const texts: string[] = [];
  const { $, context, outerSelector, innerSelector } = options;

  $(context)
    .find(outerSelector)
    .each((_, outer) => {
      const text = $(outer).find(innerSelector).text().trim();
      if (text.length > 0) {
        texts.push(text);
      }
    });

  return texts;
}

export interface AttrInOptions {
  readonly $: CheerioAPI;
  readonly context: Element;
  readonly selector: string;
  readonly attribute: string;
}

export function attrIn(options: AttrInOptions): string {
  const { $, context, selector, attribute } = options;
  return $(context).find(selector).attr(attribute) ?? "";
}
