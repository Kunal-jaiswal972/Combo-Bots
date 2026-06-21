export { BrowserConfig, BrowserDelays } from "./constants.js";
export type {
  ChromePathSearchContext,
  ExpandChromeUserDataDirOptions,
  ResolveChromeExecutablePathOptions,
} from "./paths/chromePaths.js";
export {
  expandChromeUserDataDir,
  getChromeCandidates,
  resolveChromeExecutablePath,
} from "./paths/chromePaths.js";
export type {
  ChromeLaunchOptions,
  ChromeSession,
  ChromeVersionResponse,
} from "./types/session.js";
export type {
  ClearInputOptions,
  ClickElementOptions,
  EnterTextOptions,
  EvaluateClickOptions,
  GetIframeContentFrameOptions,
  NavigateOptions,
  OpenPageOptions,
  PageContext,
  ReadElementTextOptions,
  WaitForNetworkIdleOptions,
} from "./types/actions.js";
export { buildChromeLaunchOptions, launchChromeSession } from "./launch/launcher.js";
export {
  bindBrowser,
  closeBrowser,
  registerShutdownHandlers,
  registerShutdownHook,
} from "./lifecycle/shutdown.js";
export {
  clearInput,
  clickElement,
  enterText,
  evaluateClick,
  getIframeContentFrame,
  navigate,
  openPage,
  readElementText,
  waitForNetworkIdle,
} from "./actions/elements.js";
