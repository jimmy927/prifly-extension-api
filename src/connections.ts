/**
 * `api.connections`, as an extension sees it: the Google and Microsoft
 * accounts the reader connected in Vault → Connections, for the providers its
 * manifest's `connections` names.
 */

/** One connected account. Never a token. */
export type ExtensionConnection = {
  id: string;
  provider: string;
  account: string;
  /** "prifly", or "Your client · <project>". */
  client: string;
  scopes: string[];
  /** `needs-sign-in`: the provider ended the grant; `signIn` with its id revives it. */
  state: "ok" | "needs-sign-in";
};

/**
 * A grant the provider ended (revoked, expired, a Workspace reauth, a
 * Microsoft claims challenge). The reader sees "Sign in again" on the row
 * and in the status bar; pass this on as it is — an MCP tool's text, say —
 * rather than retrying.
 */
export type ExtensionNeedsSignIn = {
  needsSignIn: { connection: string; provider: string; account: string };
};

export type ExtensionFetchOptions = RequestInit & {
  /** The resource (an origin) the token is for; left out, the request URL's. */
  resource?: string;
  /** Microsoft: the tenant to get the token in (Azure across tenants); left out, the client's. */
  tenant?: string;
  /** Google: the Cloud project quota and billing go to (`x-goog-user-project`). */
  project?: string;
};

export type ExtensionSignInResult =
  | { ok: true; connection: string; account: string }
  | { ok: false; message: string };

/** Added to `ExtensionApi`. Absent on an older prifly: call it as `api.connections?.list(...)`. */
export type ExtensionConnectionsApi = {
  /** The connected accounts of `provider` (all the manifest names, when left out). */
  list(provider?: string): ExtensionConnection[];
  /**
   * Send `request` to the provider's API with the connection's token, and get
   * the provider's `Response` back untouched — 429 and 503 included, with
   * their `Retry-After`. A 401 is retried once after a refresh. Throws for a
   * use the host refuses outright: an unknown id, a provider the manifest
   * does not name, a host the token must not go to.
   */
  fetch(
    id: string,
    request: string | Request,
    options?: ExtensionFetchOptions,
  ): Promise<Response | ExtensionNeedsSignIn>;
  /** Only the access token, for what cannot go through `fetch`. Keep it no longer than one call. */
  token(
    id: string,
    options?: { resource?: string; tenant?: string },
  ): Promise<{ token: string } | ExtensionNeedsSignIn>;
  /**
   * Ask the reader to sign in, in their browser: a new account, or — with
   * `connection` — more scopes on one they connected (incremental consent,
   * e.g. Mail.ReadWrite on the first draft). Only scopes the manifest lists
   * for that provider. Resolves when they finish or give up (5 minutes).
   */
  signIn(
    provider: string,
    scopes: string[],
    options?: { connection?: string; client?: string },
  ): Promise<ExtensionSignInResult>;
};
