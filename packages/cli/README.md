# @aistacks/cli

Share and clone AI development configurations (prompts, rules, skills, MCP setups).

## Install

```sh
npx @aistacks/cli <command>
```

Or install globally:

```sh
npm i -g @aistacks/cli
```

## Commands

### `aistack login`

Authenticate with your AI Stack account via browser.

```sh
aistack login
```

### `aistack collect`

Scan your project for AI config files and upload them.

```sh
cd your-project
aistack collect
```

Detects: `.cursorrules`, `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/`, `mcp.json`, skill directories, prompts, and global configs (`~/.claude/`, `~/.cursor/`, etc).

### `aistack create <slug>`

Clone a shared project's AI config files into your current directory.

```sh
aistack create my-project-abc123
```

## Development

```sh
pnpm --filter @aistacks/cli build
pnpm --filter @aistacks/cli dev   # watch mode
```

Test locally:

```sh
node packages/cli/dist/index.js login
node packages/cli/dist/index.js collect
node packages/cli/dist/index.js create <slug>
```

Set `AISTACK_URL=http://localhost:3019` to test against local dev server.
