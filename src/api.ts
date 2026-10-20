/** `ExtensionApi`, what `activate` is given, and `ExtensionModule`, what the module exports. */

import type { ExtensionConnectionsApi } from "./connections";
import type {
  ActionPicked,
  Decoration,
  DecorationTone,
  LauncherFlag,
  SnoozeOption,
} from "./decorations";
import type {
  ConfirmSpec,
  DialogAnswer,
  DialogCheckbox,
  DialogNumber,
  DialogNumbersAnswer,
  DialogSpec,
  ExtensionPick,
  ExtensionPickAnswer,
  PairHandle,
  PairSpec,
} from "./dialogs";
import type { ExtensionHelperApi } from "./helper";
import type { AccountInfo, ExtensionCloud, ExtensionMachine, ExtensionSession } from "./host-info";
import type {
  Launch,
  LaunchBoard,
  LaunchChoice,
  LaunchItem,
  PanelRequest,
  StartAnswer,
} from "./launch";
import type { ExtensionSecretsApi } from "./secrets";
import type { SettingValues } from "./settings";
import type { ExtensionStateApi } from "./state";
import type { ExtensionToolsApi, ExtensionVaultApi } from "./tools";

export type ExtensionApi = {
  /**
   * What this prifly accepts beyond the first version, by name: "pick-amount-limit"
   * (`limit` on a `ctx.pick` amount), "pick-links" (`links` on a `ctx.pick`), "pick-cells" (`titles` and `cellKinds` on a `ctx.pick`), "panel-open-session" (a panel page's `prifly-open-session` message opens a session, see `panel.ts`), "panel-open-terminal" (a panel page's `prifly-open-terminal` message opens the shell the module's `terminal` export names), "start-session" (`api.start`), "settings" (`api.settings` and `api.onSettings`), "open-url" (`api.openUrl`), "tool-scratchpad" (`ctx.scratchpad` of a tool call), "secrets" (`api.secrets`), "pair-dialog" (`api.pair`), "helper" (`api.helper`), "state" (`api.state`), "vault-ssh" (`api.vault.ssh`), "vault-file" (`api.vault.file`), "campaign-holds" (`api.campaigns`), "confirm" (`api.confirm`), "status" (`api.status`), "speech-backend" (`api.setSpeechBackend`), "rent-from-dialog" (`api.onRent`, and `setup` and `rent` on a reported machine). Absent on a prifly that predates the list.
   */
  features?: readonly string[];
  /**
   * The values of the settings the manifest declares (`SettingField`), every
   * field present with its default filled in, as the reader last set them in
   * the Extensions dialog. Read it when needed rather than keeping a copy: it
   * is current at each read. Where `api.features` includes "settings".
   */
  settings?: SettingValues;
  /**
   * Called after the reader changes a setting, with every value. One handler;
   * a second call replaces it. Where `api.features` includes "settings".
   */
  onSettings?: (handler: (values: SettingValues) => void) => void;
  /** The vault's API tokens this extension's manifest names under `vault`; see there. */
  vault?: ExtensionVaultApi;
  /** The Google and Microsoft accounts of the providers its manifest's `connections` names. */
  connections?: ExtensionConnectionsApi;
  /** The user's own browser, through the prifly Helper extension; see there. Where `api.features` includes "helper". */
  helper?: ExtensionHelperApi;
  /** A sealed key-value store of this extension's own, for credentials; see `ExtensionSecretsApi`. Where `api.features` includes "secrets". */
  secrets?: ExtensionSecretsApi;
  /**
   * MCP tools this extension serves to every session, as
   * `mcp__prifly__<name>` (`mcp/extension-tools.ts`). Only while it is running.
   */
  tools?: ExtensionToolsApi;
  /**
   * What the extension keeps for itself — JSON documents and append-only
   * logs — in prifly's database, so it moves with prifly's data (`state.ts`).
   * Where `api.features` includes "state".
   */
  state?: ExtensionStateApi;
  /**
   * Replace everything this extension shows. `bySession` is keyed by a
   * session id or any unique start of one (a label has room for 8 characters);
   * items for an id no session has (or that several share) are dropped, and
   * only the items of a session the window shows are drawn, on its banner.
   * `statusBar`: global items for the status bar, independent of which
   * session is open. Nothing else reaches the status bar.
   * The status bar is for prifly-wide tools (Vast.ai spend, disk space, perf),
   * not for a service plugin (Gmail, Azure, WhatsApp): pass it `[]` and put
   * the plugin's state (sign-in missing, consent, keys) on its launch board.
   */
  show(bySession: Record<string, Decoration[]>, statusBar: Decoration[]): void;
  /**
   * Replace the extension's entries in each session's Snooze submenu, the
   * whole map each time. Keyed like `show`'s `bySession`; an entry the manifest
   * declares but a session's list leaves out is not offered on that session.
   */
  snoozeOptions(bySession: Record<string, SnoozeOption[]>): void;
  /**
   * Make the launcher `launchId`'s button glow in `tone`'s colour, `hint`
   * added to its hover — something waiting behind it, such as open errors.
   * Null puts it out.
   */
  flag(launchId: string, flag: LauncherFlag | null): void;
  /**
   * Tell the reader something that cannot wait for them to look at a chip:
   * "lc-box3 is destroyed in 15 min unless its lease is extended". Shown as a
   * notice in the window until dismissed — and by the OS, where the window
   * may raise its notifications and does not have the focus — under the
   * extension's name, in `tone`'s colour ("info" when left out). `session`, a
   * session id or any unique start of one, makes a click on it open that
   * session. Also a line in the host's log, under `ext.<id>.notify`.
   */
  notify(text: string, options?: { tone?: DecorationTone; session?: string }): void;
  /**
   * Open `url` in the reader's own browser (on Windows, the Windows one, also
   * when prifly's host runs in WSL). Only http and https are opened: any other
   * scheme is refused. The answer says whether a browser opened. Also a line in
   * the host's log, under `ext.<id>.open_url`. Where `api.features` includes
   * "open-url".
   */
  openUrl(url: string): Promise<boolean>;
  /**
   * Replace every machine this extension offers sessions to use, the whole
   * list each time — its rented boxes, and a `provider`-kind machine for
   * itself when it can rent more. Ids are namespaced `ext:<extension id>:<key>`
   * before a session sees them, so an extension needs only its own `key` to
   * be unique.
   */
  machines: { report(items: ExtensionMachine[]): void };
  /**
   * Machines a running campaign needs kept alive, now. Only this extension's
   * own machines (the keys it gave `machines.report`): one is held while a
   * campaign's experiment on it is in flight, being measured, or Stuck with
   * its run perhaps still alive there. Ask before destroying a box — its
   * lease ending, its budget spent — and for a held one copy `save` off it
   * and wake `leadSession` with `prompt` rather than destroy it unannounced.
   * Answered from what the host already holds: asking often costs nothing.
   * Where `api.features` includes "campaign-holds".
   */
  campaigns?: { holds(): CampaignHold[] };
  /**
   * Carry out an action the reader chose from an item's right-click menu, or
   * from the ▾ on one of this extension's machine cards (its machine `key`).
   * What it returns is shown to them ("Destroyed lc-box1"); what it throws is
   * shown as the failure. One handler per extension; a second call replaces it.
   * `picked` is the session the reader chose, for an action with `pick: "session"`.
   */
  onAction(
    handler: (key: string, action: string, picked?: ActionPicked) => Promise<string> | string,
  ): void;
  /**
   * The sessions in the sidebar now: running, and the last hours of history —
   * about a hundred, cheap to go through on every poll. An older session is
   * not here; look it up by id with `session`.
   */
  sessions(): ExtensionSession[];
  /**
   * One session by its full id, however long ago it was last active: the
   * sidebar's with its live state, else the history index's as "ended"; null
   * for an id the host has never seen. For an item that keeps the id of the
   * session it started. Offered when `features` has "session-lookup".
   */
  session(id: string): ExtensionSession | null;
  /**
   * Rent a box for a session the reader is starting from the New session
   * dialog's "Rent a <label> box…" row (a `provider` machine reporting
   * `rent`). The session is already in the sidebar under `req.sessionId`;
   * show the offers with `ui.pick` over it, rent only once the reader chose,
   * and answer the new box's machine `key` — the host then waits for it to be
   * running and reachable by ssh, sets Claude Code up there and starts the
   * session on it. A reader who cancels the card is answered `ok: false`.
   * One handler per extension; a second call replaces it. Where
   * `api.features` includes "rent-from-dialog".
   */
  onRent(handler: RentHandler): void;
  /** A line in the host's log, under `ext.<id>.<event>`. */
  log(event: string, fields?: Record<string, string | number | boolean | null>): void;
  /** The extension's own folder: where it keeps its config. */
  folder: string;
  /**
   * The folders its programs are in, first on the PATH of every session
   * prifly runs: its manifest's `bin`, and the `bin` of the `.venv` prifly
   * builds from its `pyproject.toml` and `uv.lock` (prifly brings uv and the
   * Python; the extension ships neither).
   */
  paths: readonly string[];
  /** The cloud sessions of the accounts connected to prifly, read with their own tokens. */
  cloud: ExtensionCloud;
  /**
   * Every Claude account prifly holds limits for — local logins and cloud-only
   * logins, one entry per email — as the host's pollers last read them. No
   * call leaves the machine: it answers from what the pollers already hold,
   * so asking often costs nothing and shows a new reading at most every poll.
   */
  accounts(): AccountInfo[];
  /** Sends `text` into the session as a <prifly-notice> (shown as prifly's, not the user's); resumes it first if it ended. Clears any snooze on it. */
  prompt(sessionId: string, text: string): Promise<{ delivered: boolean }>;
  /**
   * Start a session from one of this extension's launcher items by itself —
   * a new Sentry error becomes a session without a click — exactly as
   * pressing Start on that item would: the item's `launch()` is asked for the
   * prompt and folder, the session starts in a new worktree of that folder's
   * repository (in the folder itself outside git), its first message sent as
   * Research so it investigates and proposes but changes nothing, and
   * `launched` is told which session it became. Only for a launcher whose
   * manifest entry says `"starts": true`, only in a folder the reader has
   * used in prifly, and under caps: at most three such sessions of this
   * extension's running at once, twelve started an hour. The new row is
   * tinted in the sidebar until the reader opens it, never takes the focus,
   * and a notice names it. The answer says whether one started, and why not.
   * Where `api.features` includes "start-session".
   */
  start(launchId: string, key: string): Promise<StartAnswer>;
  /** Snoozes the session until `until` (epoch ms), or until the extension wakes it when `until` is null. `label` replaces "Back at …" in the Snoozed list, e.g. "Until 77257ba3 is live". `null` as the whole argument clears the snooze. */
  snooze(sessionId: string, snooze: { until: number | null; label?: string } | null): void;
  /**
   * Opens a modal dialog in the window over that session; resolves with the
   * edited text on confirm, null on cancel/close. With `checkbox`, a labelled
   * box (unchecked unless `checked`) sits between the hint and the buttons,
   * and it resolves with `{ text, checked }` instead. With `numbers`, labelled
   * number inputs replace the textarea and it resolves with
   * `{ text, checked, numbers }`, `numbers` keyed by each field's `key`.
   */
  dialog(spec: DialogSpec & { numbers: DialogNumber[] }): Promise<DialogNumbersAnswer | null>;
  dialog(spec: DialogSpec & { checkbox: DialogCheckbox }): Promise<DialogAnswer | null>;
  dialog(spec: DialogSpec): Promise<string | null>;
  /**
   * Ask the reader before a write: a card over the session whose tool call
   * is running (or `spec.sessionId`'s) shows `summary` large, `content` (the
   * human part) in plain text under it and `details` (the technical part)
   * folded under a "Details" toggle, with Confirm and Cancel. True only on Confirm. False on
   * Cancel or closing it, when the tool call or its session goes away, the
   * last window closes, the extension stops, 15 minutes pass without an
   * answer, or there is no session to ask over (said in the host's log as
   * `ext.confirm_no_session`). Every write a tool makes goes through it
   * first. Where `api.features` includes "confirm".
   */
  confirm?(spec: ConfirmSpec): Promise<boolean>;
  /**
   * One line on how the extension stands — "Connected as ada@example.com ·
   * 41 unread" — shown in Settings → Extensions in place of its description
   * while it is not empty; "" clears it. The latest call wins, and it is
   * cleared when the extension stops. Where `api.features` includes "status".
   */
  status?(text: string): void;
  /**
   * Switches the read-aloud engine at runtime: `url` is an http(s) endpoint
   * that takes `POST <url>/speech` with `{"text": "..."}` and answers with
   * audio (see docs/speech-engine.md); `null` restores the default (Edge's
   * voices, or `PRIFLY_SPEECH_URL` when the host was started with one). The
   * next read-aloud uses it, with no reload or restart. It beats
   * `PRIFLY_SPEECH_URL`. The last extension to set it owns it: when that
   * extension stops it goes back to the default, and a stopping extension
   * that does not own it changes nothing. It is not kept across host
   * restarts, so call it from `activate()`. Throws on a URL that is not
   * http(s). Where `api.features` includes "speech-backend".
   */
  setSpeechBackend?(url: string | null): void;
  /**
   * Opens a pairing dialog in every window, for linking a device: a QR code
   * to scan or a code to type, which the extension keeps current with
   * `update` as they rotate. The reader may give a phone number in the code
   * tab (`PairHandle.phones`). Where `api.features` includes "pair-dialog".
   */
  pair?(spec: PairSpec): PairHandle;
};

