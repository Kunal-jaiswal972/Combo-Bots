import type { HoyoGiftSelectors } from "../../shared/config";

/**
 * Genshin gift/redeem page DOM. Verified live against
 * `genshin.hoyoverse.com/en/gift`. HSR's markup differs — see `hoyoverse/hsr`.
 */
const giftPageElements = {
  accountName: ".cdkey__user > div",
  userButton: ".cdkey__user-btn",
  logoutButton: ".cdkey__user-btn",
  // Login iframe (Hoyoverse SSO).
  loginIframe: "#hyv-account-frame",
  emailInput: 'input.el-input__inner[type="text"]',
  passwordInput: 'input.el-input__inner[type="password"]',
  loginSubmit: 'button[type="submit"]',
  // Server selection.
  serverButton: ".cdkey-select__btn",
  serverMenu: "#cdkey__region > div.cdkey-select__menu",
  // Redeem form + result modal.
  redeemInput: "input[type='text']#cdkey__code",
  redeemSubmit: "button[type='submit'].cdkey-form__submit",
  redeemModal: '[data-modal="cdkeyResult"]',
  redeemModalMessage: ".cdkey-result__message",
  redeemModalClose: ".cdkey-result__close",
} as const satisfies HoyoGiftSelectors;

/** Genshin Fandom-wiki scrape selectors. */
const wikiElements = {
  codeTableRows: ".mw-parser-output > table > tbody > tr",
  codeLink: "td a.external.text",
  codeText: "code",
} as const;

export const genshinElements = {
  ...giftPageElements,
  ...wikiElements,
} as const;
