import type { Page } from "puppeteer-core";
import { BrowserDelays } from "@/shared/tools/browser/constants.js";
import { type GenshinServerValue } from "@/bots/code-redeem-bot/config/constants.js";
import {
  evaluateClick,
  readElementText,
} from "@/shared/tools/browser.js";
import { logger, sleep } from "@/shared/utils.js";
import {
  genshinServerNthChild,
  getServerMenuSelector,
  genshinConfig,
} from "../config/config.js";

function serverLabelMatches(label: string, server: GenshinServerValue): boolean {
  const normalizedLabel = label.toLowerCase();
  const normalizedServer = server.toLowerCase();

  if (normalizedLabel.includes(normalizedServer)) {
    return true;
  }

  const firstToken = normalizedServer.split(/[,\s]+/)[0] ?? normalizedServer;
  return firstToken.length > 0 && normalizedLabel.includes(firstToken);
}

export async function selectServer(
  page: Page,
  server: GenshinServerValue,
): Promise<void> {
  const currentLabel = await readElementText({
    page,
    selector: genshinConfig.selectors.serverButton,
    timeout: BrowserDelays.LONG,
  });

  if (serverLabelMatches(currentLabel, server)) {
    logger.gray(`Server already selected: ${server}`);
    return;
  }

  const nthChild = genshinServerNthChild[server];
  const serverSelector = getServerMenuSelector(nthChild);

  await evaluateClick({
    page,
    selector: genshinConfig.selectors.serverButton,
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
