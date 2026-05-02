# @use-aistack/cli

Share and clone AI development configurations (prompts, rules, skills, MCP setups).

Run on-demand with `npx` — no install required:

```sh
npx @use-aistack/cli <command>
```

## Commands

### `npx @use-aistack/cli login`

Authenticate with your AI Stack account via browser.

```sh
npx @use-aistack/cli login
```

### `npx @use-aistack/cli collect`

Scan your project for AI config files and upload them.

```sh
cd your-project
npx @use-aistack/cli collect
```

Detects: `.cursorrules`, `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/`, `mcp.json`, skill directories, prompts, and global configs (`~/.claude/`, `~/.cursor/`, etc).

### `npx @use-aistack/cli create <slug>`

Clone a shared project's AI config files into your current directory.

```sh
npx @use-aistack/cli create my-project-abc123
```

## Install globally (optional)

If you'd rather type `aistack` instead of `npx @use-aistack/cli` every time, install it globally:

```sh
npm i -g @use-aistack/cli
```

Then the same commands become:

```sh
aistack login
aistack collect
aistack create <slug>
```

## Development

```sh
pnpm --filter @use-aistack/cli build
pnpm --filter @use-aistack/cli dev   # watch mode
```

Test locally:

```sh
node packages/cli/dist/index.js login
node packages/cli/dist/index.js collect
node packages/cli/dist/index.js create <slug>
```

Set `AISTACK_URL=http://localhost:3019` to test against local dev server.
