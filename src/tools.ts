/** MCP tools an extension serves (`api.tools`), and the vault tokens it may read (`api.vault`). */

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
};
