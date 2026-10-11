/**
 * `api.helper`: act as the reader in their own signed-in browser, through the
 * prifly Helper extension (Chrome or Edge) the reader paired with prifly.
 *
 * The manifest's `helper: { sites, why }` lists the URL match patterns
 * ("https://www.linkedin.com/*") the extension may reach; every call refuses a
 * URL outside them, and an extension with no `helper` in its manifest gets
 * calls that reject. Commands for one site run one at a time, spaced by the
 * pace set with `pace`.
 *
 * One lane, in order: a `run` or `screenshot` on a tab `tab` returned goes only
 * to the browser that tab is in, and while that browser is away it holds the
 * commands behind it in its lane — even ones another browser could take — for
 * up to five minutes, until it is cancelled (`tab` when the browser
 * disconnected, `offline` when it never came back). Keep tab work and plain
 * fetches on different `site` keys where that wait matters. A lane's key is
 * shared with every extension that uses it: its pace is whichever extension set
 * it last.
 *
 * Every call that goes to the browser settles one of three ways:
 *  - it resolves with the value;
 *  - it resolves `{ state: "unknown" }`: the command was sent and the browser's
 *    answer was lost (the socket dropped, or it went silent), so it may or may
 *    not have run. A `"safe"` command is sent again before this is ever
 *    returned; any other is not, since a click may already have happened.
 *    `lookup(commandId)` tells whether the answer arrived later;
 *  - it rejects with a `HelperError`, whose `kind` is one of the extension's
 *    (`timeout`, `network`, `no-user-scripts`, `tab`, `script`, `refused`,
 *    `interrupted`, `other`) or the host's (`not-paired`, `offline`,
 *    `undeclared`, `stopped`, `bad-request`).
 *
 * Added to `ExtensionApi`. Absent on an older prifly; `api.features` lists "helper".
 */

export type HelperState = "not-installed" | "needs-pairing" | "offline" | "connected";

export type ExtensionHelperStatus = {
  state: HelperState;
  /** Whether a connected browser can run user scripts (`run` needs it). */
  userScripts: boolean;
  /** The newest connected paired browser, "Chrome 154"; "" when none is. */
  browser: string;
};

/** Options every call takes. */
export type HelperCallOptions = {
  /**
   * The lane the command waits in: one command per lane runs at a time.
   * Left out, the URL's hostname. Name a shared key so, say, Messenger and
   * Facebook share a pace.
   */
  site?: string;
  /** What may happen when the answer is lost; see the defaults on each call. */
  retry?: "safe" | "never";
  /** How long the browser may take, in ms. */
  timeoutMs?: number;
};

export type HelperFetchRequest = {
  url: string;
  /** Default "GET". */
  method?: string;
  headers?: Record<string, string>;
  /** A text body, or `bodyBase64` for bytes. */
  body?: string | undefined;
  bodyBase64?: string | undefined;
  /** Default "include": the browser's cookies for the site. */
  credentials?: "include" | "omit" | "same-origin";
  /**
   * Default "follow". A redirect to a site outside the manifest's is
   * refused: the answer is dropped and the call rejects `refused`. The
   * browser has already made that request, cookies and all, by then; use
   * "manual" or "error" where a redirect off the site must not be followed.
   */
  redirect?: "follow" | "manual" | "error";
  /** Sent as the request's Origin and Referer headers. */
  origin?: string;
  referer?: string;
};

export type HelperFetchResponse = {
  status: number;
  statusText: string;
  /** The final URL, after redirects. */
  url: string;
  headers: Record<string, string>;
  /** Text for text, JSON, XML and RSC content types. */
  body?: string | undefined;
  /** Anything else, base64. */
  bodyBase64?: string | undefined;
  /** The cookies asked for in `cookies`, by name. */
  cookies?: Record<string, string> | undefined;
};

export type HelperTab = { tabId: number; url: string; created: boolean };

export type HelperRunResult = { value: unknown };

export type HelperScreenshot = { pngBase64: string; width: number; height: number };

/** The answer is lost; `commandId` is for `lookup`. */
export type HelperUnknown = { state: "unknown"; commandId: string };

/** What became of a command, as `lookup` sees it. */
export type HelperLookup =
  | { state: "pending" }
  | { state: "unknown" }
  | { state: "cancelled" }
  | { state: "done"; value: unknown }
  | { state: "failed"; error: { kind: string; message: string } };

/** A tab `tab` returned (a number) or a URL to find or open one for. */
export type HelperTarget = string | number;

export type ExtensionHelperApi = {
  /** Whether a browser is paired and connected now. Throws where the manifest declares no `helper`. */
  status(): ExtensionHelperStatus;
  /** Called when `status()` changes. One handler; a second call replaces it. */
  onStatus(handler: (status: ExtensionHelperStatus) => void): void;
  /**
   * A request with the browser's own cookies. Default `retry`: "safe" for a
   * GET or HEAD, "never" for anything else. `cookies` names cookies whose
   * values come back with the answer (a CSRF token, say); the jar never does.
   */
  fetch(
    request: HelperFetchRequest,
    options?: HelperCallOptions & { cookies?: string[] },
  ): Promise<HelperFetchResponse | HelperUnknown>;
  /**
   * Find an open tab for `url`, or open one in the background. `match` says
   * how a tab counts as the same page ("origin", the default, "prefix" or
   * "exact"). Default `retry`: "safe". Its `tabId` is for `run` and `screenshot`.
   */
  tab(
    url: string,
    options?: HelperCallOptions & {
      match?: "origin" | "prefix" | "exact";
      active?: boolean;
      reuse?: boolean;
    },
  ): Promise<HelperTab | HelperUnknown>;
  /**
   * Run `code` in a tab (a `tabId` from `tab`, or a URL to find or open one
   * for) by `chrome.userScripts.execute`: it may end in a promise, and its
   * value must be JSON. Needs the reader to have switched user scripts on.
   * Default `retry`: "never".
   */
  run(
    target: HelperTarget,
    code: string,
    options?: HelperCallOptions & {
      world?: "USER_SCRIPT" | "MAIN";
      waitFor?: "load" | { selector: string; timeoutMs?: number };
    },
  ): Promise<HelperRunResult | HelperUnknown>;
  /**
   * A PNG of a tab. By default the tab is brought to the front for a moment,
   * which the reader can see; `activate: false` captures whatever is showing.
   * Default `retry`: "safe".
   */
  screenshot(
    target: HelperTarget,
    options?: HelperCallOptions & { activate?: boolean },
  ): Promise<HelperScreenshot | HelperUnknown>;
  /**
   * How a lane is paced: at least `gapMs` after a command ends before the
   * next starts, plus up to `jitter` of it more (0.3 is up to 30 %, default
   * 0), and at most `maxPerHour` starts in any hour. Timed by prifly.
   */
  pace(site: string, pace: { gapMs: number; jitter?: number; maxPerHour?: number }): void;
  /** What became of a command an earlier call answered `unknown` for; null for an id this extension never made. */
  lookup(commandId: string): HelperLookup | null;
};
