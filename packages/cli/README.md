# @use-aistack/cli

Measure and share your AI stack. The CLI scans your local Claude Code transcripts, shows you exactly what would go up, and publishes only after you approve in your terminal.

Run on-demand with `npx` — no install required:

```sh
npx @use-aistack/cli sync
```

## Commands

### `npx @use-aistack/cli sync`

The default command. Scan your local transcripts (rolling 30 days), review the full summary, and publish the measured layer to your stack. Nothing leaves your machine without your explicit approval at the prompt. Raw transcripts, prompts, and paths never leave at all — only aggregates.

```sh
npx @use-aistack/cli sync
```

Requires a one-time `login` first.

### `npx @use-aistack/cli login`

Link this machine to your AI Stack account via browser.

```sh
npx @use-aistack/cli login
```

### `npx @use-aistack/cli connect claude`

Optional: install the in-session sync surface for Claude Code — the `aistack` MCP server (user scope) plus the `aistack-sync` Skill. After that, say "sync my stack" in any Claude Code session. Both halves install together or not at all.

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
