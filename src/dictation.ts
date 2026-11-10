/**
 * Dictation for an extension: hearing each finished piece of the reader's
 * dictation ("dictation-pieces") and marking word ranges in the message box
 * they dictated into ("dictation-marks") — a pronunciation coach's
 * underlines, a grammar check's. Only for an extension whose manifest
 * declares `dictation` (`ExtensionManifest.dictation`); the piece's audio
 * only when it declares `dictation: { audio: true }`. Settings → Extensions
 * shows the reader which extensions hear their dictation, and whether with
 * the audio.
 */

import type { DecorationIcon } from "./decorations";

/** One word of a piece: where it stands in the piece's `text`, and when it was said. */
export type DictationWord = {
  /** The word as it stands in `text`, without the punctuation around it. */
  text: string;
  /** Character offsets in the piece's `text`, `start` up to `end` (exclusive). */
  start: number;
  end: number;
  /** Milliseconds into the piece's `audio`. */
  startMs: number;
  endMs: number;
};

/** A finished piece of dictation, once its words have gone to the window (`onDictationPiece`). */
export type DictationPiece = {
  /** The session whose message box the words went into. */
  sessionId: string;
  /** The dictation's id, the same for each of its pieces: what `markDictation` names. */
  dict: string;
  /** The piece's place in its dictation, from 0. */
  piece: number;
  /** Its language as it was written: "en", "sv", … */
  language: string;
  /** The piece's settled words, as the window was sent them. */
  text: string;
  /**
   * Its words with their places in `text` and their times. Parakeet's pieces
   * carry them; Whisper's (a language Parakeet does not write) may have
   * none: `[]`. A word the host respelled after decoding ("pry fly" →
   * "Prifly") has no time and is not among them.
   */
  words: DictationWord[];
  /**
   * The piece's audio, 16 kHz mono, -1 to 1, with the padding the speech
   * model was given around it: only when the manifest declares
   * `dictation: { audio: true }`. The extension's own copy; prifly keeps no
   * audio for it after the dictation — keep it yourself for a correction.
   */
  audio?: Float32Array;
};

/**
 * The reader replaced a dictated word in the box with another before
 * sending (`onDictationCorrection`): `heard`, as piece `piece` of `dict`
 * wrote it, is now `word`, which stands in the box from `start` to `end`.
 * Mark it with `markDictation({ …, at: start, marks: [{ start: 0, end:
 * word.length, … }] })`.
 */
export type DictationCorrection = {
  sessionId: string;
  dict: string;
  piece: number;
  heard: string;
  word: string;
  /** Character offsets in the message box's text, as it was when the correction was sent. */
  start: number;
  end: number;
};

/** A button on a mark's hint line; the reader's click reaches `onDictationMarkAction`. */
export type DictationMarkAction = {
  /** Unique among the mark's actions. */
  id: string;
  /** One or two words: "Not a mistake". */
  label: string;
  icon?: DecorationIcon;
};

/**
 * A word range the window underlines, wavy, in the message box. With the
 * caret in it the line under the box reads `label` in bold, then `detail`,
 * with Listen (the window's own: the marked word read aloud) and the mark's
 * `actions`.
 */
export type DictationMark = {
  /** Character offsets in the piece's `text` — or, with `at`, from `at` in the box. */
  start: number;
  end: number;
  /** The bold start of the hint line: the word, as a rule. At most 64 characters. */
  label: string;
  /** The rest of the hint line: "heard /tɹiː/, the word is /θɹiː/ · th → t". At most 300. */
  detail: string;
  /** At most 4. */
  actions?: DictationMarkAction[];
};

/** `markDictation`'s argument: the marks for piece `piece` of dictation `dict` in `sessionId`'s box. */
export type DictationMarks = {
  sessionId: string;
  dict: string;
  piece: number;
  /**
   * An offset in the box (a `DictationCorrection`'s `start`): the marks
   * count from it rather than from the piece's start, and replace only the
   * marks this extension gave the piece with the same `at`.
   */
  at?: number;
  /** At most 200. `[]` takes the piece's marks away. */
  marks: DictationMark[];
};

/** The reader clicked one of a mark's actions (`onDictationMarkAction`). */
export type DictationMarkClick = {
  sessionId: string;
  dict: string;
  piece: number;
  /** The mark's `start` and `end` as the extension gave them, with the `at` it gave them with. */
  markStart: number;
  markEnd: number;
  at?: number;
  /** The action's `id`. */
  action: string;
};

/**
 * The dictation part of `ExtensionApi`. Each `on…` takes one handler; a
 * second call replaces it. A handler is called after the window has the
 * words, never delaying dictation; what it throws goes to the host's log.
 */
export type ExtensionDictationApi = {
  /**
   * Hear each finished piece of the reader's dictation, in any session.
   * Where `api.features` includes "dictation-pieces" and the manifest
   * declares `dictation`.
   */
  onDictationPiece?(handler: (piece: DictationPiece) => void | Promise<void>): void;
  /**
   * Hear the reader replace a dictated word in the box before sending, a
   * moment after their typing pauses, so the word can be judged again.
   * Where `api.features` includes "dictation-pieces" and the manifest
   * declares `dictation`.
   */
  onDictationCorrection?(handler: (correction: DictationCorrection) => void | Promise<void>): void;
  /**
   * Replace this extension's marks for a piece (or, with `at`, those it
   * gave the piece with that `at`). A mark whose words the reader edits
   * goes by itself; any other stays until the piece is marked again, the
   * message is sent, or the extension stops. Throws on a spec that does not
   * read. Where `api.features` includes "dictation-marks" and the manifest
   * declares `dictation`.
   */
  markDictation?(marks: DictationMarks): void;
  /** Hear the reader click one of this extension's mark actions. Where `markDictation` is. */
  onDictationMarkAction?(handler: (click: DictationMarkClick) => void | Promise<void>): void;
};
