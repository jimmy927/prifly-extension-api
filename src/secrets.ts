/** `api.secrets`: a small store for what an extension must keep and nobody else may read. */

/**
 * Added to `ExtensionApi`. Only where `api.features` includes "secrets"; absent
 * on an older prifly: call it as `api.secrets?.get(...)`.
 *
 * Values are text, kept per extension: another extension's keys are neither
 * readable nor listed. Each is sealed with the vault's device key before it
 * reaches the database, so the file on disk holds no plaintext. It is for
 * credentials and session state (a linked device's keys), not for bulk data:
 * a key is at most 200 characters and a value at most 1 MB, and `set` rejects
 * anything beyond. Writes are batched and committed together within a tick;
 * `get` and `keys` see them at once. After the extension stops, `get` answers
 * null, `keys` answers an empty list and `set` rejects.
 */
export type ExtensionSecretsApi = {
  /** The value under `key`, or null when there is none. */
  get(key: string): Promise<string | null>;
  /** Stores `value` under `key`; null deletes the key. Resolves once it is committed. */
  set(key: string, value: string | null): Promise<void>;
  /** Every key, or only those starting with `prefix`, sorted. */
  keys(prefix?: string): Promise<string[]>;
};
