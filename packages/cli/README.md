# @use-aistack/cli

Measure and share your AI stack. The CLI scans local history from Claude Code, Codex, Cursor, Grok Build, opencode and Pi, shows you exactly what would go up, and publishes only after you approve in your terminal.

Run on-demand with `npx` - no install required:

```sh
npx @use-aistack/cli sync
```

## Commands

### `npx @use-aistack/cli sync`

The default command. Scan your local transcripts (rolling 30 days), review the full summary, and publish the measured layer to your stack. Nothing leaves your machine without your explicit approval at the prompt. Raw transcripts, prompts, and paths never leave at all - only aggregates.

```sh
npx @use-aistack/cli sync
```

On an unlinked machine, `sync` starts the login flow inline - your browser opens to approve the machine, then the sync continues. One command is the whole onboarding.

After a manual sync, the CLI offers auto-sync with three choices: Enable, Maybe later, and Never ask again. Maybe later asks again after your next manual sync. Existing declines from older CLI versions are treated as Maybe later.

#### A sync that looks stuck

The scan runs on this machine and can take a few minutes when a harness keeps a large history. Cursor is the usual case: its global `state.vscdb` grows past a gigabyte, and the session listing walks all of it before the first result. The spinner text can lag behind the running step while that happens. To see each phase as it starts, with its duration, run with `--verbose`:

```sh
npx @use-aistack/cli sync --verbose
AISTACK_DEBUG=1 npx @use-aistack/cli sync   # the same, for a hook or a script
```

The lines go to stderr and hold counts and durations only: no paths, prompts, or database values. Paste them into a bug report.

### `npx @use-aistack/cli sync --auto on` / `off`

Optional: keep your stack fresh without manual syncs. `on` asks your stack for permission, then writes hooks for the harnesses you actually use. The `SessionStart` paths are: `~/.claude/settings.json` for Claude Code, `~/.codex/hooks.json` for Codex, and `$GROK_HOME/hooks/aistack.json` (default `~/.grok/hooks/aistack.json`) for Grok Build. Cursor uses a user-level `stop` hook in `~/.cursor/hooks.json` and reloads that configuration automatically. Its trigger runs when the agent finishes a turn. The other hooks run when a session starts. All triggers share one silent sync throttle, at most once every 6 hours. Existing user hooks are preserved. Grok Build needs a new session or hook reload after installation. `off` disables local publication first, removes the owned hooks, then takes the remote permission back. If removal fails, the disabled local gate still prevents publication and the next interactive sync can retry reconciliation.

```sh
npx @use-aistack/cli sync --auto on            # enable, default every 6h
npx @use-aistack/cli sync --auto on --every 12 # custom frequency in hours
npx @use-aistack/cli sync --auto off           # revoke
```

**Your stack owns the permission, not this machine.** The silent run asks aistack.to before it publishes anything, so the switch above the first section on your stack page is a complete revoke: it stops every machine, even one whose hooks are still installed. The switch defaults to every 6 hours. Run the enable command shown beside it on each machine that should install triggers. A harness you adopt months later gets its trigger the same way.

The silent run (`sync --auto`) never prompts and never installs a hook. Each run appends one line to `~/.config/aistack/sync.log` (capped at 200 lines). The next interactive `sync` reports the last result. After 3 failures in a row, one visible message appears in Claude Code and names the fix. No email, no dialogs.

### `npx @use-aistack/cli login`

Link this machine to your AI Stack account via browser. Optional - `sync` runs this inline when the machine is not linked yet.

```sh
npx @use-aistack/cli login
npx @use-aistack/cli login --label "build server" # preset and lock the label
```

### `npx @use-aistack/cli connect claude`

Optional: install the in-session sync surface for Claude Code - the `aistack` MCP server (user scope) plus the `aistack-sync` Skill. After that, say "sync my stack" in any Claude Code session. Both halves install together or not at all.

```sh
npx @use-aistack/cli connect claude
```

### `npx @use-aistack/cli collect`

Scan your project for AI config files (prompts, rules, skills, MCP setups) and upload them to your stack.

```sh
cd your-project
npx @use-aistack/cli collect
```

Detects: `.cursorrules`, `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/`, `mcp.json`, skill directories, prompts, and global configs (`~/.claude/`, `~/.cursor/`, etc).

### `npx @use-aistack/cli create`

Write your stack's AI config files into the current directory.

```sh
npx @use-aistack/cli create
```

## Install globally (optional)

If you'd rather type `aistack` instead of `npx @use-aistack/cli` every time, install it globally:

```sh
npm i -g @use-aistack/cli
```

Then the same commands become:

```sh
aistack login
aistack sync
aistack collect
```

## Development

```sh
pnpm --filter @use-aistack/cli build
pnpm --filter @use-aistack/cli dev   # watch mode
```

Test locally:

```sh
node packages/cli/dist/index.js login
node packages/cli/dist/index.js sync
```

Set `AISTACK_URL=http://localhost:3019` to test against local dev server.

Grok Build's context map uses per-call measurements retained from its local diagnostic log. Some calls may be missing because Grok rotates that log. AI Stack preserves the numeric measurements it has captured for 400 days. The map shows total call sizes; Grok's harness/instructions breakdown is unavailable. An ordinary sync collects these measurements when the log contains them.
