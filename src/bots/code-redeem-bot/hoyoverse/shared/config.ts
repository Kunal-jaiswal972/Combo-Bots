import { HoyoServer, type HoyoServerValue } from "../../constants";

/**
 * Shape of the DOM selectors a Hoyoverse gift/redeem page needs. Each game
 * provides its OWN values (Genshin and HSR markup differ) — only this shape and
 * the helper logic below are shared. See each game's `config/genshin-elements.ts` / `config/hsr-elements.ts`.
 */
export interface HoyoGiftSelectors {
  /**
   * Element whose **direct text nodes** hold the masked account name
   * (e.g. `C****72`). Only text nodes are read — child-element text is ignored —
   * so this can point to a container that also holds a "Log Out" span.
   */
  readonly accountName: string;
  /** Button whose text equals `logOutLabel` when logged in (`userButton` role). */
  readonly userButton: string;
  /**
   * Optional: click this first to reveal the logout button (e.g. a user-menu
   * toggle on pages that hide the logout link behind a panel). Omit on pages
   * where `logoutButton` is always visible and acts directly.
   */
  readonly accountMenuToggle?: string;
  /** The element to click that triggers logout (always visible, or revealed by `accountMenuToggle`). */
  readonly logoutButton: string;
  // Login iframe (Hoyoverse SSO).
  readonly loginIframe: string;
  readonly emailInput: string;
  readonly passwordInput: string;
  readonly loginSubmit: string;
  // Server selection.
  readonly serverButton: string;
  readonly serverMenu: string;
  // Redeem form + result modal.
  readonly redeemInput: string;
  readonly redeemSubmit: string;
  readonly redeemModal: string;
  readonly redeemModalMessage: string;
  readonly redeemModalClose: string;
}

/**
 * Runtime config consumed by the shared Hoyoverse login/account/server helpers.
 * Each game module provides one (genshin/hsr configs satisfy this, plus their
 * own wiki-scrape fields).
 */
export interface HoyoGameConfig {
  readonly redeemPageUrl: string;
  readonly logOutLabel: string;
  readonly maxLoginAttempts: number;
  readonly selectors: HoyoGiftSelectors;
}

/** The redeem dropdown lists servers in this fixed order across all Hoyo games. */
export const hoyoServerNthChild: Record<HoyoServerValue, number> = {
  [HoyoServer.AMERICA]: 1,
  [HoyoServer.EUROPE]: 2,
  [HoyoServer.ASIA]: 3,
  [HoyoServer.TW_HK_MO]: 4,
};

export function getServerMenuItemSelector(
  serverMenuSelector: string,
  nthChild: number,
): string {
  return `${serverMenuSelector} > div:nth-child(${nthChild})`;
}

const hoyoServerValues = Object.values(HoyoServer);

export function asHoyoServer(server: string): HoyoServerValue {
  if (!hoyoServerValues.includes(server as HoyoServerValue)) {
    throw new Error(`Invalid Hoyoverse server: ${server}`);
  }
  return server as HoyoServerValue;
}
