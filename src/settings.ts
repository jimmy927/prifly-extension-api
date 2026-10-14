/**
 * The settings part of the extension contract: what a manifest's `settings`
 * declares, and the values `api.settings` and `api.onSettings` hand the
 * extension.
 */

/** A setting's value: a box, a number, a line of text, one option picked, or the options ticked. */
export type SettingValue = boolean | number | string | string[];

/** Every declared setting's value, by field id, defaults filled in. */
export type SettingValues = Readonly<Record<string, SettingValue>>;

/**
 * One field of the manifest's `settings`, drawn as a line of the extension's
 * form in the Extensions dialog. A field that does not fit this shape is
 * dropped, and the rest are kept.
 */
export type SettingField = {
  /** `^[a-zA-Z][a-zA-Z0-9_]*$`, unique in the manifest: its key in `api.settings`. */
  id: string;
  label: string;
  /** A line under the control; "" when left out. */
  description?: string;
  type: "boolean" | "number" | "string" | "choices" | "select";
  /** Fits the type; a list of options for "choices", one of the options for "select". */
  default: SettingValue;
  /**
   * For "choices": the boxes offered, any number of them ticked. For "select":
   * the entries of a dropdown, exactly one picked (the value is that string);
   * the field is dropped unless `default` is one of them.
   */
  options?: string[];
  /** For "number": its bounds; a value set outside them is moved inside. */
  min?: number;
  max?: number;
  /** The id of a boolean setting: this one is greyed out while that one is off. */
  enabledBy?: string;
};
