/** What a launcher offers and opens: choices, boards, items, and the launch a session starts from. */

import type { DecorationAction, DecorationTone } from "./decorations";

/** A column of a board, in the order the board has them. */
export type LaunchColumn = { id: string; name: string };

/** The colours a label may wear; see `LABEL_COLOURS` in `@prifly/wire`. */
export type LabelColour =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "grey";

/** What an item says about itself at a glance. */
export type LaunchBadges = {
  comments?: number;
  attachments?: number;
  checklistDone?: number;
  checklistTotal?: number;
  /** A date written as the extension would have it read — "24 Sep" — or "". */
  due?: string;
  dueDone?: boolean;
  dueLate?: boolean;
};

/** How often it happened over one period, as bars, oldest first. */
export type LaunchSpark = {
  /** Its name on the board's period switch: "1h", "24h", "7d". */
  period: string;
  counts: number[];
  /** Everything in the period, for the words beside the bars. */
  total?: number;
};

/** One thing a launcher can start a session from: a card, an issue, a ticket. */
export type LaunchChoice = {
  /** The extension's own name for it; handed back when the reader picks it. */
  key: string;
  title: string;
  /** What it is filed under, drawn as a column: a board's list. */
  group?: string;
  /** A line under the title: who is on it, when it is due. */
  detail?: string;
  /** Where it comes from, in code type, right under the title: a culprit. */
  sub?: string;
  /** How often it happened, one per period; the board switches between them. */
  sparks?: LaunchSpark[];
  tone?: DecorationTone;
  /** Picking it asks this first; what is typed reaches `launch` as `input`. */
  input?: { title: string; placeholder?: string };
  /** Where it lives, for the reader's own browser. */
  url?: string;
  /** Label colours, drawn as stripes across the top of the card. */
  stripes?: LabelColour[];
  /** What its right-click menu offers; answered by this module's `action`. */
  actions?: DecorationAction[];
  /** Who is on it; the window draws initials. */
  people?: string[];
  badges?: LaunchBadges;
  /** A session was already started from it; the board tints the card. */
  started?: boolean;
};

/**
 * What a launcher offers, as a board: the columns, and the items in them.
 * An extension that answers with a plain array has no columns, and the window
 * draws a list — which is what a launcher still being set up should give.
 * Only a board gets the filter field over it: a list of log-in steps has
 * nothing in it to search.
 */
export type LaunchBoard = {
  columns: LaunchColumn[];
  items: LaunchChoice[];
  /** Things to do to the launcher itself: "Switch board…", "Log out". */
  actions?: LaunchChoice[];
};

/** A file on an item: a picture to look at, or something to fetch elsewhere. */
export type LaunchItemFile = {
  /** This extension's own name for it, so two files called image.png are two. */
  id?: string;
  name: string;
  url?: string;
  /** The picture itself, as a `data:` URI, when it could be fetched. */
  data?: string;
  at?: string;
};

/** One thing somebody said on an item, oldest first. Markdown. */
export type LaunchItemNote = { by: string; at?: string; text: string };

/**
 * One item, read whole.
 *
 * The prose is Markdown; what is not prose — where it sits, who is on it,
 * what is attached, what has been said — is kept apart, so the window can lay
 * a ticket out as a ticket rather than as a page of text.
 */
export type LaunchItem = {
  title: string;
  url?: string;
  /** The column it sits in now, by id, and what that column is called. */
  column?: string;
  columnName?: string;
  labels?: { colour: LabelColour; name: string }[];
  people?: string[];
  due?: string;
  dueLate?: boolean;
  /** The description. */
  markdown: string;
  /** Checklists, as `- [x]` task lists under their own headings. */
  checklists?: string;
  files?: LaunchItemFile[];
  notes?: LaunchItemNote[];
};

/**
 * What a chosen thing becomes: the New session form, filled in — or, with an
 * empty prompt, nothing at all. An empty one leaves the chooser open, says
 * `message` and lists again, which is how a row can log the reader in or
 * choose which board to show instead of starting a session.
 */
export type Launch = {
  /** The session's first prompt — everything it needs to start. */
  prompt: string;
  /** Where to work; left out, the reader chooses as usual. */
  cwd?: string;
  /** A suggested name for the session and its worktree. */
  name?: string;
  /** A line for the chooser, whether or not a session follows. */
  message?: string;
  /**
   * Pictures for the session's opening message — the screenshots on the card,
   * carried into the first turn rather than left as paths to open. png, jpeg,
   * gif or webp, base64, at most twenty.
   */
  images?: { mediaType: "image/png" | "image/jpeg" | "image/gif" | "image/webp"; data: string }[];
};

/** How `api.start` went: the session it made, or why none was. */
export type StartAnswer = { started: true; sessionId: string } | { started: false; reason: string };

/**
 * A request from one of the extension's own windows (`panels` in the
 * manifest): the page fetched `api/<path>` beside itself. `query` is the
 * URL's query; `body` a POST's JSON, or null.
 */
export type PanelRequest = {
  path: string;
  query: Record<string, string>;
  body: unknown;
};
