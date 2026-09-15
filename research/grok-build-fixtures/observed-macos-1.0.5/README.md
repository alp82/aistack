# macOS original/fork and model-subagent evidence

Inspected the owner-supplied four-session export. Reported installed environment is Grok Build 1.0.5 (`5115b46bc909`), macOS 26.5.1 / Darwin 25.5.0 arm64. The installed version does not independently establish the producer version of every historical record. Source file hashes and a safe projection are in `evidence.json`. The manifest's original-to-sanitized ID map is deliberately excluded, as are Apple metadata files, prompts, raw tool IO, paths and costs. Originals remain unchanged.

## Identity and lineage gaps filled

Terminal prompt IDs are distinct within each session. Event completion IDs join to update tool-call IDs: 196/196 original completions, 2/2 fork completions, 435/435 parent completions, and 61/61 child completions. Some original/fork calls have no corresponding completion; do not invent completed calls for those gaps.

The fork has `session_kind: subagent_fork`, `fork_context_source: forked_verbatim`, an original-session parent link, a preserved fork prompt and `inherited_prefix_len: 8`. The original's spawn/finish records also identify it, with the finish marked cancelled. This is an actual linked fork, not proof of a resume lifecycle. Its usage is populated, but original and fork have no shared terminal prompt ID or tool-call ID. Inherited conversation context does not establish copied billable usage. This pair therefore qualifies lineage and distinct fork execution, not deduplication of replayed terminal usage.

The separate child has `session_kind: subagent` and `agent_name: general-purpose`. Its parent has a matching spawn with both parent/child IDs and a completed finish. The finish reports 61 tools, matching 61 child tool completions. Parent and child terminal/tool IDs are disjoint. This fills the missing actual model-agent pair and cross-file identity evidence.

## Accounting observations requiring a format rule

The child's terminal records 18 calls, 747748 input tokens and 6566 output tokens. The parent finishes its spawning turn with three recorded calls before the child finishes. The later `subagent-completed-<child-id>` parent turn records two calls, 34860 input tokens and 260 output tokens, marked `usageIsIncomplete: true`. It also has two parent loop starts. This wake-up turn is not an alternative serialization of the child's 18-call usage. Dropping all child files because a parent link exists would lose observable usage in this example. Conversely, this one pair does not prove child usage is never folded into another parent reading.

The original/fork pair gives a different clue: one original terminal has `modelCalls: 27`, `numTurns: 25` and an incomplete flag, while its local event window has 25 loop starts. The fork separately reports two calls. The extra two calls are consistent with folding, but the export alone does not prove their provenance or isolate their token contribution. Do not turn the numerical coincidence into a subtraction rule. It corroborates the need for source-backed attribution rather than blanket add-all or drop-all logic.

`subagent_finished.tokens_used` is 56919 for the supplied child, which differs from its 754314 billable token total. It is not a substitute for the child's usage ledger.

Some original/parent turns have synthetic prompt identities such as `subagent-completed-...` and `task-completed-...`. There are 36 terminal updates but only 35 start/end windows in the original. There is no general one-to-one ordinal join rule for all recordings. The previously validated Windows ordinal match remains specific to that sample.

## Older-record capability differences

No supplied terminal contains `elapsed_ms`. Timestamped start/end events remain available, but pairing must account for missing events and synthetic turns; unavailable duration stays absent.

Ten usage-bearing parent terminals and the child terminal report reasoning tokens greater than output tokens. For the child, reasoning is 10173 versus 6566 output, while total equals input plus output. These rows cannot directly feed a universal reasoning-is-a-subset assertion. This is an observed older-record shape difference; its normalization needs investigation before claiming thinking-token coverage. Do not add reasoning to total automatically, discard valid input/output merely because of this mismatch, or silently clamp the reasoning field as though its semantics were established.

No usage sidecars are present. Inputs/outputs, total arithmetic and per-model sums pass in the supplied usage rows. Missing and explicitly incomplete usage both occur and remain distinct.

## Validation and follow-through

Full-input checks parsed event timestamps, verified per-session terminal-ID uniqueness, matched all completion IDs, checked model arithmetic, and established both lineage pairs. The retained projection can be rechecked with `python3 research/grok-build-fixtures/verify_macos.py`; original stream-wide ID set checks are recorded observations.

This export fills the identity and actual fork/subagent-recording gaps. A resume pair is not the next request to this donor. The remaining decision-critical work is to establish the parent/child attribution rule and older reasoning normalization from the relevant implementation/fixtures, and to specify how replayed usage is handled when present. Those findings feed [Decide Grok Build support for released event-based usage](https://github.com/alp82/aistack/issues/371). The fixture task remains open until those checks are resolved or explicitly handled by the support contract. Previously listed provider, read-recovery, inventory and platform acceptance limits are not silently marked tested.
