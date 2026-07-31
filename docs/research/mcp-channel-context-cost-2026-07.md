# What the MCP channel costs a session — measured

Wayfinder ticket [#54](https://github.com/alp82/aistack/issues/54) (map [#29](https://github.com/alp82/aistack/issues/29)).
This document records measurements. It decides nothing. It feeds the channel-mix grilling ([#56](https://github.com/alp82/aistack/issues/56)).

Environment: Claude Code **2.1.220** on Linux, `claude --version`, 2026-07-30.
Server under test: `aistack mcp` from the local build (`packages/cli/dist/index.js`, source `packages/cli/src/sync/server.ts`, 2 tools).

## Headline numbers

| Quantity | Value | How measured |
| --- | --- | --- |
| Per-session context tax, server attached, idle | **28 tokens** | `claude -p` A/B delta, see below |
| Full `tools/list` payload (both schemas) | 969 bytes, ~110–240 tokens (est.) | raw JSON-RPC over stdio |
| Beat one (`sync_preview` output enters the transcript) | 1,606 bytes, ~230–400 tokens (est.) | live `tools/call` on the owner's corpus |
| Skill listing line (`aistack-sync` description) | ~40–60 tokens (est.) | frontmatter of `packages/cli/skills/aistack-sync/SKILL.md` |
| Server spawn → `initialize` response | 36–41 ms (5 runs) | stdio probe |

Token estimates use two heuristics (chars/4 and words×1.3) because no `ANTHROPIC_API_KEY` was available for the count-tokens endpoint. The 28-token figure is not an estimate. It comes from the API's own usage report.

## 1. The measured in-session delta: 28 tokens

Method: `claude -p 'say ok' --output-format json` with `--strict-mcp-config` and a `--mcp-config` that either contains only the aistack server (pointed at the local dist) or is empty. Two runs per config. The context figure sums `input_tokens + cache_creation_input_tokens + cache_read_input_tokens` from the reported usage.

| Config | Run 1 total context | Run 2 total context |
| --- | --- | --- |
| No MCP servers | 21,539 | 21,539 |
| aistack attached | 21,567 | 21,567 |
| **Delta** | **+28** | **+28** |

The delta is stable across runs and across cache states (run 1 wrote cache, run 2 read it — the totals did not move). 28 tokens is consistent with the server name plus two tool names and nothing else: the tool descriptions and schemas (~110–240 tokens by themselves) never entered the context.

## 2. Why the delta is small: deferral is the default

Claude Code defers MCP tool schemas by default. Only tool names and server instructions load at session start. Claude fetches a schema through the `ToolSearch` tool when it needs the tool. Sources:

- Official docs, [Scale with MCP tool search](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search): "Tool search keeps MCP context usage low by deferring tool definitions until Claude needs them. Only tool names and server instructions load at session start" and "Tool search is enabled by default."
- Primary in-context evidence: the session that produced this document lists `mcp__aistack__sync_preview` / `mcp__aistack__sync_publish` as deferred, name-only tools that need a `ToolSearch` fetch before use.
- [CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md) timeline:
  - **2.1.7** — MCP tool search auto mode on by default, deferral when descriptions exceed 10% of the context window.
  - **2.1.9** — `auto:N` custom threshold.
  - Later builds (current docs) — full deferral is the unset-default; `auto` is the opt-in threshold mode.
  - **2.1.84** — global system-prompt caching works with `ToolSearch` plus MCP tools.
  - **2.1.119** — off by default on Vertex AI (opt back in with `ENABLE_TOOL_SEARCH`).
  - **2.1.121** — `alwaysLoad` per-server opt-out of deferral.

Deferral is NOT universal. It needs a first-party endpoint and a model with `tool_reference` support (Sonnet 4.5 / Haiku 4.5 / Opus 4.5 and later). It is off on Google Cloud's Agent Platform, on non-first-party `ANTHROPIC_BASE_URL` proxies, under `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`, and on Microsoft Foundry Azure-hosted deployments (server-side rejection). In those configurations the full schema cost below applies instead of 28 tokens. Known bug class: HTTP-transport tools loaded upfront despite tool search ([anthropics/claude-code#40314](https://github.com/anthropics/claude-code/issues/40314)) — our server is stdio, so this class does not apply to it.

## 3. Full schema cost, with scale

The `tools/list` payload is what a non-deferring configuration pays up front. Captured by driving each server over stdio with raw JSON-RPC (`initialize` → `notifications/initialized` → `tools/list`) and byte-counting the result JSON.

| Server | Tools | Bytes | ~Tokens (chars/4) | ~Tokens (words×1.3) |
| --- | --- | --- | --- | --- |
| **aistack** (local dist) | 2 | **969** | 241 | 111 |
| `@playwright/mcp@latest` | 24 | 18,476 | 4,619 | 1,487 |
| `chrome-devtools-mcp@latest` | 29 | 23,254 | 5,814 | 1,992 |
| `@modelcontextprotocol/server-github` (archived legacy) | 26 | 15,864 | 3,966 | 723 |

GitHub's current official server is remote and auth-gated, so the archived npx package stands in for scale. The aistack server is 19–24× smaller than the popular servers by bytes. Even fully loaded it costs roughly 0.1% of a 200k context window.

## 4. Skill listing cost

The `aistack-sync` Skill contributes one description line to the skills list every session (`packages/cli/skills/aistack-sync/SKILL.md` frontmatter, 232 characters): ~58 tokens by chars/4, ~49 by words×1.3. The full SKILL.md body loads only on invocation.

## 5. Idle vs use

- **Idle** (installed, never synced): 28 tokens for the MCP server, plus the Skill line if the Skill is installed — **under ~90 tokens per session** all-in.
- **Use** (a sync runs): beat one is deliberately the full review surface and enters the transcript. Measured live against the owner's real corpus (461 sessions, 4.7B tokens window): **1,606 bytes, 36 lines**, ~230–400 tokens (est.). Beat two is the short elicitation dialog and does not enter the transcript as tool output. Add the two fetched tool schemas (~110–240 tokens) that `ToolSearch` pulls in when the tools are used. A syncing session therefore spends roughly **400–700 tokens** on the whole exchange, once.

## 6. Startup cost

Spawn-to-`initialize`-response over stdio: 36, 38, 38, 40, 41 ms across 5 runs. `tools/list` answers in the same millisecond. Claude Code connects stdio servers in the background at session start and does not block the prompt on them. When a task needs a still-connecting server, the wait happens inside the `ToolSearch` call ([docs](https://code.claude.com/docs/en/mcp), "Managing your servers"). A ~40 ms server adds no perceptible session latency.

## 7. Prior art: what people actually complain about

The dominant complaint is **tokens**, not setup friction and not trust prompts:

- 67k tokens consumed by four servers before the first prompt ([Your MCP Servers Are Eating Your Context](https://medium.com/@lakshminp/your-mcp-servers-are-eating-your-context-549c472beaf2)).
- Tool search cut a 51k-token MCP load to 8.5k ([write-up](https://medium.com/@joe.njenga/claude-code-just-cut-mcp-context-bloat-by-46-9-51k-tokens-down-to-8-5k-with-new-tool-search-ddf9e905f734)).
- Bug reports are about deferral failing, not about deferral existing: threshold not activating ([#18298](https://github.com/anthropics/claude-code/issues/18298), [#19560](https://github.com/anthropics/claude-code/issues/19560)), HTTP tools loaded upfront ([#40314](https://github.com/anthropics/claude-code/issues/40314)).
- A secondary complaint is **misreporting**: `/context` in the VS Code extension counted deferred tools as if loaded ([#24081](https://github.com/anthropics/claude-code/issues/24081)), and users ask for deferred overhead to be visible at all ([#21966](https://github.com/anthropics/claude-code/issues/21966)). Perception of bloat can outlive the bloat.

Mitigation levers that exist today, all first-party:

- **Tool search / deferral** — default on, `ENABLE_TOOL_SEARCH` (`auto`, `auto:N`, `false`) to tune ([docs](https://code.claude.com/docs/en/mcp#configure-tool-search)).
- **`alwaysLoad: true`** per server to opt out of deferral (2.1.121) — the inverse lever; we would not set it.
- **Scopes** — `local` / `project` / `user` registration, so a user can confine the server to one project ([docs](https://code.claude.com/docs/en/mcp)).
- **Per-project enable/disable** — `/mcp` panel and `enabledMcpjsonServers` / `disabledMcpjsonServers` in settings.
- **Server instructions** — with deferral on, the docs advise instructions that tell Claude when to search for the tools; our server currently sends none (`initialize` result in `server.ts` carries no `instructions` field).
- No lazy *registration* exists: a configured stdio server is spawned per session. The ~40 ms spawn is the whole of that cost.

## What this means for the channel-mix grilling (facts only)

- On current first-party Claude Code the standing per-session tax of the installed channel is **28 tokens**, about **0.014%** of a 200k window. The "per-session tax" framing in #54 described the pre-2.1.7 world; deferral removed the schema cost for the default configuration.
- The tax reverts to the full ~110–240 tokens (still ~0.1% of the window) only where tool search is off: proxies, some cloud platforms, models before the 4.5 generation, or explicit opt-out.
- The visible costs of a sync are the one-time ~400–700 tokens of an actual preview+publish exchange and the Skill's ~50-token listing line.
- User sentiment targets multi-server, many-tool installs and reporting bugs. A 2-tool, sub-1KB server is two orders of magnitude below the sizes complained about.
