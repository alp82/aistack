# Cursor source shapes

All files in this directory are synthetic, authored on 2026-09-10. The shapes follow the pinned implementations in the [qualification note](../../docs/research/cursor-source-qualification-2026-09.md). No Cursor version, account response, or captured native session is claimed. Paths and identifiers are invented. These are regression inputs for the upcoming adapter contract, not a production adapter test suite.

- `usage-page.json`: four account-shaped events. First two join the local conversation, share time/model/conversation and lack event IDs, yet have different counts. First has all buckets (460 tokens), a real zero charge and nonzero metered cents. Second lacks cache writes but reports zero cache reads. Third is unmatched with cloud metadata. Fourth lacks identity and token usage and carries an Auto label.
- `composer-rows.json`: logical SQLite key/value rows, with JSON values represented as objects for review. Materialize `value` as JSON text. The `ItemTable` row belongs in a workspace database; the `cursorDiskKV` rows belong in global storage. Two ordered bubbles include an empty-text tool call with model and stored timing.
- `workspace.json`: sibling of the workspace database at `User/workspaceStorage/<workspace-id>/workspace.json`, with an explicit synthetic folder URI.
- `11111111-1111-4111-8111-111111111111.jsonl`: place under `~/.cursor/projects/<project>/agent-transcripts/` to model an overlapping copy of the Composer conversation. It intentionally lacks timestamps, model and usage. Two representations do not mean two sessions or twice the tools.

Run `python3 research/cursor-source-fixtures/check.py`. The check validates fixture invariants and SQLite keyed read paths using an in-memory database. It opens no native Cursor files, uses no credentials and makes no network calls. It does not exercise upstream library compatibility or actual acquisition.

Future regression expectations: retain both ID-less concurrent usage events; join only the matching conversation before applying the contract's inclusion policy; preserve absent fields separately from zeros; never sum overlapping source copies. A repeated HTTP page, partial read and delayed bucket should be constructed from these inputs in adapter tests when that implementation exists.
