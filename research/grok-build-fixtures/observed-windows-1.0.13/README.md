# Donor Grok Build 1.0.13 Windows evidence

The owner supplied a donor-sanitized export for the fixture investigation. Reported provenance: `grok 1.0.13 (5e9a58528b76) [stable]`, Windows 11 10.0.26200 (AMD64). Version and OS are donor-reported, not independently probed. The original export remains unchanged outside the repository. `evidence.json` records its SHA-256 and byte length and retains only a small measurement projection; the 12 MB input is not copied into the repository.

## Findings that advance the fixture task

The primary session has eleven terminal updates. Ten are successful and contain usage; the last has `stop_reason: error` and omits usage. The sequence of model-call counts on the successful turns is `31, 31, 6, 5, 8, 5, 7, 5, 4, 6`. Each count exactly matches the number of loop-start and first-token events within the corresponding turn's ordered start/end window. Input totals also decrease between turns. This supports per-prompt accounting and rules out reading these records as one monotonically increasing lifetime total.

That correspondence uses ordinal position in two complete sequences, not a prompt-ID or cross-log timestamp join. The donor's sanitizer damaged those join fields. This evidence closes the previous gap of having no two usage-bearing prompts in one observed session; it does not qualify replay deduplication, resume resets, forks or child folding.

All ten usage records pass input-plus-output totals, cache/reasoning subset checks and per-model sums. `numTurns` matches `modelCalls` on each turn. The last failed turn has one loop start, no first-token event and no usage, so the complete event stream has 109 loop starts while the usage records account for 108 calls. A loop start is not itself a measured token contribution.

The recorded usage model is `grok-4.6-build`, while summary/turn-start model fields name `grok-4.6`. Preserve the usage model breakdown when choosing pricing and model identity; this is observed identifier variation, not proof of a billing equivalence or provider mapping.

There are 273 distinct tool-call IDs within the update stream. Each has exactly two tool updates, and their sets match. This establishes usable within-update identity in this export. It does not establish the event-stream join because the event-side IDs were collapsed.

No usage sidecar is supplied; metadata reports it absent. This corroborates the event-based format observed locally for the same reported version. It does not qualify Windows hook execution or launcher behavior.

## Export limitations found by checking the contents

| Export claim or scenario | Actual retained evidence | Consequence |
| --- | --- | --- |
| IDs remapped one-to-one | All eleven terminal `prompt_id` values equal the all-zero UUID; all 273 completion-event tool IDs collapse to one value | Cannot test prompt deduplication or join tool events to updates from those fields |
| Timestamps preserved | All 7512 event `ts` values equal `0000-00-00X00:00:00.000X`, an invalid timestamp; numeric update timestamps survive | Cannot validate event durations, phase timing or cross-log temporal joins |
| Original plus resumed/forked copy | Session B has null updates, zero events and zero reported messages | No copied usage or resumed execution exists in the supplied B evidence |
| Parent with subagent | Three completed background tasks are typed `bash`; no subagent lifecycle update variants or child session records are supplied | Background shell tasks and the shared output-reading tool do not establish a model subagent or folded child usage |

The donor's metadata describes four manifest tasks, but no background-task manifest file is included among the supplied files. We cannot inspect that absent artifact or infer its contents. The original-versus-copy claim and their relative creation times also cannot be established from masked summary timestamps alone.

These limitations concern what this export can demonstrate, not whether the donor has such sessions locally. They are not evidence of Grok generating duplicate IDs or invalid timestamps.

## Retained artifact and checks

`evidence.json` contains the eleven terminal usage projections, ordered event-window counts, observed integrity counts and explicit provenance. Numeric update timestamps receive one common whole-day shift; reported costs, raw tool arguments/results, transcript text, paths and account metadata are excluded. Already-collapsed prompt IDs are retained to make the defect explicit. Other identifiers are omitted or replaced. The original input is not a public artifact and has not been posted to the tracker.

The original export was checked for complete nonoverlapping event turn windows, one terminal per ordinal window, numeric usage arithmetic, matching model calls/loops/first-token counts, tool-ID multiplicities, empty session B, background task types and damaged timestamp/ID fields. These checks passed with the limitations recorded above. The small retained artifact can be rechecked with `python3 research/grok-build-fixtures/verify_donor.py`; full-input stream counts are recorded observations, not recomputed from the reduced file.

## Targeted follow-up request for the donor

Thank you, the multi-turn usage records filled an important gap. A small corrected export would let us finish the identity checks:

1. Preserve distinct IDs with a single shared replacement map across all selected files. Apply it to both camelCase and snake_case fields, including `prompt_id`, `tool_call_id`, `toolCallId`, session/parent/child IDs and task IDs. Exclude these fields from generic text masking. Different original values must remain different and equal values must stay equal across files.
2. Preserve valid ISO timestamps and numeric timestamps, or shift both by the same whole-day offset. Do not mask date digits or timezone syntax. Durations and counters should stay numeric.
3. Supply an original and an actual resumed or forked session with recorded updates/events in both, plus safe lineage fields. The supplied second session is empty, so it cannot establish copied-history behavior. One or two turns per side is enough if their relationship is preserved.
4. For subagents, include a real parent/child model-agent pair and the parent's spawn/completion records, with both sessions' usage. The supplied completed tasks are background shell processes. The output-reading tool handles both types, so its presence alone is insufficient.

Only selected `summary.json`, `updates.jsonl`, `events.jsonl` and `usage.json` if present are needed. Remove private free text, code, raw tool arguments/results, account data and secrets; exclude auth/config credentials. Preserve safe model IDs, token counters, lifecycle types and linkage. Existing sessions are sufficient; there is no need to generate new usage solely for this request.

The fixture task remains open for these accounting gaps and the previously listed provider, restored-history, conditional workflow and platform qualification limits. No policy decision or implementation was completed by this inspection.

## V2 follow-up received as an excerpt

The owner supplied a truncated v2 JSON paste and a screenshot of the donor's inspection summary. The only matching local download still has v1 metadata and the original size; the full v2 file has not been validated. `v2-excerpt.json` retains only selected safe fields from the visible paste. The donor reports preserved timestamps/enums, ten true prompt-ID mappings, no populated source/copy pair, and no actual subagent records on disk. Stop requesting those unavailable cases from this donor; their absence is now explicitly reported. It remains an evidence gap for the support plan, not permission to fabricate coverage.

The visible excerpt proves a timestamp-unit distinction: `timestamp: 1788848030` is Unix seconds, while `agentTimestampMs: 1788848030906` is milliseconds. Our initial fixture transformation incorrectly shifted the outer numeric field as milliseconds. The retained Linux and donor projections have been corrected to shift each field in its own units. Verifiers now check plausible second/millisecond ranges and, where retained, agreement between those two clocks. Token values and previously established accounting findings are unchanged. This correction affects generated fixture artifacts only; no adapter was implemented.

The pasted excerpt contains camelCase prompt/tool references but no terminal `prompt_id` or event-side tool completion. It cannot establish that the snake_case identity collapse is repaired throughout the full export. Once the complete v2 file is available, validate those references, timestamp parseability, event joins, turn timing and the reported task census. The screenshot and metadata are donor reports, not substitutes for that check.
