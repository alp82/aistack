# Cursor automatic authentication and stop hook

Checked 2026-09-10 for [Decide Cursor attribution and estimation defaults](https://github.com/alp82/aistack/issues/388). This supplements the qualification retained in commit `13638e8941705a585c50d00ab69d992ce6ce1bb8`. No credentials, native history, or authenticated account endpoints were accessed.

## Existing login reuse

The pinned implementation supports automatic reuse. `resolve_cookie()` tries an environment token, macOS Keychain service `cursor-access-token`, then read-only SQLite `ItemTable`, key `cursorAuth/accessToken`. Database paths are:

- macOS: `~/Library/Application Support/{Cursor,Cursor Nightly}/User/globalStorage/state.vscdb`
- Other platforms in this script: `~/.config/{Cursor,Cursor Nightly}/User/globalStorage/state.vscdb`

For a raw JWT it decodes `sub`, takes the component after the final `|`, and constructs `<user-id>::<token>`. Already composed cookies pass through. `api_key_token` JWTs are skipped. Requests URL-encode the separator as `%3A%3A` in `WorkosCursorSessionToken`.

This is source evidence for the mechanism, not a verified login here. The script has no Windows `%APPDATA%` or XDG override, no expiry refresh, and no alternate-source retry after HTTP rejection. Keychain access has a 20-second subprocess timeout; the implementation does not establish that OS access never prompts. [Pinned authentication and request implementation](https://github.com/chocolatemale/cursor-usage/blob/a2f298f161f797036bf96718455e03ccdb42bef4/scripts/fetch_cursor_usage.py#L37).

Planning inference: adopt best-effort reuse with local readings available when discovery or authentication fails. Platform qualification and a prompt-free unattended smoke check remain implementation acceptance criteria. The owner's no-extra-auth-step preference does not require a new API-key or pasted-cookie flow.

## Stop hook

Cursor documents user hooks at `~/.cursor/hooks.json`, with `version: 1` and `hooks.stop: [{command: "..."}]`. User commands run from `~/.cursor/`; configuration reloads automatically. User hooks are unavailable in cloud agents.

`stop` fires when the agent loop ends. Specific inputs are `status` (`completed`, `aborted`, `error`) and `loop_count`. Common inputs include conversation/generation IDs, model and optional structured model/parameters, Cursor version, workspace roots, and nullable transcript path. Email is also supplied. No billed token fields are documented. Returning `followup_message` continues the agent. [Official hook reference](https://cursor.com/docs/hooks).

Planning inference: a user-level command can trigger the existing consent-gated autosync runner. Keep stdout empty, avoid follow-up output, and preserve foreign hooks. A small prospective sidecar could retain receipt time, IDs, selected model/parameters, status and local workspace/transcript references. Discard email. Receipt time marks hook observation, not model request time; this supplies future metadata without reconstructing historical billed usage.

## Existing local estimate formula

The pinned reader's `extractTokenUsage()` takes the first positive source:

1. `tokenCount.inputTokens/outputTokens`, missing sibling defaulted to zero.
2. `usage.input_tokens/output_tokens`, same default.
3. Positive `contextWindowStatusAtCreation.tokensUsed` as input, output zero.
4. Parsed `promptDryRunInfo.fullConversationTokenCount.numTokens`, then `userMessageTokenCount.numTokens`, as input, output zero.

Otherwise it returns undefined. Despite the context fallback's comment mentioning user messages, this function contains no role guard. It does not tokenize visible output, estimate cache buckets, or distinguish source provenance in the returned pair. [Pinned reader function](https://github.com/S2thend/cursor-history/blob/c7f88062275b14078ffb26710bd9be281110d5e6/src/core/storage.ts#L6932).

Planning inference: do not interpret this flattened pair as uniformly reported input/output or combine it with dashboard totals. A contract using these fallbacks needs source distinction and a separate decision about visible-output estimation.
