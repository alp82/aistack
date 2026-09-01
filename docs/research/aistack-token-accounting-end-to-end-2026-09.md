# Aistack token accounting, end to end

Research date: 2026-09-01. Repository revision: `5061b868`.

Implementation note: this report captured the cache-excluded web behavior
before the follow-up change. The shared fold now uses the cache-inclusive
processed total and the page shows the fresh/cached split.

Question: what does the `Actual Usage` token headline currently count, where can
it diverge from Codex app statistics, and which recent changes reduced it?

This report follows the measurement from local harness records through the CLI
wire, day replacement, server folding, and the rendered headline. Claims cite
the repository code, tests, ADRs, or git commits that own them.

## Executive finding

For a stack with current per-day readings, the web headline is:

```text
fresh input + output + cache writes
```

Cache reads are stored but excluded from the headline, model shares, harness
shares, chart points, and rankings. Reasoning tokens are not added separately
because they are already a subset of output. This rule is implemented by
`totalOfTokens` and is used by the backend fold that supplies the page
([`packages/workflow-rules/src/usage.ts`, lines 147-156 and 228-267](../../packages/workflow-rules/src/usage.ts)).
The React page displays that returned `current.totalTokens` without doing more
token arithmetic ([`src/features/usage/TopBlock.tsx`, lines 48-89](../../src/features/usage/TopBlock.tsx)).

There are two important exceptions:

1. The CLI's local preview and the old-client legacy fallback still use the
   snapshot `activity.totalTokens`, which sums all four buckets including cache
   reads. The shared snapshot aggregate's `countsTotal` includes cache reads
   ([`packages/cli/src/harness/shared/aggregate.ts`, lines 337-343 and 435-468](../../packages/cli/src/harness/shared/aggregate.ts));
   the preview prints that field ([`packages/cli/src/sync/summary.ts`, lines
   326-361](../../packages/cli/src/sync/summary.ts)); and `legacyOf` copies it
   unchanged ([`convex/lib/measuredDays.ts`, lines 297-325](../../convex/lib/measuredDays.ts)).
2. Cost still prices cache reads. Excluding them changes the display total and
   shares, not the dollar estimate. The wire retains all four buckets and the
   backend fills unpriced dollar rows per model and date
   ([`packages/cli/src/usage/days.ts`, lines 78-130](../../packages/cli/src/usage/days.ts);
   [`convex/measured.ts`, lines 2199-2296](../../convex/measured.ts)).

This means the current web headline can be much smaller than a Codex app number
that includes cached input. A direct comparison needs the app statistic's exact
definition plus aistack's hidden `cacheRead` amount. The repository does not
define the Codex app backend's weekly or lifetime statistic, so its composition
cannot be proven here.

## Codex accounting at the scanner

### Per-response source and normalization

The scanner reads only `~/.codex/sessions` or `$CODEX_HOME/sessions`, recursively,
including `.jsonl` and `.jsonl.zst`. It deliberately excludes
`archived_sessions` ([`packages/cli/src/harness/codex/scan.ts`, lines 25-54](../../packages/cli/src/harness/codex/scan.ts)).
That exclusion makes aistack lower than an account-level service statistic when
recent sessions have been archived locally.

Each accepted `event_msg/token_count` contributes `info.last_token_usage`, the
per-response delta. The scanner never sums `total_token_usage`, which is the
cumulative session value and would overcount by orders of magnitude
([`packages/cli/src/harness/codex/analyzer.ts`, lines 8-18 and 193-216](../../packages/cli/src/harness/codex/analyzer.ts);
[`docs/research/codex-session-log-anatomy-2026-08.md`, lines 52-77](codex-session-log-anatomy-2026-08.md)).

Codex's OpenAI-shaped cached count is a subset of input. The adapter normalizes
one delta as:

```text
fresh input = input_tokens - min(cached_input_tokens, input_tokens)
cache read  = min(cached_input_tokens, input_tokens)
output      = output_tokens
cache write = 0
```

([`packages/cli/src/harness/codex/analyzer.ts`, lines 20-23 and 204-213](../../packages/cli/src/harness/codex/analyzer.ts)).
`reasoning_output_tokens` is used only as a workflow thinking measurement and is
not added to tokens, because it is inside output ([same file, lines 246-258](../../packages/cli/src/harness/codex/analyzer.ts)).

The hard-coded zero for Codex cache writes is a future audit point. The current
adapter contract says Codex reports no writes. If a newer Codex rollout starts
populating a distinct cache-write field, aistack will undercount it until the
mapping changes. The older source research records a
`cache_write_input_tokens` member in the general `TokenUsage` shape but does not
establish nonzero local values
([`docs/research/codex-session-log-anatomy-2026-08.md`, lines 52-67](codex-session-log-anatomy-2026-08.md)).

### Forks, duplicates, and retries

