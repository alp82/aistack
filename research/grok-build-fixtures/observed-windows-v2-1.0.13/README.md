# Corrected Windows export validation

Validated the complete owner-supplied v2 JSON. Reported client: Grok Build 1.0.13, build `5e9a58528b76`, Windows 11 AMD64. `evidence.json` records the input hash/size and a small timing projection. The original export remains unchanged outside the repository.

## Qualified observations

- All 7512 event ISO timestamps parse; there are 2519 distinct values. The five native phase enums survive. Native runtime phases still require mapping to the shared workflow rules.
- Eleven ordered start/end windows correspond to eleven terminal updates. Terminal `elapsed_ms` exceeds the event span by 51 to 64 ms in each case. This establishes close agreement in this recording, not equality or a universal correction constant. Prefer the recorded duration where supported.
- Outer update `timestamp` is Unix seconds; `agentTimestampMs` is milliseconds. All eleven terminal outer timestamps fall in the same second as their corresponding event-end timestamp. Match in full precision where available; integer-second ordering alone cannot identify simultaneous events.
- Ten distinct camelCase `params._meta.promptId` values survive. Within the update stream, 273 distinct `toolCallId` values each have two matching updates.
- All terminal usage objects equal v1. The previously validated ten per-prompt readings and final missing-usage error remain valid.
- The actual included background manifest has two `bash` and two `monitor` entries. No child model-agent recording is included. The separately reported bash task-type census of five is a different count from the four manifest entries.
- The second candidate session still has no updates or events. The donor explicitly reports no existing source/copy or model-subagent sample available. Further requests for those existing recordings from this donor are unnecessary.

## Identity sanitization still incomplete

All ten successful terminal `params.update.prompt_id` values remain the all-zero UUID. The failed terminal's ID is also generically text-masked. All 273 completion-event `tool_call_id` values remain one identical masked string. V2 repaired camelCase references but did not repair these snake_case fields.

Do not treat these collisions as native behavior. Do not generate new distinct terminal IDs from ordinal position, or claim that a timing match recovers the original identity. This export can qualify timeline shape and within-update joins, but not terminal replay deduplication or update-to-completion identity joins.

If a minimal sanitization patch becomes available, it only needs to map `prompt_id` through the same shared map as `promptId`, and `tool_call_id` through the same shared map as `toolCallId`, before generic string masking. No new sessions or full transcript text are needed for that repair. This is separate from the unavailable fork/subagent scenarios.

## Checks and remaining planning work

Full-input checks covered timestamp parsing, start/end counts, timing differences, complete tool-update ID sets/multiplicities, actual manifest kinds, empty second-session history and unchanged usage versus v1. All checks completed; the remaining defects above are explicit findings. The reduced timing projection can be checked with `python3 research/grok-build-fixtures/verify_donor_v2.py`; stream-wide counts are recorded full-input observations rather than facts reconstructed from the small projection.

No paid prompt, hook installation, sync, original-record edit or adapter implementation occurred. The fixture ticket stays open. The released-format decision still needs a concrete treatment of unqualified replay/fork and subagent behavior; this investigation does not silently change the settled coverage policy or mark those cases supported. The remaining evidence must come from another suitable sample or qualified source/constructed tests, with any release qualification requirement made explicit in the eventual execution plan.
