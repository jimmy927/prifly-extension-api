/** MCP tools an extension serves (`api.tools`), and the vault entries it may use (`api.vault`). */

import type { ExtensionPick, ExtensionPickAnswer } from "./dialogs";

export type ExtensionToolContext = {
  /** The full id of the session that called the tool. */
  session: string;
  /** Show a pick card in that session and wait for the reader. */
  pick(request: ExtensionPick): Promise<ExtensionPickAnswer>;
  /** Aborted when the session or the call goes away. */
  signal: AbortSignal;
  /**
   * The calling session's scratchpad folder, made if it is missing: where a
   * tool that saves files for a session puts them. Reading it throws when
   * prifly has no transcript to find the folder from, so a tool that never
   * reads it is never affected. Where `api.features` includes "tool-scratchpad".
   */
  readonly scratchpad: string;
};

export type ExtensionTool = {
  /** `^[a-z][a-z0-9_]{0,47}$`; the session sees it as `mcp__prifly__<name>`. */
  name: string;
  description: string;
  /** A JSON Schema object for the arguments. */
  inputSchema: Record<string, unknown>;
  /** The text the tool returns. A throw is returned as an MCP tool error with its message. */
  call(args: Record<string, unknown>, ctx: ExtensionToolContext): Promise<string>;
};

/** Added to `ExtensionApi`. Absent on an older prifly: call it as `api.tools?.register(...)`. */
export type ExtensionToolsApi = {
  /**
   * Replace every tool this extension serves. A name another extension or
   * prifly owns, or an `inputSchema` that is not `type: "object"`, is refused
   * and logged. A session reads the tool list when it connects: one already
   * running sees a change only after it reconnects.
   */
  register(tools: ExtensionTool[]): void;
};

/** Added to `ExtensionApi`. Absent on an older prifly: call it as `api.vault?.read(...)`. */
export type ExtensionVaultApi = {
  /**
   * The token of the vault entry `name`, an `api-token` entry the reader keeps
   * in prifly's vault (Settings → Vault). Null — so the extension falls back
   * to its own way of finding a key — when there is no such entry, it is
   * another kind, the manifest's `vault` list does not name it, or its level
   * is not 1: level 2 and 4 ask the reader on a session's card, which an
   * extension has none of, and level 3 is a fence. Read it each time it is
   * needed rather than keeping it: an entry the reader changes or fences
   * takes effect on the next read.
   */
  read(name: string): Promise<string | null>;
  /**
   * Run `argv` — `ssh`, `scp`, `sftp` or `rsync`, by name or full path — with
   * the vault's `ssh-key` entry `name` handed to it, and get back its exit
   * code and both streams with every form of the key replaced by
   * `[vault:<name>]`. The key never reaches the extension: a throwaway
   * `ssh-agent` holds it (`SSH_AUTH_SOCK`) and is stopped when the command
   * ends.
   *
   * The same rules as `read`: the manifest's `vault` list must name the
   * entry, it must be an `ssh-key`, and its level where the extension lives
   * must be 1 — level 2 and 4 ask on a session's card, which an extension
   * has none of, and level 3 is a fence. Anything else, and a program that is
   * not one of the four, comes back `ok: false` with why, and nothing ran.
   * Only where `api.features` includes "vault-ssh"; absent on an older
   * prifly: call it as `api.vault?.ssh?.(...)`.
   */
  ssh?(name: string, argv: string[], options?: VaultSshOptions): Promise<VaultSshResult>;
  /**
   * Keep a login token the extension obtained — one the reader pasted into
   * it, or one a site issued after the reader approved the extension — in
   * the vault as the `api-token` entry `name`, so it moves with prifly's data
   * (`prifly-move`) and `read(name)` reads it back. The reader confirms on a
   * card every window shows, which says which extension asks, the entry's
   * name, whether it adds the entry or replaces the token an entry already
   * holds, and `why`; it starts at level 1, the one level `read` reads, and
   * the reader may pick another. Nothing is stored until they confirm, and
   * the token is never echoed back.
   *
   * Resolves once the reader answers (or after an hour): `accepted` with the
   * level it was filed at, `declined`, `timed out`, or `refused` with why
   * when no card was shown — the manifest's `vault` list does not name
   * `name`, an entry by that name is another kind or fenced (level 3), or the
   * extension stopped. A new entry records the extension as its owner, for
   * `forget`; replacing one keeps the owner it had.
   *
   * Only where `api.features` includes "vault-file"; absent on an older
   * prifly: call it as `api.vault?.file?.(...)`.
   */
  file?(name: string, request: VaultFileRequest): Promise<VaultFileResult>;
  /**
   * Log out: remove the entry `name` from the vault — only one this
   * extension filed (`file`), never one the reader or a session made. No
   * card: the extension is removing what it put there, on the reader's own
   * click; the vault's audit keeps a row of it. True when it was removed,
   * false when there was nothing of this extension's to remove. Only where
   * `api.features` includes "vault-file".
   */
  forget?(name: string): Promise<boolean>;
};

export type VaultFileRequest = {
  token: string;
  /** What the token is for, as the Vault dialog lists it ("Sentry, jimmy@example.com"). */
  label?: string;
  /** The host the token is for (sentry.io). */
  host?: string;
  /** One line for the card: why the extension keeps it. */
  why: string;
};

export type VaultFileResult =
  | { outcome: "accepted"; level: 1 | 2 | 4 }
  | { outcome: "declined" }
  | { outcome: "timed out" }
  | { outcome: "refused"; message: string };

export type VaultSshOptions = {
  /** Where it runs; the extension's own folder when left out. */
  cwd?: string;
  /** Killed after this long: 120 000 by default, at most 600 000. */
  timeoutMs?: number;
};

export type VaultSshResult =
  | {
      ok: true;
      /** Null when it was killed for its timeout. */
      exitCode: number | null;
      timedOut: boolean;
      /** Each stream as the command wrote it (the first 4 MB), the key scrubbed out. */
      stdout: string;
      stderr: string;
    }
  | { ok: false; message: string };