Codex forked rollouts can replay the parent's `token_count` history into the new
file with new timestamps. Commit `0693fcb2` added a 500 ms replay guard. It drops
usage written in the fork-creation burst, including replayed usage that follows
a replayed `turn_context`. The code records that one observed machine had 763M
fresh tokens of such duplicate history inside 30 days
([`packages/cli/src/harness/codex/analyzer.ts`, lines 103-116 and 218-229](../../packages/cli/src/harness/codex/analyzer.ts);
[`packages/cli/src/harness/codex/analyzer.test.ts`, lines 228-260](../../packages/cli/src/harness/codex/analyzer.test.ts)).

Within a normal rollout, every nonzero `last_token_usage` is counted. A zero
delta used for a rate-limit-only refresh is ignored. Therefore:

- a retry that actually consumed tokens is counted if Codex emitted a nonzero
  usage delta for it;
- a network or rate-limit retry with no usage is not counted;
- the adapter does not infer retries from errors or UI events;
- replayed parent deltas in a fork are removed by the replay guard.

This follows directly from the nonzero check and unconditional add after it
([`packages/cli/src/harness/codex/analyzer.ts`, lines 193-245](../../packages/cli/src/harness/codex/analyzer.ts)).

Codex compaction records are not read directly by this adapter. The adapter
counts a compaction's model work only if Codex also emits it through a normal
`token_count/last_token_usage` event. The source research identifies a separate
`compacted` rollout record but does not prove that every compaction request emits
a token delta ([`docs/research/codex-session-log-anatomy-2026-08.md`, lines
34-43](codex-session-log-anatomy-2026-08.md)). This is another concrete audit
point if aistack is lower than Codex app statistics.

### Coverage exclusions

The Codex scanner also omits:

- records outside the scan timestamp window;
- rollout files whose modification time predates the window, based on the
  append-only assumption;
- unreadable or corrupt files;
- zstd files on a runtime without zstd support;
- files that fail the genuine-Codex fingerprint;
- a usage delta with no preceding model-bearing `turn_context`;
- untimestamped usage from the per-day web reading, although it remains in the
  legacy snapshot aggregate.

The file and fingerprint behavior is in
[`packages/cli/src/harness/codex/scan.ts`, lines 44-121 and 268-313](../../packages/cli/src/harness/codex/scan.ts).
The context and timestamp behavior is in
[`packages/cli/src/harness/codex/analyzer.ts`, lines 121-171 and 218-242](../../packages/cli/src/harness/codex/analyzer.ts),
and the per-day seam explicitly returns without a timestamp
([`packages/cli/src/harness/shared/aggregate.ts`, lines 202-242](../../packages/cli/src/harness/shared/aggregate.ts)).
Unreadable, unsupported, and foreign file counts are surfaced in the sync
preview rather than silently hidden
([`packages/cli/src/sync/summary.ts`, lines 253-302](../../packages/cli/src/sync/summary.ts)).

## Other harnesses and what is summed

The CLI scans every active adapter and creates one harness row per day. It then
concatenates those harness rows under the date. There is no cross-harness
response identity or deduplication
([`packages/cli/src/sync/stage.ts`, lines 158-231](../../packages/cli/src/sync/stage.ts);
[`packages/cli/src/usage/days.ts`, lines 157-173](../../packages/cli/src/usage/days.ts)).
Ordinary Claude Code, Codex, Pi, and opencode histories describe distinct work,
so summing is intended. Copied or imported work recorded by two harnesses would
be counted twice.

The harness-specific rules are:

- Claude Code uses four disjoint fields: uncached input, output, cache creation,
  and cache read. Repeated records for one message contain growing cumulative
  snapshots, so the analyzer keeps the largest contribution for a message id
  rather than summing records. Same-id records under another request id are
  treated as replays and folded, not added
  ([`packages/cli/src/harness/claude/analyzer.ts`, lines 8-25 and 286-358](../../packages/cli/src/harness/claude/analyzer.ts)).
- Claude `usage.iterations` named with a different model are counted as real
  fallback attempts. Same-model and modelless iterations are skipped as mirrors.
  The repository's measured corpus found 63,634 of 63,638 non-advisor
  iterations were modelless byte-exact mirrors. A genuinely billed modelless
  retry would therefore be an intentional undercount in favor of avoiding an
  observed near-2x double count
  ([`packages/cli/src/harness/claude/analyzer.ts`, lines 422-492](../../packages/cli/src/harness/claude/analyzer.ts)).
- Pi records input, output, cache read, and cache write as disjoint counters.
  Compaction and branch-summary `usage` are counted as real spend, but embedded
  `retainedTail` messages are not walked because they duplicate earlier entries.
  Forked or cloned entries are deduplicated across files by a composite key
  ([`packages/cli/src/harness/pi/analyzer.ts`, lines 8-23, 196-213, and
  239-282](../../packages/cli/src/harness/pi/analyzer.ts)).
- opencode maps its four disjoint token fields directly, never adds reasoning,
  and deduplicates message ids across its v1 and v2 database projections
  ([`packages/cli/src/harness/opencode/analyzer.ts`, lines 8-17 and
  97-202](../../packages/cli/src/harness/opencode/analyzer.ts)).

