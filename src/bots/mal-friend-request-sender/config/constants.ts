export const BOT_ID = "mal-friend-request-sender" as const;

export const MalConfig = {
  baseUrl: "https://myanimelist.net",
  wsFetchRetries: 20,
} as const;

export const MalSelectors = {
  friendProfileLinks: ".di-tc.va-t.pl8.data .title a",
  friendRequestButton: "#request",
  submitButton: "input[type='submit']",
  loginUsername: "#loginUserName",
  loginPassword: "#login-password",
  loginRemember: "input[name='cookie']",
  loginSubmit: "input[type='submit'].btn-form-submit",
  loginError: ".badresult",
} as const;

/** Pacing tuned for MAL rate limits (from standalone script). */
export const MalDelays = {
  betweenProfiles: 5_000,
  afterRequest: 25_000,
  pageSettle: 2_000,
  loginAutofillSettle: 2_000,
  typeMin: 100,
  typeMax: 1_000,
  beforeSubmitMin: 600,
  beforeSubmitMax: 1_800,
} as const;

export function friendsPageUrl(username: string): string {
  return `${MalConfig.baseUrl}/profile/${username}/friends`;
}

export function loginPageUrl(): string {
  return `${MalConfig.baseUrl}/login.php`;
}
