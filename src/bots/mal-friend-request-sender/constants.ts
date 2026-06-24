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
  /** Header avatar link; its `title`/`href` carries the logged-in username. */
  headerProfileButton: "a.header-profile-button",
  /** Logout form (POST to logout.php) in the profile dropdown. */
  logoutForm: 'form[action*="logout.php"]',
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

export function homeUrl(): string {
  return `${MalConfig.baseUrl}/`;
}
