/** DOM selectors for the Genshin redeem page and Fandom wiki scrape target. */
export const genshinElements = {
  codeTableRows: ".mw-parser-output > table > tbody > tr",
  codeLink: "td a.external.text",
  codeText: "code",
  redeemInput: "input[type='text']#cdkey__code",
  redeemSubmit: "button[type='submit'].cdkey-form__submit",
  redeemModal: '[data-modal="cdkeyResult"]',
  redeemModalMessage: ".cdkey-result__message",
  redeemModalClose: ".cdkey-result__close",
  userButton: ".cdkey__user-btn",
  serverButton: ".cdkey-select__btn",
  serverMenu: "#cdkey__region > div.cdkey-select__menu",
  loginIframe: "#hyv-account-frame",
  emailInput: 'input.el-input__inner[type="text"]',
  passwordInput: 'input.el-input__inner[type="password"]',
  loginSubmit: 'button[type="submit"]',
} as const;
