/**
 * `api.connections`, as an extension sees it: the Google and Microsoft
 * accounts, and the AWS keys, the reader connected in Vault → Connections,
 * for the providers its manifest's `connections` names (`"google"`,
 * `"microsoft"`, `"aws-keys"`).
 *
 * An `aws-keys` connection is an IAM user's access key. The extension never
 * holds it: `fetch` signs the request with AWS Signature Version 4 in the
 * host, which needs `region` and `service` in its options, and `token`
 * throws. The manifest entry takes no scopes — what the key may do is the
 * IAM user's policy.
 */

/** One connected account. Never a token or a secret. */
export type ExtensionConnection = {
  id: string;
  /** `google`, `microsoft` or `aws-keys`. */
  provider: string;
  /** For `aws-keys`: `alias (1234-5678-9012)`, or just the account id. */
  account: string;
  /** "prifly", or "Your client · <project>"; "Access key" for `aws-keys`. */
  client: string;
  /** Always empty for `aws-keys`. */
  scopes: string[];
  /** `needs-sign-in`: the provider ended the grant; `signIn` with its id revives it. */
  state: "ok" | "needs-sign-in";
  /**
   * Microsoft: other tenants (Azure guests) whose sign-in alone ended, while
   * `state` stays ok; `signIn` with the id and the tenant revives one.
   * Absent on an older prifly, which ends the whole connection instead.
   */
  tenantsNeedingSignIn?: string[];
};

/**
 * A grant the provider ended (revoked, expired, a Workspace reauth, a
 * Microsoft claims challenge). The reader sees "Sign in again" on the row
 * and in the status bar; pass this on as it is — an MCP tool's text, say —
 * rather than retrying.
 */
export type ExtensionNeedsSignIn = {
  /**
   * `tenant`: only that other tenant ended (a Microsoft guest tenant asking
   * for MFA, a claims challenge there) — the connection still works for its
   * own tenant and every other; `signIn` with `{ connection, tenant }`
   * revives it. Left out, the whole connection ended.
   */
  needsSignIn: {
    connection: string;
    provider: string;
    account: string;
    tenant?: string;
    /**
     * Microsoft: the tenant's consent policy refused (AADSTS65001, 90094 or
     * 90095), so signing in again cannot help — only the tenant's admin can
     * approve prifly, at this link. Show it to the reader; absent on an
     * older prifly and for every other reason.
     */
    adminConsentUrl?: string;
  };
};

export type ExtensionFetchOptions = RequestInit & {
  /** The resource (an origin) the token is for; left out, the request URL's. */
  resource?: string;
  /** Microsoft: the tenant to get the token in (Azure across tenants); left out, the client's. */
  tenant?: string;
  /** Google: the Cloud project quota and billing go to (`x-goog-user-project`). */
  project?: string;
  /**
   * `aws-keys`: the region the request is signed for (`eu-north-1`; the global
   * services sign as `us-east-1`). Required for `aws-keys` and never guessed
   * from the URL: the host signs with SigV4 and throws a `ConnectionError`
   * when it is missing. Ignored for the other providers.
   */
  region?: string;
  /** `aws-keys`: the service's signing name (`sts`, `ec2`, `s3`, `logs`). Required for `aws-keys`, as `region`. */
  service?: string;
  /** Reserved for a future aws-sso; refused for `aws-keys`. */
  accountId?: string;
  /** Reserved for a future aws-sso; refused for `aws-keys`. */
  roleName?: string;
};

export type ExtensionSignInResult =
  | { ok: true; connection: string; account: string }
  | {
      ok: false;
      message: string;
      /** Microsoft: as `ExtensionNeedsSignIn.needsSignIn.adminConsentUrl`, for a refusal by the tenant's consent policy. */
      adminConsentUrl?: string;
    };

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
   *
   * For `aws-keys` the request is signed with SigV4 instead: pass `region`
   * and `service` (both required), and only `https://*.amazonaws.com` and
   * `*.api.aws` URLs are accepted. A 403 saying the clock is off is retried
   * once; one saying AWS no longer knows the key comes back as
   * `needsSignIn`.
   */
  fetch(
    id: string,
    request: string | Request,
    options?: ExtensionFetchOptions,
  ): Promise<Response | ExtensionNeedsSignIn>;
  /**
   * Only the access token, for what cannot go through `fetch`. Keep it no
   * longer than one call. Throws a `ConnectionError` for `aws-keys`: there is
   * no token to give; `fetch` signs.
   */
  token(
    id: string,
    options?: { resource?: string; tenant?: string },
  ): Promise<{ token: string } | ExtensionNeedsSignIn>;
  /**
   * Ask the reader to sign in, in their browser: a new account, or — with
   * `connection` — more scopes on one they connected (incremental consent,
   * e.g. Mail.ReadWrite on the first draft). Only scopes the manifest lists
   * for that provider. Resolves when they finish or give up (5 minutes).
   * Microsoft, with `connection` and `tenant`: sign that account in again at
   * one other tenant whose sign-in alone ended (`needsSignIn.tenant`), as the
   * same person; only that tenant is revived.
   *
   * `signIn("aws-keys", [])` opens the Add AWS key form in the window instead
   * and resolves once a key is added, or after 5 minutes.
   */
  signIn(
    provider: string,
    scopes: string[],
    options?: { connection?: string; client?: string; tenant?: string },
  ): Promise<ExtensionSignInResult>;
};