/** What the reader asked to rent from the New session dialog (`ExtensionApi.onRent`). */
export type RentRequest = {
  /** The session the box is for, already in the sidebar: label the box with it. */
  sessionId: string;
  need: "cpu" | "gpu";
  /** How long the reader expects to need it. */
  hours: number;
  /** The first line of the session's prompt, or "New session". */
  purpose: string;
};

/** The rented box's machine `key` (as `machines.report` will name it), or why there is none. */
export type RentResult = { ok: true; key: string } | { ok: false; reason: string };

/** The rent card, shown over the request's session. */
export type RentUi = { pick: (request: ExtensionPick) => Promise<ExtensionPickAnswer> };

export type RentHandler = (req: RentRequest, ui: RentUi) => Promise<RentResult>;

/** A machine a running campaign needs kept alive (`ExtensionApi.campaigns`). */
export type CampaignHold = {
  /** The key the extension gave the machine in `machines.report`. */
  machineKey: string;
  /** The campaign's lead session, to wake with `prompt`. */
  leadSession: string;
  /** Remote globs to copy off before the machine is destroyed. */
  save: string[];
  /** One line: which track/experiment holds it. */
  reason: string;
};

export type ExtensionModule = {
  activate: (api: ExtensionApi) => (() => void) | undefined | Promise<(() => void) | undefined>;
  /**
   * What the launcher `launchId` offers now, narrowed by what the reader has
   * typed. Called on every keystroke's worth of typing, so answer from what is
   * already in hand rather than asking the network each time.
   */
  choices?: (
    launchId: string,
    query: string,
  ) => LaunchChoice[] | LaunchBoard | Promise<LaunchChoice[] | LaunchBoard>;
  /** One item, written out: its text, its conversation, its pictures. */
  open?: (launchId: string, key: string) => LaunchItem | Promise<LaunchItem>;
  /** An item dragged into another column, by that column's `id`. */
  move?: (launchId: string, key: string, column: string) => void | Promise<void>;
  /**
   * The chosen one, as a session would start from it, with what was typed into
   * its row. `again` is true when the reader asked for it from a session that
   * was already started from this item — another one, on purpose.
   */
  launch?: (
    launchId: string,
    key: string,
    input: string,
    how: { again: boolean },
  ) => Launch | Promise<Launch>;
  /**
   * The session that launch became, once it is running — where a card learns
   * which session is its. Only for a launch the reader went through with.
   */
  launched?: (launchId: string, key: string, sessionId: string) => void | Promise<void>;
  /** The reader chose the Snooze entry `entryId` on that session; only called while its option is enabled. */
  snooze?: (entryId: string, sessionId: string) => void | Promise<void>;
  /**
   * An item from a chip's or a board card's menu, by the decoration's or the
   * card's `key`; what it returns is said to the reader. `picked` is the
   * session the reader chose, for an action with `pick: "session"`.
   */
  action?: (
    key: string,
    actionId: string,
    picked?: ActionPicked,
  ) => string | undefined | Promise<string | undefined>;
  /**
   * What one of its windows asks for: `panelId` names the manifest's panel.
   * Answered as JSON; a throw becomes a 500 whose body is `{ error }`.
   */
  panel?: (panelId: string, request: PanelRequest) => unknown;
  /**
   * What a shell on `key` is, for the panel `panelId`: asked when its page posts
   * `prifly-open-terminal` (see `panel.ts`; the page names the key, never a command).
   * Opened exactly as a decoration's `terminal` is: a program in a terminal window
   * of prifly's own, run without a shell. null, an answer that is not a title and
   * a non-empty command, or a throw: nothing opens, a warning is logged and the
   * window says "Could not open a shell on that box". Only where `api.features`
   * includes "panel-open-terminal".
   */
  terminal?: (
    panelId: string,
    key: string,
  ) =>
    | { title: string; command: string[] }
    | null
    | Promise<{ title: string; command: string[] } | null>;
};
