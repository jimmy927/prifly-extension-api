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
   * The human part — the mail text, the message, the lines that will be
   * inserted — shown under the summary in normal text, whitespace kept,
   * scrollable when long. Left out or empty, no box is drawn.
   */
  content?: string;
  /**
   * The technical part — ids, the API request — shown as written in a
   * monospace block folded under a "Details" toggle, closed until the reader
   * opens it.
   */
  details: string;
  /**
   * A mail the write sends or saves, drawn as the recipient will see it — the
   * subject, the sender and recipients, the HTML body with its inline
   * pictures, the attachments — in place of `content`. A prifly that predates
   * it shows `content` and `details` only, so keep them filled.
   */
  mail?: ConfirmMail;
  /**
   * A document edit drawn as the document will read afterwards, in place of
   * `content`: the paragraphs it changes with their neighbours, unchanged runs
   * folded. A prifly that predates it shows `content` and `details` only, so
   * keep them filled. Where `api.features` includes "confirm-doc".
   */
  doc?: ConfirmDoc;
  /**
   * Calendar events to add or delete, drawn as an agenda — a bordered list,
   * the day on its first row, the time, the title with its place and repeat
   * text — in place of `content`. When both `content` and `events` are given
   * the card draws `events` and ignores `content`; `content` is what a prifly
   * that predates it shows, so keep it filled. Where `api.features` includes
   * "confirm-events".
   */
  events?: ConfirmEvents;
  /**
   * The pictures the write sends — a file going out on a messenger — drawn above
   * `content` so the reader sees what goes out: png, jpeg, gif or webp. Ignored on
   * a card with `mail`. A prifly that predates it shows `content` and `details` only.
   */
  images?: ConfirmImage[];
  /**
   * Pages drawn as tabs on the card beside its content: each a self-contained
   * HTML document (inline CSS, images as data: URIs), shown sandboxed with no
   * scripts. The editable content (`confirmEdit`) or plain content is its own
   * tab, labelled `contentLabel`, default "Text". The first preview is shown
   * first. At most 6, each at most 4 MB; any beyond is dropped with a log line,
   * never the card. Not on a mail card. Where `api.features` includes
   * "confirm-previews".
   */
  previews?: { label: string; html: string }[];
  /** The content tab's label when there are `previews`: "Edit text". Default "Text". */
  contentLabel?: string;
  /**
   * The session to ask over, as for `DialogSpec`. Left out, the session whose
   * tool call is running: what a tool's write wants.
   */
  sessionId?: string;
};

/** What `api.askSnooze` asks the reader: see there. */
export type AskSnoozeSpec = {
  /** What the session waits for, the Snoozed list's line: "Until 2f03e1a4 is live, then 1 day". */
  label: string;
  /** What the session is told on waking, shown on the card; left out, no such line. */
  wake?: string;
  /**
   * When it wakes at the latest, epoch ms: the reader may change it on the card.
   * At most 7 days from now (a later one is cut to 7 days), at least a minute;
   * left out, 3 days.
   */
  until?: number;
};

/**
 * The reader's answer to `api.askSnooze`. `until` is the end they confirmed
 * (epoch ms) and `edited` whether they changed it from the one asked. Not ok:
 * `reason` is "cancelled" for a plain no, "gone" when the session or the
 * extension went away while the card was open, "replaced" when a later ask
 * for the same session took the card's place, "refused" for a spec that
 * cannot be asked over, else the note the reader wrote on the
 * card instead of a yes.
 */
export type AskSnoozeAnswer =
  | { ok: true; until: number; edited: boolean }
  | { ok: false; reason: string };

/** A document edit on a confirm card: see `ConfirmSpec.doc`. */
export type ConfirmDoc = {
  /** One line over the redline: "9 changes: 8 paragraphs added, 1 removed, 4 words replaced". */
  counts: string;
  blocks: ConfirmDocBlock[];
};
/** A paragraph, or a run of unchanged ones drawn folded as "N unchanged paragraphs" that opens on click. */
export type ConfirmDocBlock = ConfirmDocParagraph | { unchanged: ConfirmDocParagraph[] };
export type ConfirmDocParagraph = {
  style: "title" | "subtitle" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "normal";
  bullet?: boolean;
  spans: ConfirmDocSpan[];
  /** The whole paragraph is new, or goes. */
  change?: "added" | "removed";
  /** A format change, shown as a small tag beside it: "Heading 1 → Heading 2". */
  note?: string;
};
export type ConfirmDocSpan = { text: string; mark?: "added" | "removed" };

/** Calendar events on a confirm card: see `ConfirmSpec.events`. */
export type ConfirmEvents = {
  /** "delete" draws the titles struck through. */
  action: "add" | "delete";
  /** One entry per day, its label as written ("Sun 8 Nov", "Sat 21 – Sun 22 Nov"). */
  days: {
    day: string;
    events: {
      /** As written: "17:50–19:15", "All day". */
      time: string;
      title: string;
      where?: string;
      /** "Every Sunday". */
      repeats?: string;
      /** On a delete, the whole recurring series goes: drawn as a "Whole series" badge. */
      series?: boolean;
    }[];
  }[];
};

/** A picture on a confirm card: see `ConfirmSpec.images`. */
export type ConfirmImage = { mimeType: string; bytes: Uint8Array; name?: string };

/** A mail on a confirm card: see `ConfirmSpec.mail`. */
export type ConfirmMail = {
  /** "Ada Lovelace <ada@example.com>", or left out for the signed-in account. */
  from?: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  /** Marked as a draft, as Gmail shows one in its thread. */
  draft?: boolean;
  /** The plain text: drawn when there is no `html`. */
  text: string;
  /**
   * The HTML part as it goes out. `cid:` references resolve to `images` by
   * `id`; nothing else is loaded (no remote images, no scripts).
   */
  html?: string;
  /** The inline pictures `html` names by `cid:`: png, jpeg, gif or webp. */
  images?: ConfirmMailImage[];
  attachments?: ConfirmMailFile[];
};
export type ConfirmMailImage = {
  id: string;
  mimeType: string;
  bytes: Uint8Array;
  /** The marker name the text uses for it, `[image: name]`: its caption, and where that marker places it. */
  name?: string;
};
export type ConfirmMailFile = {
  filename: string;
  mimeType: string;
  size: number;
  /**
   * The file as it goes out. Given, its tile on the card opens it in the
   * system's default app, so the reader can look before confirming; left
   * out, the tile only names it.
   */
  bytes?: Uint8Array;
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
