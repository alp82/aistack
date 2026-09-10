# Grok Build 1.0.13 follow-up observations

Captured 2026-09-09 after the owner asked to continue inspecting the newly installed Grok Build data. Two selected sessions were stable across capture reads. This is additional planning evidence for [Capture representative Grok Build fixtures for the planning decisions](https://github.com/alp82/aistack/issues/369), which remains open.

## Observed cases

| Capture | Terminal records | Usage evidence | Lifecycle evidence |
| --- | --- | --- | --- |
| session-a | Three rate-limited turns | First retains the original 613759 input / 5082 output reading; later two omit the usage field | Turn numbers 0, 1, 2; two SessionStart and two SessionEnd hook notifications |
| session-b | One successful turn, then one rate-limited turn | Success records 16226 input / 35 output and one model call; failure omits the usage field | Turn numbers 0, 1; one SessionStart and one SessionEnd hook notification |

The successful turn has `stop_reason: end_turn` and `elapsed_ms: 4272`. The three turns without usage have `stop_reason: rate_limit`; they still retain prompt identifiers and elapsed time. Missing usage is field omission, not an explicit zero counter and not a null object.

The earlier usage-bearing terminal remains unchanged in session-a after further prompts. A reader must preserve that earlier contribution when later terminals carry no usage. Do not use only the latest terminal, replace prior usage with zero, or reuse an earlier usage object for a later prompt.

Neither session contains two usage-bearing prompts. These observations therefore do not establish whether two nonempty terminal readings in this binary are per-prompt or cumulative. SessionStart occurring twice in one recording proves repeated start notifications; it does not by itself prove a specific resume command, copy policy, or reset behavior. No fork/subagent/restore lineage is qualified.

The pinned public source supports a per-prompt interpretation: `record_model_call_usage` adds to both prompt and session ledgers, while `increment_prompt_index` clears only the prompt ledger. The upstream `prompt_usage_ledger_via_handle_resets_and_clears` test exercises that distinction. These are source clues, not executed tests or proof that source matches the installed binary. [Actor mutations](https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-chat-state/src/actor/mutations.rs), [actor tests](https://github.com/xai-org/grok-build/blob/75810042ca2762aa0b0fa17864f3f68823ccbea5/crates/codegen/xai-chat-state/src/actor/tests.rs).

## Validation and privacy

Run `python3 research/grok-build-fixtures/verify_observed.py` from the repository root. It checks all three retained captures: original, session-a follow-up, and session-b. Checks cover five follow-up terminals, three omitted usage fields, unique prompt identifiers within each session, start/end counts, usage arithmetic and model sums, 30 tool identity joins, preservation of the first observed usage, and excluded private fields.

The follow-up captures replace identifiers, shift timestamps by a common whole-day offset within each capture, and omit private content and raw tool inputs/outputs. Identifier substitutions are scoped to each capture. Do not infer cross-capture identity or ordering from replacement values, and do not ingest the original and follow-up session-a as independent sessions. They represent overlapping observations. Provenance files record transformations and retained record counts. No original files were modified and no model prompts were initiated.

## Remaining owner-run samples

The latest additional attempts ended at a rate limit. Once Grok accepts prompts again, the following short sequence supplies the most important remaining evidence. These are owner steps because the fixture ticket forbids agents from automatically running paid prompts. No sync, hook installation or account change is needed.

1. In one session, send `Reply with OK only.` and wait for completion. Then send `Reply with DONE only.` and wait again. Both must finish with usage to qualify the two-nonempty-prompt case.
2. Exit with `/quit`, then run `grok --resume` in the same directory. Send `Reply with RESUMED only.` and wait. This provides a known process restart and resumed prompt.
3. In that session, run `/fork --no-worktree Reply with FORKED only.` and wait. The installed session guide documents this syntax; it avoids creating a worktree and preserves a source/copy pair to inspect.
4. In the fork, ask `Delegate one task to a subagent: reply with CHILD only. Wait for it, then reply with PARENT only.` Confirm it actually invokes a child. A model declining delegation does not qualify parent/child folding.
5. Tell the inspecting agent the sequence is complete. The existing local inspection authorization lets it sanitize these selected examples; do not paste raw logs onto GitHub.

Stop the sequence if rate limiting continues. There is no value in repeatedly generating another usage-free error fixture.

These steps target accounting identity first. Custom provider aliases, restored remote history, conditional workflow event joins, configuration provenance and platform hooks remain separate gaps in the parent checklist. Do not claim those were covered by this sequence.
