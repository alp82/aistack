# @use-aistack/cli

Measure and share your AI stack. The CLI scans your local Claude Code transcripts, shows you exactly what would go up, and publishes only after you approve in your terminal.

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

### `npx @use-aistack/cli sync --auto on` / `off`

Optional: keep your stack fresh without manual syncs. `on` asks your stack for the permission, then writes a `SessionStart` hook into the harnesses you actually use - `~/.claude/settings.json` for Claude Code, `~/.codex/hooks.json` for Codex. The hook runs a silent sync at most once every 6 hours when a session starts. `off` removes the hooks and takes the permission back.

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
