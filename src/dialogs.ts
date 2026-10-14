/** `api.dialog`, `api.confirm` and the pick card an extension tool shows (`ctx.pick`). */

/** What `api.dialog` shows: see there. */
export type DialogSpec = {
  sessionId?: string;
  title: string;
  description?: string;
  text: string;
  rows?: number;
  hint?: string;
  resetTo?: string;
  confirm: string;
  checkbox?: DialogCheckbox;
  /** Number fields in one row in place of the textarea (`text` is then unused). */
  numbers?: DialogNumber[];
};
export type DialogCheckbox = { label: string; checked?: boolean };
export type DialogNumber = {
  key: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
};
/** A dialog with a checkbox, confirmed. */
export type DialogAnswer = { text: string; checked: boolean };
/** A dialog with number fields, confirmed: each value by its `key`, clamped to its min/max. */
export type DialogNumbersAnswer = DialogAnswer & { numbers: Record<string, number> };

/** What `api.confirm` shows: see there. */
export type ConfirmSpec = {
  /** What the write is, in a few words: "Send an email". */
  title: string;
  /** What will happen, in a line or two, shown large: "Send \"Lunch?\" to ada@example.com". */
  summary: string;
  /**
   * Exactly what goes out — the text, the recipients, a diff, the API
   * request — shown as written in a scrollable monospace block.
   */
  details: string;
  /**
   * The session to ask over, as for `DialogSpec`. Left out, the session whose
   * tool call is running: what a tool's write wants.
   */
  sessionId?: string;
};

/** What `api.pair` shows: a dialog for linking a device by QR code or typed code. */
export type PairSpec = {
  /** The session the dialog opens over, as for `DialogSpec`. */
  sessionId?: string;
  title: string;
  description?: string;
  /** A line under the steps. */
  hint?: string;
  /** What to do on the phone to scan the QR code, one step a line. */
  steps: string[];
  /** The same for typing a code; `steps` are shown when left out. */
  codeSteps?: string[];
  /** Whether the "Type a code" tab asks for the phone number, handing it to `PairHandle.phones`. */
  askPhone: boolean;
  /** The label of that number field. */
  phoneLabel?: string;
};

/** What `PairHandle.update` changes; a field left out keeps its value. */
export type PairUpdate = {
  /**
   * The QR payload. It is drawn in the window and sent nowhere else; null
   * shows a spinner in its place (none yet, or being renewed).
   */
  qr?: string | null;
  /** The code the reader types on the phone; null clears it. */
  code?: string | null;
  /** The line beside the spinner or tick: "Waiting for your phone". */
  status?: string;
  /** Linked: the spinner becomes a tick and Cancel becomes Close. */
  linked?: boolean;
};

/**
 * An open pairing dialog. It stays open until the extension calls `close` or
 * the reader cancels or closes it; a stopped extension's dialogs are closed
 * by prifly.
 */
export type PairHandle = {
  update(next: PairUpdate): void;
  /** Closes the dialog in every window; `closed` then resolves "closed". */
  close(): void;
  /** Each phone number the reader submits in the code tab, as typed. Ends when the dialog does. */
  phones: AsyncIterable<string>;
  /**
   * How it ended: "cancelled" when the reader cancelled it (or prifly closed
   * it because the extension stopped) before it was linked; "closed" when
   * `close` was called, or the reader pressed Close after `linked`.
   */
  closed: Promise<"cancelled" | "closed">;
};

/** An amount the reader confirms with the row (a rental's budget). */
export type PickAmount = {
  /** "Budget for this rental" */
  label: string;
  /** "$" */
  prefix: string;
  /** The session's suggestion; the reader may change it. */
  value: number;
  /** One line under the field: how the suggestion was made, what it means. */
  hint: string;
  /**
   * Recompute one column from the amount as the reader types: each row's
   * `column` cell becomes `amount / Number(row[rateColumn])` with `unit`,
   * and its header "Hours in <prefix><amount>".
   */
  perRow?: { column: string; rateColumn: string; unit: string };
  /**
   * A soft limit on the amount. Only where `api.features` includes
   * "pick-amount-limit": an older prifly refuses the unknown field.
   */
  limit?: {
    /** The largest amount within the limit. */
    max: number;
    /** A line always shown under the hint (the credit breakdown). */
    text: string;
    /** The warning shown once the typed amount is above `max`. */
    over: string;
    /** The label of the checkbox the reader must tick to go past `max`. */
    ack: string;
  };
};

/** What an extension tool asks the reader: prifly's pick card, optionally with an amount. */
export type ExtensionPick = {
  title: string;
  columns: string[];
  rows: string[][];
  /**
   * One URL or null per cell, shaped like `rows`; a cell with a URL is drawn as
   * a link. Only where `api.features` includes "pick-links": an older prifly
   * refuses the unknown field.
   */
  links?: (string | null)[][];
  /** Hover text per cell, shaped like `rows`. Only where `api.features` includes "pick-cells". */
  titles?: (string | null)[][];
  /**
   * How each cell is drawn, shaped like `rows`: "flag" (the text is an ISO 3166-1
   * alpha-2 code), "link-icon" (an icon opening the cell's link), null for text.
   * Only where `api.features` includes "pick-cells".
   */
  cellKinds?: ("flag" | "link-icon" | null)[][];
  /** The button's word, default "Choose". */
  action?: string;
  amount?: PickAmount;
};

/** The reader's answer: the row and, when the pick had one, the amount they confirmed. Null: none of these. */
export type ExtensionPickAnswer = { row: number; amount: number | null } | null;
