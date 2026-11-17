# @prifly/extension-api

The TypeScript types for writing a prifly extension: the
`prifly-extension.json` manifest, the `api` object your `activate(api)`
function receives, and what your module may export.

The package contains types only. You import it with `import type`, so none
of it is loaded at run time: prifly's host passes in the real `api`.

## Install

The package is not on npm. Add it as a dev dependency that points at a tag
of its mirror repository. A plain `bun install` (or npm or pnpm) fetches it,
with no GitHub login or ssh key:

```json
{
  "devDependencies": {
    "@prifly/extension-api": "github:jimmy927/prifly-extension-api#v0.18.1"
  }
}
```

Each version is a `v<version>` tag. To upgrade, change the tag.

## A minimal extension

An extension is a folder with a manifest and a module. This one serves
sessions a single MCP tool that writes, and asks the reader before it does.

`prifly-extension.json`:

```json
{
  "id": "hello",
  "name": "Hello",
  "description": "Saves a greeting, after you confirm it.",
  "version": "0.1.0",
  "main": "index.ts"
}
```

`index.ts`:

```ts
import type { ExtensionApi } from "@prifly/extension-api";

export function activate(api: ExtensionApi): () => void {
  // Every part added after the first version is optional: check before calling it.
  api.tools?.register([
    {
      name: "hello_save", // every session sees it as mcp__prifly__hello_save
      description: "Saves a greeting. The reader confirms the text on a card first.",
      inputSchema: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      },
      call: async (args) => {
        const text = String(args["text"]);
        if (!api.confirm || !api.state) return "Not done: this prifly is too old. Update prifly.";
        const ok = await api.confirm({ title: "Save a greeting", summary: text, details: text });
        if (!ok) return "Not done: you cancelled.";
        await api.state.update<string[]>("greetings", (all) => [...(all ?? []), text]);
        return "Saved.";
      },
    },
  ]);
  api.log("activated");
  return () => api.log("stopped"); // optional: prifly calls it when the extension stops
}
```

To try it, link the folder into prifly's extensions folder and enable it in
Settings → Extensions:

```sh
ln -s ~/src/prifly-ext-hello ~/.local/share/prifly/extensions/hello
```

`templates/prifly-ext-template` in the prifly repository (private) is a
fuller starting point. It has a read tool that uses a connected account, a write tool, a
status line, tests against a fake `api`, and lint and typecheck set up.

## What `api` offers

Every type has a doc comment in `src/`; these are the main areas.

| Area | Members | Source |
|---|---|---|
| MCP tools for sessions | `api.tools.register`, `api.tools.read` (call another extension's read tool) | `tools.ts` |
| Asking the reader | `confirm`, `confirmEdit`, `confirmForm`, `chooseMail`, `chooseMailEdit`, `dialog`, `pair`, `ctx.pick` within a tool call | `api.ts`, `dialogs.ts` |
| Credentials and accounts | `vault` (tokens from the reader's vault), `secrets` (a sealed store of the extension's own), `connections` (Google, Microsoft and AWS accounts, with signed `fetch`), `helper` (the reader's own browser, through the prifly Helper) | `tools.ts`, `secrets.ts`, `connections.ts`, `helper.ts` |
| Storage and settings | `state` (JSON documents and append-only logs in prifly's database), `settings` and `onSettings` (the form the manifest declares) | `state.ts`, `settings.ts` |
| A model, with no key | `llm.ask` on the `fast`, `balanced` or `strong` tier, as the reader has set them up | `llm.ts` |
| What the window shows | `show` (chips on a session's banner and the status bar), `status`, `notify`, `flag`, `snoozeOptions`, `onAction` | `decorations.ts` |
| Starting and driving sessions | launchers (the module's `choices`, `open`, `launch` and `launched` exports), `start`, `prompt`, `snooze`, `sessions`, `session` | `launch.ts`, `session-start.ts`, `host-info.ts` |
| Windows of its own | manifest `panels` and `sessionViews`, the module's `panel` and `terminal` exports, `panelMedia`, `showSessionView` | `manifest.ts`, `launch.ts` |
| Machines | `machines.report` (boxes it offers sessions), `onRent` | `api.ts`, `host-info.ts` |
| Dictation | `onDictationPiece`, `markDictation` and related members, for a manifest that declares `dictation` | `dictation.ts` |
| Housekeeping | `log`, `folder`, `paths`, `openUrl`, `accounts`, `cloud` | `api.ts`, `host-info.ts` |

The manifest also declares what the extension may reach: its `vault`
entries, `connections`, `helper` sites, `llm` tiers and the other
extensions' tools it `reads`. It can add a `prompt` to every session's system
prompt and a `bin` folder to every session's PATH. Anything not declared
there is refused. See `ExtensionManifest` in `src/manifest.ts`.

## Working with older prifly versions

An extension may run on a prifly older than the types it was built
against. Two rules keep it working there:

- Treat every optional member as possibly absent: `api.tools?.register(...)`,
  `if (api.confirm) …`.
- `api.features` names what this prifly accepts beyond the first version,
  such as `"confirm"`, `"state"`, `"llm-ask"` or `"tool-scratchpad"`. Check
  it before relying on a newer field. The doc comment on `features` in
  `src/api.ts` lists every name.

## Dependencies of an extension

- **JavaScript**: list what the extension imports at run time under
  `dependencies` in a `package.json` beside the manifest, and commit
  `bun.lock`. prifly runs
  `bun install --frozen-lockfile --production --ignore-scripts` when it
  clones the extension and when an update moves it. No install script ever
  runs.
- **Python**: add a `pyproject.toml` and a `uv.lock`. prifly builds the
  extension's `.venv` before it starts it and puts its `bin` on the sessions'
  PATH. prifly provides uv and Python; the extension ships neither.

## Security

An extension runs inside prifly's host process, with the host's rights. The
manifest limits what prifly hands it (vault entries, accounts, browser
sites), but it does not sandbox the code. Enable only extensions you would
run yourself.

## Where this package comes from

The source is `packages/extension-api` in the prifly repository. The
repository `jimmy927/prifly-extension-api` is a mirror of it: on every push
to prifly's master, CI runs `bun run publish:extension-api`, which copies the
package there as one commit and one `v<version>` tag per version. Changes
belong in prifly, not in the mirror: the next publish overwrites the mirror.

## License

MIT
