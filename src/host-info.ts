/** What the host tells an extension about itself: cloud sessions, accounts, sessions, machines. */

import type { DecorationAction, DecorationTone } from "./decorations";

/** A cloud session of one of the Claude accounts connected to prifly. */
export type CloudSessionInfo = {
  id: string;
  /** The account that created it, and the only one that can read it back. */
  account: string;
  title: string;
  /** The repository its sandbox cloned, `https://github.com/o/r`, or "". */
  repo: string;
  model: string;
  /** Epoch ms. */
  createdAt: number;
  updatedAt: number;
};

/** The sessions on Anthropic's side, for an extension that reports on them. */
export type ExtensionCloud = {
  /** Every cloud session of every connected account; an account that cannot be read is left out. */
  sessions(): Promise<CloudSessionInfo[]>;
  /**
   * A cloud session's transcript: Claude Code's own stored lines, the same
   * shape as a local `~/.claude/projects` JSONL file's, oldest first.
   */
  transcript(account: string, sessionId: string): Promise<unknown[]>;
};

/** One plan limit of an account, as prifly's usage poller last read it. */
export type AccountLimitInfo = {
  /** The statusline's name: "5h" (5-hour session), "7d" (weekly, all models), "7F" … (weekly, one model). */
  label: string;
  /** "5-hour session", "Weekly, all models", "Weekly, Fable only". */
  title: string;
  /** Of the limit spent, 0–100 (can exceed 100). */
  usedPercent: number;
  /** When the window reopens, epoch ms; null when unknown. */
  resetsAt: number | null;
  /** The window's length in ms. */
  windowMs: number;
};

/**
 * The "Reset for free" offer (claude.ai Settings → Usage): free weekly-limit
 * resets on top of the plan. `left` sums every live grant's `resets_left`;
 * `usableNow`/`endsAt` are the soonest-expiring one's.
 */
export type AccountFreeReset = {
  left: number;
  usableNow: boolean;
  /** Epoch ms. */
  endsAt: number;
};

/** A Claude account prifly holds, with its limits. */
export type AccountInfo = {
  /** The login's email — stable across local and cloud, what readings are keyed by. */
  email: string;
  /** What the reader calls it; the email when they named it nothing. */
  label: string;
  /** New local sessions start on this account (the "new sessions" star in the accounts UI). */
  startsNewSessions: boolean;
  /** When its limits were last read successfully, epoch ms; null before the first good read. */
  readAt: number | null;
  /** Its limits as of `readAt`; [] before the first good read. */
  limits: AccountLimitInfo[];
  /** Its free resets as of `readAt`; null with none, or not read yet. */
  freeResets: AccountFreeReset | null;
};

/**
 * Where one app of a session's App tab is: `starting` (building, spawned, or
 * waiting for its port), `running` (ready), `failed` (it did not come up, or
 * ended on its own), `stopped` (the reader stopped it). Closed: the app board's
 * own states (`AppState` in `@prifly/wire`), which these must match.
 */
export type ExtensionAppState = "starting" | "running" | "failed" | "stopped";

/** One app of a session's App tab that prifly has a run of. */
export type ExtensionSessionApp = {
  /** Its id in the project's `.prifly/run.md`: "odi-prod". */
  id: string;
  state: ExtensionAppState;
};

/** A session the host knows, for an extension to match its things against. */
export type ExtensionSession = {
  id: string;
  title: string;
  cwd: string;
  state: string;
  /**
   * The machine its checkout is on, for `api.git`, when that machine's agent
   * runs git there (a WSL distro under a host on Windows); null or absent
   * for here. Where `api.features` includes "git-there".
   */
  machine?: string | null;
  /**
   * The apps of its App tab that have a run, in the order they were started,
   * with their states: `[{ id: "odi-prod", state: "running" }]`. [] for a
   * session with none; absent on an older one `api.session` finds in the
   * history index. A change reaches `api.onSessionApps`. Where `api.features` includes
   * "session-apps"; absent on a prifly that predates it.
   */
  apps?: ExtensionSessionApp[];
  /**
   * The session's own status lists as its brief holds them (each status block
   * and fold merged into it; not its children's):
   * what is done (the texts), what is next, what is blocked, and what is
   * blocked on the reader. Absent when it has no brief. Where `api.features`
   * includes "session-facts".
   */
  brief?: { done: string[]; next: string[]; blocked: string[]; blockedOnYou: string[] };
  /** The repository its checkout's card names ("jimmy927/prifly"); absent without a card. "session-facts". */
  repo?: string;
  /** The branch its checkout is on, from the same card; absent without one. "session-facts". */
  branch?: string;
  /**
   * The 8-character ids of other sessions it waits on, read from the machines
   * its busy facts name ("land-to-master-child-zone (b0914ada) building …").
   * Absent when it waits on none. "session-facts".
   */
  waitsOn?: string[];
  /** True while it asks the reader something (a card above the composer); absent otherwise. "session-facts". */
  asksYou?: boolean;
  /** When a snooze on it ends, as an ISO time; absent when it is not snoozed. "session-facts". */
  snoozedUntil?: string;
  /** The full id of the session that started it; absent for one nothing started. "session-facts". */
  parentId?: string;
  /** True when the reader archived the session; absent otherwise. Archived sessions stay in the list. "session-facts". */
  archived?: boolean;
};

/**
 * One machine an extension offers sessions to use — a rented Vast.ai box —
 * keyed within the extension the way a `Decoration` is. `os`/`arch`/`access`/
 * `notes`/`trust`/`capabilities`/`ownerSession` left out take `Machine`'s own
 * defaults (see `@prifly/wire`): `os` "other", `trust` "ask-first".
 */
export type ExtensionMachine = {
  key: string;
  kind?: "machine" | "provider" | "service";
  label: string;
  os?: string;
  arch?: string;
  /** The argv that runs a command there: `["ssh","root@1.2.3.4","-p","2222"]`. */
  exec?: string[];
  /**
   * Every way to reach it, tried in order: a Vast box's direct address, then
   * its ssh proxy. The host uses the one that answered last first, and moves
   * to the next when one does not connect. `exec` should be the first route's
   * argv; left out, `exec` is the one route.
   */
  routes?: { label?: string; exec: string[] }[];
  access?: string;
  trust?: "ask-first" | "use-freely";
  notes?: string;
  capabilities?: {
    name: string;
    state?: "present" | "absent" | "unknown";
    version?: string;
    detail?: string;
    probe?: string;
  }[];
  /** The session (or its first 8 characters) that rented or owns it, for whom it is use-freely. */
  ownerSession?: string;
  /** A line under the machine's name: "jimmy · leased until 14:30 · 1h 40m left". */
  status?: { text: string; tone?: DecorationTone };
  /**
   * The card's ▾ menu. Choosing one calls the extension's action handler
   * (`api.onAction` / the module's `action` export) with this machine's `key`
   * and the action's id, after asking `confirm` when it is not "".
   */
  actions?: DecorationAction[];
  /**
   * What the host may set up there by itself, over the machine's routes:
   * "claude-code" lets the reader start a session on it from the New session
   * dialog before Claude Code is there — the host installs it, records the
   * capability and signs it in first. Where `api.features` includes
   * "rent-from-dialog".
   */
  setup?: "claude-code";
  /**
   * On a `kind: "provider"` machine: the New session dialog offers a "Rent a
   * <label> box…" row for the kinds of box `needs` names, and the host calls
   * the `api.onRent` handler when the reader starts one. Where `api.features`
   * includes "rent-from-dialog".
   */
  rent?: { needs: readonly ("cpu" | "gpu")[] };
};
