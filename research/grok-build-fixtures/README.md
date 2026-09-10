# Grok Build planning fixtures

Progress for [Capture representative Grok Build fixtures for the planning decisions](https://github.com/alp82/aistack/issues/369), 2026-09-08. The ticket remains open. This pack is planning evidence, not an adapter or a supported-client qualification.

## Provenance and limits

The seven top-level JSON cases are **constructed**, using the public Rust schema and named upstream tests at commit `75810042ca2762aa0b0fa17864f3f68823ccbea5`. `provenance.json` records source URLs and SHA-256 hashes. Values, dates, identifiers, and the custom alias are artificial. The JSON envelope (`records`, `expected`, `sourceTests`) is this pack's format; each `records` value represents a proposed usage file. It is not a native fixture directory tree.

The initial pack contained no released-client observations. After the owner installed Grok and authorized inspection of the current session, [observed-1.0.13](observed-1.0.13/README.md) added a sanitized native recording from Linux. That release has no advertised `usage` command and the selected session has no `usage.json`; a persisted `turn_completed` event carries usage instead. See that report for the observed checks, provenance, and remaining gaps. The fixture task remains open. No upstream Rust test suite, model prompt, hook installation or sync publication was run.

## Latest donor evidence

The [macOS four-session export](observed-macos-1.0.5/README.md) fills the cross-file identity and real fork/model-subagent gaps. It reveals distinct child versus parent wake-up usage, possible folded calls in another pair, missing terminal durations and reasoning counts exceeding output in older records. Next work is attribution and format normalization, not another request for absent donor sessions.

The [full corrected Windows v2 export](observed-windows-v2-1.0.13/README.md) is now validated. It restores parseable event times, phase enums and camelCase IDs. Terminal `prompt_id` and event `tool_call_id` remain masked. Timing and within-update links are qualified; those identity joins remain unverified. The donor confirms no existing fork/subagent samples. Run `python3 research/grok-build-fixtures/verify_donor_v2.py` for the retained timing checks.

The [Windows donor export](observed-windows-1.0.13/README.md) supplies ten successful usage-bearing prompts with per-turn loop counts, filling the multi-prompt accounting gap. It also exposes sanitization damage to prompt IDs, event-side tool IDs and ISO timestamps. Its second session is empty, and its completed background tasks are shell tasks. Copy identity and actual child folding remain unqualified. The report includes a targeted request for a corrected export, using existing sessions. Check the retained projection with `python3 research/grok-build-fixtures/verify_donor.py`.

## Follow-up status

The [2026-09-09 follow-up](observed-1.0.13-followup/README.md) adds a successful turn and three terminals that omit usage. Earlier recorded usage survives subsequent rate-limited prompts. The pack still lacks two usage-bearing prompts in one session and observed fork/subagent accounting. The follow-up includes a precise owner-run capture sequence for when rate limiting clears. Run `python3 research/grok-build-fixtures/verify_observed.py` to check the retained observations.

## Available cases

| Case | What it makes concrete | What remains unproved |
| --- | --- | --- |
| normal-two-turns | 140 input and 30 output, counted from turns once | Released-file and command equivalence |
| resume-new-ledger | Resumed ledger adds 25 input and 5 output, giving 165/35 | Observed resume identity and lifecycle |
| late-update-moves-only-turn | Before: 120 tokens on September 7. After: 170 on September 8, no old contribution | Actual late-write timing; safe empty-day transport |
| copied-usage-needs-lineage | Different file session IDs can hold identical copied usage | Deterministic copy matching with observed metadata; ambiguous copies remain included under the contract |
| model-switch | Two recorded model keys survive independently | Historical provider evidence and exact pricing fallback for aliases |
| valid-partial-with-extra-field | Usable recorded totals coexist with incomplete coverage and an extra field | Released-client capability detection |
| malformed-contribution | One invalid field beside a valid turn | Salvage and completeness interface; transient failure must not reduce published days |

The command source serializes the loaded `SessionUsageFile`. Selecting one turn still includes whole-session totals. A future equivalence check must compare parsed, normalized JSON, not bytes, and must not add the `session` totals to the selected `turns`. See `usage_cmd.rs` in the provenance manifest.

## Evidence still required before resolution

| Area | Minimal missing evidence | Owner step or later validation |
| --- | --- | --- |
| Released format | 1.0.13 Linux event-based usage observed; newer sidecar/command equivalence still absent | Select the support contract for both formats, then qualify the relevant recordings |
| Copy accounting | Source/copy metadata and usage for resume, fork and restored history, including incomplete ancestry | Select existing linked examples; preserve equality relationships when replacing identifiers |
| Subagent folding | Parent/child usage and matching spawn/finish/attempt records, including unfinished or resumed children | Select existing examples; counters alone cannot qualify the event join |
| Workflow | Minimal matched records for turn duration, phase tools, questions, searches, skills, MCP, effort changes and handoff | Inspect authorized events locally; retain only necessary field shapes with artificial contents and identifiers |
| Pricing | Model changes, missing provider, known custom alias mapping and a model lacking an exact rate | Retain safe model/provider mapping evidence without credentials, endpoint secrets, or private config contents |
| Discovery | Default/custom home, encoded/hashed workspace paths, history older than 30 days but within 400 | Recreate layout in a temporary fixture root with invented project paths; do not scan the whole disk |
| Recovery | Stable partial recording versus changing/unreadable file, missing date attribution, and genuine date movement | Inject faults into copies in a temporary root after a native format is qualified; never alter owner originals |
| Inventory | Native, compatible and plugin sources, precedence, disabled/trust-blocked states, and observed use | Select minimal configuration and event samples; never grant trust or treat configuration as invocation |
| SessionStart | Native/imported coexistence, source ownership and reload behavior | Existing authorized observations or first-party evidence; no hook installation under this ticket |
| Platforms | Native launch behavior on Linux, macOS and Windows, including spaces in executable paths | Record unavailable platforms explicitly. Full implementation smoke checks belong to release acceptance |

Do not mark this task complete from the constructed pack alone. Do not convert missing native evidence into a supported capability or silently unblock [Decide the Grok Build execution sequence and release acceptance](https://github.com/alp82/aistack/issues/370).

## Owner handoff

1. Identify the installed Grok executable and machine. The owner can run `grok --version` and `grok usage --help` in their own terminal to confirm the available command and version.
2. Choose an existing ordinary session and, where available, related resumed/forked/subagent sessions. Authorize those specific directories for local inspection, or prepare sanitized copies. Do not paste raw transcripts or configuration on the tracker.
3. For a chosen stable session, compare `grok usage <session-id>` with its `usage.json` locally. Retain the client version, OS, safe schema, numeric usage and artificial identifier relationships. Preserve timestamp relationships and UTC boundaries when shifting dates.
4. Sanitize prompts, outputs, raw arguments, repository names and paths, account data, URLs and credentials. Preserve only the fields needed for each check; minimal artificial tool arguments may stand in for private arguments. Label transformed observations separately from wholly constructed cases.
5. If no examples exist, report that gap first. Creating sessions, login, paid prompts, hook installation and sync publication require separate owner action or authorization; none follows from this pack.

A retained observed fixture should record client version, OS, scenario, source file kind, collection method, whether the source was stable, transformations performed, and the relevant source pin. The observed release is 1.0.13; its source equivalence and broader scenario coverage remain unqualified.
