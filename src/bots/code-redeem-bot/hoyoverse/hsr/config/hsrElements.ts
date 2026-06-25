import type { HoyoGiftSelectors } from "../../shared/config";

/**
 * Honkai: Star Rail gift/redeem page DOM. Verified live against
 * `hsr.hoyoverse.com/gift`. HSR ships a different gift component than Genshin
 * (`mihoyo-account-role` / `web-cdkey-*` classes), so it needs its own set.
 *
 * Auth selectors are exercised by the shared enter/login flow. The redeem-form
 * and result-modal selectors are placeholders only — HSR redemption is still a
 * stub (see `redeemer.ts`) and never drives the browser; revisit them when HSR
 * redemption is implemented.
 */
const giftPageElements = {
  // Account header / auth (logged-in nickname is masked by Hoyoverse, e.g. C****72).
  accountName: ".mihoyo-account-role__nickname",
  userButton: ".web-cdkey-user__btn",
  // HSR hides the logout link behind a user-menu panel — click the toggle first.
  accountMenuToggle: ".web-cdkey-user__btn",
  logoutButton: ".mihoyo-account-role__logout",
  // Login iframe (shared Hoyoverse SSO).
  loginIframe: "#hyv-account-frame",
  emailInput: 'input.el-input__inner[type="text"]',
  passwordInput: 'input.el-input__inner[type="password"]',
  loginSubmit: 'button[type="submit"]',
  // Server selection.
  serverButton: "#web_cdkey_region",
  serverMenu: "#web_cdkey_region",
  // Redeem form + result modal (placeholders — HSR redemption is stubbed).
  redeemInput: "#web_cdkey_character",
  redeemSubmit: "button[type='submit'].web-cdkey-form__submit",
  redeemModal: ".web-cdkey-result",
  redeemModalMessage: ".web-cdkey-result__message",
  redeemModalClose: ".web-cdkey-result__close",
} as const satisfies HoyoGiftSelectors;

export const hsrElements = { ...giftPageElements } as const;
