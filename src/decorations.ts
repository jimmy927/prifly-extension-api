/** What an extension shows: chips, launcher glows, Snooze entries. */

export type DecorationTone = "good" | "warning" | "critical" | "info" | "muted";

/** A launcher button's glow: its colour, and a line for its hover ("3 open errors"). */
export type LauncherFlag = { tone: DecorationTone; hint?: string };

/** One of the icons the window has: see `DECORATION_ICONS` in `@prifly/wire`. */
export type DecorationIcon =
  | "server"
  | "cpu"
  | "gpu"
  | "hard-drive"
  | "cloud"
  | "box"
  | "zap"
  | "activity"
  | "dollar"
  | "clock"
  | "alert"
  | "check"
  | "link"
  | "chart"
  | "bug"
  | "bug-off"
  | "trello"
  | "sentry"
  | "life-buoy"
  | "artemis"
  | "mail"
  | "file-text"
  | "linkedin"
  | "message-circle"
  | "instagram"
  | "gmail"
  | "google-docs"
  | "google-photos"
  | "google-cloud"
  | "outlook"
  | "azure"
  | "aws"
  | "whatsapp"
  | "messenger"
  | "dot";

/**
 * One item in a chip's or a machine card's menu: "Move to Doing" on a Trello
 * card, "Destroy box…" on a Vast.ai one.
 */
export type DecorationAction = {
  id: string;
  /** The menu's words: "Destroy box…". */
  label: string;
  /** Asked before it runs: what it will do and what is lost. */
  confirm?: string | undefined;
  /** Drawn in the danger colour. */
  destructive?: boolean | undefined;
  /**
   * Shown greyed out and not choosable: it does not apply now. Send it
   * disabled rather than leaving it out, so the menu's items keep their place.
   */
  disabled?: boolean | undefined;
  /**
   * What the reader picks before it runs. `"session"` opens prifly's session
   * picker — every session, ended and archived ones too, searchable by title,
   * folder, branch and id, most recent first — and the action handler is
   * called with the chosen one as its third argument, `{ sessionId }`.
   * Cancelling the picker calls nothing. Left out, the action runs as chosen.
   */
  pick?: "session" | undefined;
  /**
   * Offer the action in prifly's archive dialog, when the item's session is
   * archived. `kind: "choice"` is one of the item's radio options beside
   * "Leave in <place>" — the column a card moves to on archive. `kind:
   * "turn"` is a checkbox under them, its `confirm` the line under it: an
   * action that prompts the session once more (`api.prompt(sessionId, …)`,
   * which resumes an ended one) — "Post a summary of this session on the
   * card" — and, ticked, prifly archives the session only once that turn is
   * over. `first: true` makes a choice the one picked at first (instead of
   * leaving the item), or ticks a turn at first. Only where `api.features`
   * includes "archive-follow-ups": an older prifly refuses the unknown field,
   * and offers only actions with the id `resolve` or `move:…`, as choices.
   */
  archive?: { kind: "choice" | "turn"; first?: boolean | undefined } | undefined;
};

/** What the reader picked for an action with `pick` set; see `DecorationAction.pick`. */
export type ActionPicked = { sessionId: string };

export type Decoration = {
  /** Stable within the extension, so the window keeps an item's place. */
  key: string;
  icon: DecorationIcon;
  /** A few words: "lc-box1 $0.42/h". */
  label: string;
  tone: DecorationTone;
  /** Shown on hover, one line each. */
  details: string[];
  /**
   * What a click on the item opens: a program in a terminal window of
   * prifly's own — `ssh` to a Vast.ai box. Run without a shell, as the reader.
   */
  terminal?: { title: string; command: string[] } | undefined;
  /** Where clicking the chip leads, in the reader's browser; left out, nowhere. */
  url?: string;
  /**
   * The item's menu, from its ▾ and from a right-click. Choosing one calls
   * the module's `action` export, or the handler given to `api.onAction`,
   * with the item's key and the action's id — after asking the reader
   * `confirm`, when it is not "".
   */
  actions?: DecorationAction[] | undefined;
  /**
   * Which of the extension's launchers can show this item whole by its `key`
   * (the module's `open`): a click on the chip then opens it inside prifly and
   * `url` moves to the chip's menu. Left out, the host picks the extension's
   * only launcher when it has one and `open` exists; name it only when there
   * are several.
   */
  launcher?: string | undefined;
  /**
   * The `id` of one of this extension's own panels (manifest `panels`) that
   * the item is the state of. Only for the `statusBar` items of `show`: the
   * status bar then draws no chip, but that panel's button, its icon coloured
   * by `tone`, its hover holding `label` and `details` (under the panel's
   * description), and a click that opens the panel as before. `icon`, `url`,
   * `terminal` and `actions` are not shown then. An id naming no panel of the
   * extension is shown as an ordinary chip, with a warning in the log; on an
   * item of a session's `bySession` the field changes nothing.
   */
  panel?: string | undefined;
  /**
   * Where the item stands now — the column a Trello card is in, "In
   * Progress". The archive dialog names it beside the item ("in In
   * Progress") and its leave option reads "Leave in In Progress". Left out,
   * neither is said. Only where `api.features` includes "archive-follow-ups".
   */
  place?: string | undefined;
};

/**
 * What the extension says about one of its Snooze entries (manifest `snooze`)
 * on one session: `enabled` false greys it out; `detail` is the muted text on
 * its right — a short commit when choosable, the reason when not.
 */
export type SnoozeOption = { id: string; enabled: boolean; detail: string };
