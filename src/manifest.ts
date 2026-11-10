/**
 * `prifly-extension.json`, as an extension writes it. The host reads it
 * tolerantly with its own schema (`Manifest` in prifly's
 * `apps/desktop-host/src/extensions/installed.ts`; `manifest-contract.test.ts`
 * there reads the template's manifest with it): an entry that does not read
 * is dropped, not the manifest.
 */

import type { DecorationIcon } from "./decorations";
import type { LlmTier } from "./llm";
import type { SettingField } from "./settings";

/**
 * An account provider `api.connections` can use. `aws-keys` is an AWS access
 * key the reader typed into Vault → Connections: requests to it are signed
 * with SigV4 by the host (`region` and `service` in the fetch options), and
 * it has no token and no scopes.
 */
export type ConnectionProviderName = "google" | "microsoft" | "aws-keys";

/** One provider the extension uses through `api.connections`, and what it asks of it. */
export type ManifestConnectionEntry = {
  provider: ConnectionProviderName;
  /** Asked for when the reader connects such an account: `Mail.Read`, a Google scope URL. Ignored for `aws-keys`. */
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

/**
 * A window of the extension's own, a button in the status bar; answered by the module's `panel`.
 *
 * Its page talks to the window with `parent.postMessage(message, "*")` and
 * hears it on `window`'s `message` events: `prifly-look` (the window's
 * colours), `prifly-launch`, `prifly-open-session`, `prifly-open-terminal`.
 *
 * Voice commands, where `api.features` includes "panel-voice": the reader says
 * "Prifly" and every control on screen shows its spoken name, the page's
 * included, and the next words click one. The window asks the page
 *
 *     { type: "prifly-say-list" }
 *
 * when the page loads and each time the names go up; the page answers within
 * 300 ms, and may send the same again by itself whenever its controls change:
 *
 *     parent.postMessage({ type: "prifly-say-targets", targets: [
 *       { id: "refresh", name: "refresh", rect: { x: 12, y: 8, width: 72, height: 28 } },
 *     ] }, "*")
 *
 * `name` is what the reader says: one to three plain words, unlike any other
 * on the page. `rect` is the control's box in the page's own CSS pixels
 * (`getBoundingClientRect()`), where its name is drawn; left out, the names
 * stand in a column at the frame's top left. When the reader says a name the
 * window sends `{ type: "prifly-say", id }`, and the page clicks that
 * control. A page that does not answer has no voice targets.
 */
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
  /**
   * True when the module serves the panel media from a folder of its choosing:
   * it calls `api.panelMedia(id, absoluteFolder)` and the page loads
   * `media/<path>` (video, audio, subtitles, images, with byte ranges). Where
   * `api.features` includes "panel-media".
   */
  media?: boolean;
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
  /** The vault entries `api.vault.read` (an api-token) and `api.vault.ssh` (an ssh-key) may use, by name. */
  vault?: string[];
  /** The tools other extensions serve that `api.tools.read` may call, by name; any other is refused. */
  reads?: string[];
  /** The accounts `api.connections` may use for it. */
  connections?: ManifestConnectionEntry[];
  /** The sites `api.helper` may reach in the reader's browser, as URL match patterns, and why. */
  helper?: { sites: string[]; why: string };
  /**
   * The model tiers `api.llm.ask` may use, and why, shown to the reader on
   * the consent card: `{ "tiers": ["fast"], "why": "Suggests branch names" }`.
   * Left out, or a tier not listed, and every ask on it is `not-allowed`.
   */
  llm?: { tiers: LlmTier[]; why: string };
  /** Stylesheets laid over the window; see prifly's `skin.ts`. */
  skin?: { folder: string; styles: string[]; with?: string[] };
  /** Colour themes and fonts for the pickers; see prifly's `manifest-appearance.ts`. */
  themes?: unknown[];
  fonts?: unknown[];
  menu?: ManifestMenuEntry[];
  snooze?: ManifestSnoozeEntry[];
  launch?: ManifestLaunchEntry[];
  /**
   * Panels are for prifly-wide tools (Vast.ai spend, disk space, perf), not for
   * a service plugin, whose state belongs on its launch board.
   */
  panels?: ManifestPanelEntry[];
  /** The form in the Extensions dialog; the values reach it as `api.settings`. */
  settings?: SettingField[];
  /**
   * The extension hears the reader's dictation and may mark words in the
   * message box (`ExtensionDictationApi`, `dictation.ts`); with `audio`, each
   * piece's audio too. Settings → Extensions shows it as "Hears your
   * dictation (with audio)" or "(text only)". Left out, no `onDictationPiece`
   * and no `markDictation`.
   */
  dictation?: { audio?: boolean };
};
