/**
 * `prifly-extension.json`, as an extension writes it. The host reads it
 * tolerantly with its own schema (`Manifest` in prifly's
 * `apps/desktop-host/src/extensions/installed.ts`; `manifest-contract.test.ts`
 * there reads the template's manifest with it): an entry that does not read
 * is dropped, not the manifest.
 */

import type { DecorationIcon } from "./decorations";
import type { SettingField } from "./settings";

/** An account provider `api.connections` can use. */
export type ConnectionProviderName = "google" | "microsoft";

/** One provider the extension uses through `api.connections`, and what it asks of it. */
export type ManifestConnectionEntry = {
  provider: ConnectionProviderName;
  /** Asked for when the reader connects such an account: `Mail.Read`, a Google scope URL. */
  scopes?: string[];
  /** Shown to the reader: what the extension does with the account. */
  why?: string;
  /** Asked for only when the extension calls `signIn` for them. */
  optional?: boolean;
};

/** An item for a session's right-click menu: sends its prompt to the session. */
export type ManifestMenuEntry = {
  id: string;
  label: string;
  icon?: DecorationIcon;
  /** Asks the reader for a line first; `{input}` in `prompt` is replaced by it. */
  input?: { title: string; placeholder?: string };
  prompt: string;
};

/** An entry in a session's Snooze submenu (`api.snoozeOptions`, the module's `snooze`). */
export type ManifestSnoozeEntry = { id: string; label: string; icon?: DecorationIcon };

/** A launcher: a way to start a session from something of the extension's (`choices`, `launch`). */
export type ManifestLaunchEntry = {
  id: string;
  label: string;
  icon?: DecorationIcon;
  description?: string;
  searchPlaceholder?: string;
  /** The extension may start sessions from its items by itself (`api.start`). */
  starts?: boolean;
};

/** A window of the extension's own, a button in the status bar; answered by the module's `panel`. */
export type ManifestPanelEntry = {
  /** `^[a-z0-9][a-z0-9-]*$`. */
  id: string;
  label: string;
  icon?: DecorationIcon;
  description?: string;
  /** Relative to the extension's root: where `page` and what it loads are served from. */
  folder: string;
  /** Default "index.html". */
  page?: string;
};

export type ExtensionManifest = {
  /** `^[a-z0-9][a-z0-9-]*$`, unique among installed extensions. */
  id: string;
  name: string;
  description?: string;
  version?: string;
  /** The module the host imports; left out, the extension has no code — a skin, a prompt, a plugin. */
  main?: string;
  /** A folder of its own programs, put on the PATH of the sessions prifly runs. */
  bin?: string;
  /** A folder of mockup recipes `mockup_recipe` serves while it is enabled. */
  mockupStacks?: string;
  /** A Markdown file whose text is added to every session's system prompt. */
  prompt?: string;
  /** The vault entries `api.vault.read` may hand it, by name. */
  vault?: string[];
  /** The accounts `api.connections` may use for it. */
  connections?: ManifestConnectionEntry[];
  /** Stylesheets laid over the window; see prifly's `skin.ts`. */
  skin?: { folder: string; styles: string[]; with?: string[] };
  /** Colour themes and fonts for the pickers; see prifly's `manifest-appearance.ts`. */
  themes?: unknown[];
  fonts?: unknown[];
  menu?: ManifestMenuEntry[];
  snooze?: ManifestSnoozeEntry[];
  launch?: ManifestLaunchEntry[];
  panels?: ManifestPanelEntry[];
  /** The form in the Extensions dialog; the values reach it as `api.settings`. */
  settings?: SettingField[];
};
