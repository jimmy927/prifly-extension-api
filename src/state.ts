/**
 * `api.state`: what an extension keeps for itself, in prifly's database.
 *
 * Keep state here rather than in files in the extension's folder: the folder
 * is often a git checkout of the reader's, and it does not move with
 * prifly's data — `prifly-move` copies the database to a new host, so state
 * kept here is there when the extension starts on the other side.
 *
 * Two kinds of thing, each under a name of the extension's choosing
 * (`^[A-Za-z0-9._-]{1,128}$`, its own namespace per extension):
 *
 * - **Documents**: one JSON value each, replaced whole on every write, at
 *   most 1 MB as JSON. `update` is the read-modify-write: every write to a
 *   name waits for the one before it, so two updates never lose each other's
 *   change, however long their functions take.
 * - **Logs**: append-only JSON entries for an events log, read back in
 *   order. A log keeps its newest 10,000 entries; older ones go as new ones
 *   come. Each entry is at most 64 KB as JSON. A log and a document of the
 *   same name are separate things.
 *
 * Every value must be plain JSON: a value `JSON.stringify` cannot write (a
 * function, `undefined`, a cycle) or one over the cap is refused with an
 * error that names it, and nothing is written. What comes back is a copy,
 * parsed afresh: changing it changes nothing stored.
 */

/** Added to `ExtensionApi`. Absent on an older prifly: check `api.features` for "state". */
export type ExtensionStateApi = {
  /**
   * The document `name`, or undefined when there is none. `T` is what the
   * caller says it is, unchecked; it is never guessed from where the result
   * goes (`NoInfer`), so it is `unknown` unless given.
   */
  get<T = unknown>(name: string): Promise<NoInfer<T> | undefined>;
  /** Replace the document `name` with `value`, in one write. */
  set(name: string, value: unknown): Promise<void>;
  /**
   * Read the document, give it to `fn` (undefined when there is none), and
   * store what `fn` returns; resolves to that value. Writes to the same name
   * — `set`, `update`, `delete`, `importOnce` — run one at a time, in the
   * order they were called, so a concurrent update sees the result of the
   * one before it. A throw from `fn` stores nothing and rejects with it.
   * `fn` returning undefined is refused: call `delete` to remove a document.
   * Never await a write to the same name inside `fn`: it waits for `fn`,
   * and neither ever finishes.
   */
  update<T>(name: string, fn: (current: T | undefined) => T | Promise<T>): Promise<T>;
  /** Remove the document `name`; true when there was one. */
  delete(name: string): Promise<boolean>;
  /** The names of this extension's documents, sorted. */
  list(): Promise<string[]>;
  /**
   * Bring state in from somewhere else once — the files an extension kept
   * before prifly had `api.state`. When the document `name` exists, it is
   * returned and `make` is not called. Otherwise `make`'s value is stored and
   * returned; undefined from `make` (nothing to import) stores nothing, so a
   * later start asks again. Runs in line with the name's other writes, so
   * two calls at once import once.
   */
  importOnce<T>(
    name: string,
    make: () => T | undefined | Promise<T | undefined>,
  ): Promise<T | undefined>;
  /** Add `entry` to the end of the log `name`; resolves to its `seq`. */
  append(name: string, entry: unknown): Promise<number>;
  /**
   * The log `name`'s entries, oldest first. `after` keeps those with a
   * larger `seq` (to read on from the last one seen), `since` those
   * appended at or after an epoch ms, and `limit` the newest that many of
   * what is left.
   */
  read<T = unknown>(
    name: string,
    options?: ExtensionLogRead,
  ): Promise<ExtensionLogEntry<NoInfer<T>>[]>;
};

export type ExtensionLogRead = { after?: number; since?: number; limit?: number };

export type ExtensionLogEntry<T = unknown> = {
  /** Grows with each entry appended, across all logs: compare, never count on it being dense. */
  seq: number;
  /** Epoch ms it was appended. */
  at: number;
  entry: T;
};
