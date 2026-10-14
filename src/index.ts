/**
 * What an extension is given, and what it gives back — the whole contract.
 * Types only: an extension imports them with `import type`, so nothing of
 * this package is loaded when the host runs it.
 *
 * An extension is a folder with a `prifly-extension.json` manifest
 * (`ExtensionManifest`) and a TypeScript or JavaScript module the host
 * imports:
 *
 *     { "id": "vastai", "name": "Vast.ai boxes", "main": "index.ts",
 *       "description": "…", "version": "0.1.0" }
 *
 * JavaScript dependencies come from a `package.json` beside it: prifly runs
 * `bun install --production --ignore-scripts` (frozen to its `bun.lock`)
 * when it clones the extension and when an update moves it; no install
 * script runs. Python tools come from a
 * `pyproject.toml` and `uv.lock`: prifly builds the extension's `.venv`
 * before starting it.
 *
 * The module exports `activate(api)` (`ExtensionModule`), which may return a
 * function the host calls to stop it. It runs inside the host, with the
 * host's rights: enable only extensions you would run yourself.
 */

export type * from "./api";
export type * from "./connections";
export type * from "./decorations";
export type * from "./dialogs";
export type * from "./helper";
export type * from "./host-info";
export type * from "./launch";
export type * from "./manifest";
export type * from "./secrets";
export type * from "./settings";
export type * from "./state";
export type * from "./tools";
