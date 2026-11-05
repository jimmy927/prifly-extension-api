/**
 * `api.llm`: ask a model without holding any key. The host answers through
 * whatever the reader has set up — a Claude login, a Codex login, or a saved
 * model provider — on the backend and model the reader maps to the tier asked
 * for (Settings → Models). The extension never sees a key.
 *
 * Only for an extension whose manifest declares `llm` (`ExtensionManifest`),
 * only on the tiers it lists there, and only once the reader has approved it:
 * the first ask shows a card naming the extension, its tiers and its `why`,
 * and waits for the answer. A refusal holds until the reader changes it in
 * Settings. At most one ask of an extension's runs at a time, and 60 in a
 * rolling hour.
 */

/** How much model the ask needs: fast (a small model), balanced, strong. */
export type LlmTier = "fast" | "balanced" | "strong";

export type LlmRequest = {
  tier: LlmTier;
  system: string;
  prompt: string;
  /** JSON Schema the answer must follow: `text` is then that JSON. */
  schema?: Record<string, unknown>;
  maxTokens?: number;
};

/**
 * The model's text, the model and the backend that wrote it; or why there is
 * none. `reason` is one short sentence for a person, e.g. "No model is set for
 * the fast tier: choose one in Settings, Models." `no-model`: nothing is set up
 * for the tier. `not-allowed`: the manifest does not list the tier, or the
 * reader refused. `capped`: another ask is running, or the hour's 60 are used.
 * `failed`: the backend failed or took too long (fast 60 s, balanced 120 s,
 * strong 300 s).
 */
export type LlmAnswer =
  | { ok: true; text: string; model: string; backend: "claude" | "codex" | "provider" }
  | { ok: false; code: "no-model" | "not-allowed" | "capped" | "failed"; reason: string };

/** Added to `ExtensionApi` where `api.features` includes "llm-ask": call it as `api.llm?.ask(...)`. */
export type ExtensionLlmApi = {
  ask(request: LlmRequest): Promise<LlmAnswer>;
};