All of these harnesses retain cache reads in the day wire. The server headline
applies the same cache-excluding `totalOfTokens` rule after combining them.

## Sync replacement and server folding

The CLI builds a complete atom set for each local UTC date. It fetches a
manifest for the machine, compares each day's content fingerprint, and sends
missing or changed dates plus today. A missing manifest sends the full retained
window. The manifest can request up to 400 days
([`packages/cli/src/usage/diff.ts`, lines 1-91](../../packages/cli/src/usage/diff.ts);
[`docs/adr/0010-the-cli-ships-only-the-days-the-server-lacks.md`](../adr/0010-the-cli-ships-only-the-days-the-server-lacks.md)).

On receipt, the backend replaces an existing row for exactly
`(stack, machine, date)` or inserts it. It never adds a re-synced row onto the
old row, which prevents repeated syncs from multiplying totals. It also never
prunes stored days server-side
([`convex/lib/measuredDays.ts`, lines 220-278](../../convex/lib/measuredDays.ts);
[`docs/adr/0011-measured-data-is-days-plus-a-live-inventory.md`](../adr/0011-measured-data-is-days-plus-a-live-inventory.md)).

At read time, the page selects whole UTC dates. `30d` is today plus the previous
29 UTC dates, `7d` is today plus six, and `24h` is today only. These are calendar
day windows, not exact trailing-hour windows
([`packages/workflow-rules/src/usage.ts`, lines 323-347](../../packages/workflow-rules/src/usage.ts)).
It folds all selected day atoms and derives the headline and shares at read time.
The page does not reuse the snapshot total
([`convex/measured.ts`, lines 2199-2296 and 2339-2405](../../convex/measured.ts)).

### Multiple machines

Without a machine selection, `getUsageByStackSlug` folds every machine's rows
together. With `machineOrdinal`, it filters to that machine
([`convex/measured.ts`, lines 2299-2369](../../convex/measured.ts)). Token and
session atoms are assumed disjoint across machines, so summing is intentional.
There is no cross-machine session identity. If the same rollout directory is
copied to two machines and both publish it, the default view double-counts it.
The machine selector is the diagnostic isolation mechanism.

The per-machine replacement boundary has a release consequence: a corrected
CLI only rewrites the days for the machine that runs it. Other machines retain
their old rows until they also resync. The unfiltered stack headline can
therefore mix corrected days from one machine with fork-inflated days from an
older CLI on another machine.

## Recent reductions

Two changes on 2026-09-01 materially lowered reported totals:

1. Commit `061571e6` changed `totalOfTokens` from
   `input + output + cacheWrite + cacheRead` to
   `input + output + cacheWrite`. It affects the web headline, model and harness
   shares, charts, leaderboard, and cost coverage denominators at read time. It
   does not remove cache reads from stored rows or dollar pricing. Because the
   rule is server-side in the shared fold, already-published day rows need no
   resync for this reduction.
2. Commit `0693fcb2` added the Codex fork replay guard after measuring 763M of
   duplicated fresh tokens on one machine over 30 days. This is a scanner
   correction, so the affected machine must run the updated CLI. Changed day
   fingerprints cause those dates to be sent and replaced. Every contributing
   machine must resync independently.

CLI versions around these changes were `0.12.1` for the cache-headline commit,
then `0.12.2` after the fork guard, with the repository currently at `0.12.3`
([`packages/cli/package.json`](../../packages/cli/package.json); commits
`061571e6`, `0693fcb2`, `025c622c`, and `5061b868`). The cache change itself is
a backend/shared-rule change, while the replay fix requires the newer scanner.

## Best next diagnostics for a remaining mismatch

The repository evidence supports this order:

1. Compare the same date range and one machine. Select the machine in aistack,
   then compare its current UTC dates with the Codex app bucket. The default
   aistack view is a sum across machines.
2. Compare both token conventions. Retrieve or expose
   `current.tokens.cacheRead`; compare Codex's number against both
   `current.totalTokens` and `current.totalTokens + current.tokens.cacheRead`.
   This distinguishes a cache-definition mismatch immediately.
3. Confirm every machine contributing to the stack has published with CLI
   `0.12.2` or newer after the fork guard. The inventory read already carries
   `cliVersion` per machine and harness ([`convex/measured.ts`, lines
   2419-2435](../../convex/measured.ts)).
4. Inspect the sync preview's coverage lines for unreadable, foreign, or
   unsupported compressed rollouts. Also count recent files moved to
   `archived_sessions`, which aistack deliberately does not scan.
5. Audit current Codex rollout samples for nonzero cache-write usage and verify
   whether compaction API calls always produce `last_token_usage`. These are the
   two remaining Codex-format assumptions that can create a systematic
   undercount.
6. Make the CLI preview use the per-day fold or label its all-inclusive total.
   Today it can show a different token number than the page for the exact same
   scan because it includes cache reads.

The decisive product improvement would be to show the cache-read quantity next
to the headline and expose an accounting label such as `fresh + output + cache
writes`. That makes both reconciliation totals available without changing the
stored wire or cost calculations.
