/** Landing the reader in a session from their own click: `api.openSession` and `api.startSession`. */

/** What `api.startSession` starts: an ordinary session, as the reader's New session would. */
export type PlainStart = {
  /** Its first message, sent as the reader's own words. */
  prompt: string;
  /** The folder it runs in: an absolute path on prifly's host, one the reader has used in prifly. */
  cwd: string;
  /** Its name in the sidebar; left out, prifly names it from the prompt as it names any session. */
  title?: string | undefined;
};

/** The session `api.startSession` started, by its full id. */
export type PlainStarted = { sessionId: string };

/**
 * Both only inside a handler for the reader's own click: an item's `click`
 * (`Decoration.click`), `onAction` or the module's `action` export, its
 * `snooze` export. Anywhere else — a timer, `activate`, a panel's request —
 * they throw, saying so: the window never switches sessions, and no session
 * starts, with nobody having clicked.
 */
export type ExtensionSessionStartApi = {
  /**
   * Bring the session forward in the main window, as a panel page's
   * `prifly-open-session` does: the window that was clicked shows it, as a
   * click on its sidebar row would. `sessionId` is a session's id or any
   * unique start of one. Throws on an id no session has (or that several
   * share), outside a reader's click, and on a prifly that cannot. Where
   * `api.features` includes "open-session".
   */
  openSession?(sessionId: string): void;
  /**
   * Start an ordinary session in `cwd` — not Research, no worktree, in the
   * reader's default permission mode capped by the repository's, as New
   * session in that folder starts one — send `prompt` as its first message,
   * name it `title` when given, and show it in the window that was clicked.
   * Resolves with its id once it runs. Rejects with why it did not start: a
   * `cwd` that does not exist, is a file, or is not a folder the reader has
   * used in prifly; an empty `prompt`; a call outside a reader's click. Where
   * `api.features` includes "start-session-plain".
   */
  startSession?(spec: PlainStart): Promise<PlainStarted>;
};
