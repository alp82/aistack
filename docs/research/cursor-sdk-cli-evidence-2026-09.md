# Cursor SDK and CLI evidence omitted from the first survey

Research date: 2026-09-10. Companion to the [revised harness gap report](./cursor-harness-gap-2026-09.md). This lane checked current vendor documentation, the published SDK package, and GitHub CLI consumers. It did not run Cursor or access account data.

## Findings

The earlier statement that CLI output has no tokens was inferred from an incomplete reference page. It should be withdrawn. Two inspected GitHub consumers read camelCase usage from the terminal CLI result. One records the exact Cursor CLI version it tested. Separately, the official SDK exposes token usage, historical run inspection, and a typed local persistence interface. This creates another plausible integration path, with the important qualification that SDK history has not been shown to include ordinary IDE history.

## Breadth and source selection

Searches included `site.cursor.com/docs sdk usage inputTokens outputTokens stream`, `github cursor usage requestId conversationId`, GitHub code search for `usage cursor stream-json language:TypeScript`, and `cursor sdk org:cursor`. The code search returned 25 candidates. Four were inspected for actual accounting behavior:

| Repository and pinned revision | What the inspected implementation establishes |
| --- | --- |
| [im4codes/imcodes](https://github.com/im4codes/imcodes/blob/023f7c358570769cde01a10ef8e134a9b05e75a7/src/agent/providers/cursor-headless-stream.ts#L89) | Reads `result.usage`; maps `inputTokens` and `outputTokens`, retaining cache counters as diagnostics. Its comment records verification with Cursor CLI `2026.05.04-08e5280` and an example containing all four token buckets. This is an upstream author's version-specific observation, not a run reproduced here. |
| [DawidWraga/davstack](https://github.com/DawidWraga/davstack/blob/85fb1df1bfb89f78cd90189dab90f0163e308ac3/packages/open-agents/scripts/usage-today.ts#L79) | Reconstructs usage from previously captured job NDJSON logs, scans backward for the final `result`, and sums camelCase input/output/cache fields. Workspace and model come from its own job metadata. This demonstrates retained wrapper history, not a passive IDE scanner. |
| [open-gsd/gsd-pi](https://github.com/open-gsd/gsd-pi/blob/53b6821b9f2b857c1dc8a6ddecfd1d8bd415d6de/src/resources/extensions/cursor-cli/stream-adapter.ts#L263) | Has a usage parser, but the inspected mapping accepts snake_case and selected aliases rather than Cursor's camelCase input/output fields. Its total also omits cache-read tokens. A generic usage adapter is insufficient evidence that Cursor accounting is correct. |
| [paperclipai/paperclip](https://github.com/paperclipai/paperclip/blob/92c5c1ac3de5a0fe36d8f0601df10ba7694ce676/packages/adapters/cursor-local/src/server/execute.ts#L730) | Forwards parsed usage and cost from a separate parsing layer. This file alone does not establish the original fields or their semantics; it is a lead, not independent token-schema validation. |

The current [CLI output reference](https://cursor.com/docs/cli/reference/output-format) omits `usage` from its examples. That omission cannot establish that released CLI output lacks the field. The implementation evidence above directly contradicts that inference. Capture of the installed version's actual output remains a qualification step for a future adapter.

## Official SDK surface

The [TypeScript SDK reference](https://cursor.com/docs/sdk/typescript#token-usage) documents per-turn usage events and cumulative run usage, including input, output, both cache buckets, and optional reasoning. It also documents `Agent.list`, `listRuns`, `getRun`, and `messages.list`; `Agent.getUsage` returns billed usage for cloud runs or local turns. Optional usage remains absent when unavailable. These interfaces establish supported programmatic and historical reads for SDK agents. They do not establish that SDK listing includes every IDE conversation. The same reference documents owned SQLite and JSONL stores, so a blanket statement that Cursor has no supported local persistence interface is too broad.

### Published package inspection

Inspected `@cursor/sdk@1.0.31` from the [npm registry](https://registry.npmjs.org/@cursor%2fsdk/1.0.31), downloaded and unpacked without executing it. The registry reports integrity:

```text
sha512-0SdJQqp5oXn81oJqIVkLpgHih+CL6CAudK83pCsdJyA23AvInSWlMaGpLi+JlrK3efHoswiEhhASs9WpeEz3QQ==
```

Package declarations independently make these contracts concrete:

- [`dist/esm/usage-types.d.ts`](https://unpkg.com/@cursor/sdk@1.0.31/dist/esm/usage-types.d.ts): `TokenUsage` has four token buckets and optional reasoning. `AgentUsage.runs` uses usage UUIDs for local turns. Local events without a usage UUID count only in the aggregate, so summing returned entries can undercount the total. Cost is eventually consistent.
- [`dist/esm/agent.d.ts`](https://unpkg.com/@cursor/sdk@1.0.31/dist/esm/agent.d.ts): local `getUsage` filtering requires a usage UUID from returned entries. A client-generated `run-<uuid>` is a different identifier and raises a configuration error if passed as that filter. Joining by a field named `runId` without checking its namespace would be incorrect.
- [`dist/esm/store/local-agent-store.d.ts`](https://unpkg.com/@cursor/sdk@1.0.31/dist/esm/store/local-agent-store.d.ts): local run documents include agent/run/request IDs, turn number, model, creation/start/end timestamps, optional structured usage, and checkpoints. Agent documents carry cwd. Run events have sequence, offset, event type, creation time, and optional idempotency key.
- [`dist/esm/store/sqlite-local-agent-store.d.ts`](https://unpkg.com/@cursor/sdk@1.0.31/dist/esm/store/sqlite-local-agent-store.d.ts): the SDK store uses `index.db`, per-agent checkpoints, and a `run_events` table. Its declared scope is the SDK's default persistence layout. This is distinct from evidence about IDE `state.vscdb` or CLI `chats/**/store.db`.

These are type and package observations. No native run demonstrated field population, migration behavior, or overlap with IDE/CLI stores during this survey.

## Official API corrections

The current [Admin API reference](https://cursor.com/docs/account/teams/admin-api#get-usage-events-data) explicitly provides optional `conversationId` on usage events and describes it as a session attribution and cross-source join key. It distinguishes model cost, charged cost, and Cursor's fee. Therefore the first report's claim that Admin usage has no documented session join is wrong. Missing IDs still require an unattributed category.

The [AI Code Tracking API](https://cursor.com/docs/account/teams/ai-code-tracking-api#get-commit-details) also documents conversation IDs in commit annotations, plus repository and commit information elsewhere in that API. It is Enterprise-only; the commit-details endpoint has limited alpha access, and multi-root workspaces are unsupported. This supplies an additional conditional attribution route, not proof that every billable event can be associated with a local machine.

## Remaining qualification questions

1. Does an SDK local-history listing include only SDK-created agents, or can it enumerate CLI/IDE history in any released configuration? No inspected source establishes universal interoperability.
2. Which Cursor CLI versions emit terminal usage, and do interrupted turns persist it anywhere that a passive scanner can recover?
3. Can returned usage UUIDs join retained local run or interaction records reliably? The package explicitly distinguishes billing UUIDs from client run IDs.
4. What is the time and model attribution for billing entries that contribute only to SDK totals? The public `RunUsage` declaration does not carry those fields itself.
5. Can per-turn usage support AI Stack's current token totals without being mistaken for per-call Context? Aggregated turn tokens do not establish the size of each model request.

These are narrow version and field-population questions. They no longer justify ruling out historical support or declaring tokens unavailable.
