# Cursor workflow and inventory implementation

Implements [Integrate Cursor workflow metrics and machine inventory](https://github.com/alp82/aistack/issues/390), under the accepted [Cursor attribution and estimation contract](https://github.com/alp82/aistack/issues/388#issuecomment-5617625795).

## Projection

`packages/cli/src/harness/cursor/workflow.ts` feeds retained messages and the collection adapter's reconciled usage into the existing harness reducer. No new wire shape, rule package, row order or UI is introduced.

- User timestamps anchor session starts without adding question turns. Each retained assistant message contributes a turn, with `ask_question` marking a question back.
- Tool calls supply activity, native search counts and existing phase classification. Native read/edit/terminal variants are mapped to the established reducer names. Native names remain in inventory, behind the adapter's literal builtin allowlist and existing private-name filtering.
- Model routing uses reconciled token buckets. A matched API conversation/day supersedes its local token estimate but leaves its local tool activity intact. Unknown models remain unknown.
- Native Composer message IDs and source-native tool IDs deduplicate copied prefixes across sessions. Non-native identities are scoped to their conversation. Newly performed child activity still counts.
- The sidechain bit establishes subagent routing and tool counts. A native `parentMessageId` resolving to a retained main message additionally establishes a structural parent for the reducer. No session relationship is inferred from text or timestamps. Unlinked sidechains cannot establish fan-out. The reader exposes no general parent-session field.
- Canonical absolute workspace paths stay in local reducer sources for the existing Git extraction and workspace-day joins. Usage and machine inventory continue through the existing persistent opaque project identifier.
- Untimed evidence can contribute observed inventory, but contributes no invented workflow or Git day. Date interpolation follows the collection adapter's existing anchors and does not establish per-call duration.

Accumulated turn input, context snapshots and dry-run estimates never become a per-call Context distribution. Turn latency, reasoning-token counts, native effort and compaction remain absent because this selected projection has no qualified evidence for those fields. No prospective sidecar is required to supply the supported historical rows. The automatic-sync ticket owns the stop-hook lifecycle.

## Inventory and consent

The existing scanner already discovers Cursor rules and skills; the existing MCP discovery reads project and user Cursor configuration and strips credential fields. This change reuses those paths. Configuration alone creates no observed call. Explicit `mcp__server__tool` names identify their server; single-underscore `mcp_server_tool` names resolve only against configured Cursor server names, longest prefix first, instead of inventing a server split. Unrecognized names remain subject to shared fail-closed filtering.

Stage passes the stack's `publishWorkflow` flag to historical scans and disables redundant Cursor workflow reduction during snapshot scans. When false, Cursor retains usage and observed inventory but returns an empty workflow and no local Git joins. Shared day consent drops workflow blocks, and the existing backend read gate hides stored readings after consent is disabled. The price and cost consent pipeline is unchanged.

## Validation

Synthetic checks exercise API/local precedence with tools retained, phases/searches/questions, routing, missing Context and duration, structural child activity and copied-prefix dedup, undated inventory, workflow-off extraction, configured versus observed MCP/skills, private-name filtering and opaque workspace IDs.

The targeted shared reducer, phase-rule, staging, payload, configured resource discovery and backend workflow tests pass. CLI TypeScript checks pass. No native account, private history, interactive sync, deployment or publication was performed for this ticket.
