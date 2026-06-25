import type { Page } from "puppeteer-core";

import { BrowserDelays, evaluateClick, readElementText } from "@/tools/browser";
import { logger, sleep } from "@/utils";

import { type HoyoServerValue } from "../../constants";
import {
  getServerMenuItemSelector,
  type HoyoGameConfig,
  hoyoServerNthChild,
} from "./config";

function serverLabelMatches(label: string, server: HoyoServerValue): boolean {
  const normalizedLabel = label.toLowerCase();
  const normalizedServer = server.toLowerCase();

  if (normalizedLabel.includes(normalizedServer)) {
    return true;
  }

  const firstToken = normalizedServer.split(/[,\s]+/)[0] ?? normalizedServer;
  return firstToken.length > 0 && normalizedLabel.includes(firstToken);
}

/** Select a server region in the shared Hoyoverse redeem dropdown. */
export async function selectHoyoServer(
  page: Page,
  config: HoyoGameConfig,
  server: HoyoServerValue,
): Promise<void> {
  const currentLabel = await readElementText({
    page,
    selector: config.selectors.serverButton,
    timeout: BrowserDelays.LONG,
  });

  if (serverLabelMatches(currentLabel, server)) {
    logger.gray(`Server already selected: ${server}`);
    return;
  }

  const serverSelector = getServerMenuItemSelector(
    config.selectors.serverMenu,
    hoyoServerNthChild[server],
  );

  await evaluateClick({
    page,
    selector: config.selectors.serverButton,
    timeout: BrowserDelays.LONG,
    reason: "open server dropdown",
  });
  await sleep({ ms: BrowserDelays.SHORT, reason: "server dropdown to open" });
  await evaluateClick({
    page,
    selector: serverSelector,
    timeout: BrowserDelays.LONG,
    reason: `select server: ${server}`,
  });
  logger.gray(`Server selected: ${server}`);
  await sleep({ ms: BrowserDelays.SHORT, reason: "apply server selection" });
}
