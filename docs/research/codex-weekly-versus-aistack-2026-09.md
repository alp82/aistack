# Codex weekly tokens versus aistack Actual Usage

Research date: 2026-09-01. Question: why can Codex show 7.4B tokens for the
week of 2026-08-09 while aistack shows 573.5M tokens for the last 30 days,
after an earlier aistack reading was about 2.1B?

Implementation note: the comparison led to a product correction. The shared
fold now uses the cache-inclusive processed total and the page shows fresh and
cached amounts separately.

This note separates facts established in source from hypotheses that need one
controlled comparison. The Codex account backend does not publish the formula
behind its aggregate `tokens` bucket, so no source-only answer can prove the
composition of the 7.4B figure.

## Established facts

### The current aistack headline is Codex's fresh-token convention

The Codex rollout field `cached_input_tokens` is a subset of `input_tokens`.
The aistack adapter maps a response to:

```text
fresh input = input_tokens - cached_input_tokens
cache read  = cached_input_tokens
output      = output_tokens
```

It sums `last_token_usage`, the per-response delta, rather than repeatedly
summing the cumulative session total. See
[`packages/cli/src/harness/codex/analyzer.ts`](../../packages/cli/src/harness/codex/analyzer.ts)
at `ingestEvent`.

The current page fold defines its headline as `input + output + cacheWrite` and
leaves `cacheRead` out. For Codex, aistack currently records cache writes inside
fresh input, so its Codex headline is algebraically `input_tokens -
cached_input_tokens + output_tokens`. See
[`packages/workflow-rules/src/usage.ts`](../../packages/workflow-rules/src/usage.ts)
at `totalOfTokens`.

That matches Codex's own local `/status` single-number display convention.
It does not match the account activity chart, as the empirical comparison
below establishes. Upstream Codex
defines `blended_total()` as non-cached input plus output and calls it the
primary count for displaying one absolute value. `/status` uses that value.
Sources: [Codex `TokenUsage` at commit a17ee57](https://github.com/openai/codex/blob/a17ee5705c270ef5f243bd7f22c845341768f365/codex-rs/protocol/src/protocol.rs#L2393-L2400)
and [the status card](https://github.com/openai/codex/blob/a17ee5705c270ef5f243bd7f22c845341768f365/codex-rs/tui/src/status/card.rs#L345-L355).

### The CLI preview and the web headline still use different totals

The snapshot built for the interactive sync preview still uses the shared
aggregate's cache-inclusive `totalTokens`. The day rows preserve all four atoms,
but the server's current page fold excludes cache reads. Tests explicitly lock
this transitional difference: adding `cacheRead` back to the day-fold headline
recovers the snapshot figure. Sources:
[`packages/cli/src/usage/days.test.ts`](../../packages/cli/src/usage/days.test.ts)
at the test comment around lines 194-196,
[`packages/cli/src/sync/summary.ts`](../../packages/cli/src/sync/summary.ts) at
`payloadBlock`, and
[`packages/workflow-rules/src/usage.ts`](../../packages/workflow-rules/src/usage.ts)
at `totalOfTokens`.

Therefore, a sync preview near 2.1B and a page headline near 573.5M are not
necessarily two scans disagreeing. They can be two projections of the same
atoms. The preview does not currently print the cache-read atom needed to
reconcile them.

### The Codex account chart is a server aggregate, not a local-log fold

The open-source client fetches `GET /wham/profiles/me` for ChatGPT-backed
authentication. The response contains `lifetime_tokens`, `peak_daily_tokens`,
and daily buckets with only `{start_date, tokens}`. The client passes those
values through and sums seven daily values for each Sunday-based weekly column.
It does not derive the bucket from local rollouts and does not reveal what the
backend included in `tokens`. Sources:
[backend client types](https://github.com/openai/codex/blob/a17ee5705c270ef5f243bd7f22c845341768f365/codex-rs/backend-client/src/types.rs#L509-L529),
[profile endpoint](https://github.com/openai/codex/blob/a17ee5705c270ef5f243bd7f22c845341768f365/codex-rs/backend-client/src/client.rs#L351-L363),
and [weekly aggregation](https://github.com/openai/codex/blob/a17ee5705c270ef5f243bd7f22c845341768f365/codex-rs/tui/src/chatwidget/tokens/chart.rs#L384-L447).

OpenAI's help documentation says the account token history separates uncached
input, cached input, and output tokens. It also says Personal Analytics reads
the ChatGPT backend and is scoped to the signed-in identity and active account.
This establishes that the backend knows cached input separately and has broader
account scope than one local directory. It does not establish whether the
single weekly `tokens` bucket adds cached input into its total. Source:
[OpenAI, Reviewing Work and Codex usage](https://help.openai.com/en/articles/20001478).

### Aistack's scanner is intentionally local and selective

Aistack reads only `$CODEX_HOME/sessions` on the machine running sync. It
deliberately excludes `archived_sessions`. It can also omit unreadable files,
zstd files on unsupported Node versions, files whose modification time is
outside the scan window, files that fail the genuine-rollout fingerprint,
responses without `last_token_usage`, responses without a model context, and
fork replay records written within 500 ms of the child session's metadata.
Sources:
[`packages/cli/src/harness/codex/scan.ts`](../../packages/cli/src/harness/codex/scan.ts)
and
[`packages/cli/src/harness/codex/analyzer.ts`](../../packages/cli/src/harness/codex/analyzer.ts).

The fork replay exclusion is required. A fork copies already-counted parent
usage into the child rollout, so retaining it would inflate the local total.
The guard landed in commit `0693fcb2` after local evidence found 763M fresh
tokens of replay within one 30-day sample. A rerun after that change can
legitimately reduce stored daily totals.

The web read folds every synced machine by default and one machine when a
machine ordinal is selected. This does not bridge unsynced machines, missing
local histories, or account activity that never produced a local rollout. See
[`convex/measured.ts`](../../convex/measured.ts) at `getUsageByStackSlug`.

### Live daily reconciliation shows the formulas usually agree

A read-only reconciliation on 2026-09-01 compared Codex profile buckets with
the guarded local analyzer on the same UTC dates:

| Date | Codex profile | Guarded local | Gap |
|---|---:|---:|---:|
| 2026-08-24 | 372.0M | 35.0M | 337.0M |
| 2026-08-25 | 674.0M | 19.0M | 655.0M |
| 2026-08-26 | 229.1M | 227.5M | 1.6M |
| 2026-08-27 | 147.0M | 58.0M | 89.0M |
| 2026-08-28 | 410.0M | 360.0M | 50.0M |
| 2026-08-29 | 201.8M | 200.2M | 1.6M |
| 2026-08-30 | 605.4M | 602.1M | 3.3M |
| 2026-08-31 | 228.8M | 228.3M | 0.5M |

The guarded local column here is cache-inclusive: it sums each response's
`input_tokens + output_tokens`, where `input_tokens` already contains cached
input. In normalized aistack atoms it is `input + cacheRead + output`.

On four dates the two independent cache-inclusive totals agree within 3.3M,
including busy days. This is first-party behavioral evidence that the Codex
profile bucket includes cached input once. It also confirms that aistack's
guarded response-delta extraction can reproduce the account backend closely
when both sides see the same activity.

The missing usage is concentrated instead of proportional. The four larger
gaps total about 1.131B, led by 2026-08-24 and 2026-08-25. This shape points to
missing sources, threads, or records on selected days rather than a global
multiplier.

The same comparison confirms that the fork replay guard is required. Without
it, the local raw totals for 2026-08-30 and 2026-08-31 were about 6.09B and
4.96B, versus profile buckets of 605.4M and 228.8M. The guarded readings were
602.1M and 228.3M. `archived_sessions` was empty in this sample, so archive
policy does not explain these particular gaps.

## Ranked hypotheses

### H1. Codex profile totals and the aistack headline use different categories

Confidence: high, established empirically for the compared dates.

The Codex profile matches local `input_tokens + output_tokens`, which includes
cached input once. The aistack web headline is fresh input plus output, with
cache reads excluded. The original headline arithmetic is consistent with
that difference:

```text
573.5M / 7.4B = 7.75%
1 - 7.75%      = 92.25%
```

A 92.25% cached share is plausible for Codex, and the repo's earlier local
research found Codex-heavy samples around 98% cache reads in an all-processed
sum. See
[`docs/research/token-headline-conventions-2026-09.md`](token-headline-conventions-2026-09.md).

The ratio is not itself a proof for the week of 2026-08-09 because 7.4B is a
fixed week while 573.5M is a rolling 30-day fresh total. The daily matched
sample is the proof of category composition. The practical conclusion is that
the account chart and the current web headline should not be expected to show
the same number.

Falsification for the historical week: retrieve the official uncached-input,
cached-input, and output breakdown for 2026-08-09 through 2026-08-15 and
compare its all-processed and fresh projections with the same local atoms.

### H2. Selected account threads are absent from the scanned rollout set

Confidence: high.

The Codex figure comes from the signed-in account backend. Aistack sees the
current machine's live `sessions` tree plus any other machines that separately
synced to the same stack. Cloud tasks, another installation, another
`CODEX_HOME`, deleted local data, and archived sessions can be present in the
account aggregate while absent locally. The published sources do not enumerate
exactly which of those surfaces feed the bucket, so each must be checked rather
than assumed.

The concentrated daily gaps are the expected signature: some account activity
is missing, while dates dominated by locally present threads match. Empty
`archived_sessions` removes one candidate for this sample but leaves other
machines, cloud or separate tasks, alternate homes, deleted rollouts, and
scanner exclusions.

Falsification: reconcile the largest-gap date, 2026-08-25, thread by thread.
For every local thread active that day, compare its guarded rollout sum with
Codex's read-only thread usage. Then use the Codex UI's high-usage chat list to
identify account threads with no local rollout path. If every account thread
has a local file and every per-thread pair matches, the missing-source
hypothesis is false.

Codex's app-server protocol supports a read-only usage request for a thread and
returns net-new input, cached input, input, output, and total fields. This is a
better seam for the experiment than calling the private backend endpoint
directly. Source:
[Codex app-server README at commit a17ee57](https://github.com/openai/codex/blob/a17ee5705c270ef5f243bd7f22c845341768f365/codex-rs/app-server/README.md#L2480-L2488).

### H3. Genuine records on gap dates are being skipped locally

Confidence: medium.

The next most likely case is that the rollout files exist but the adapter drops
some of their usage. Candidate paths are a missing `last_token_usage`, usage
before any usable `turn_context`, unreadable or unsupported files, a failed
fingerprint, or an incorrect timestamp boundary. The successful busy-day
matches show the normal delta fold is sound. They do not prove every rollout
shape on earlier dates is supported.

Falsification: produce an exclusion ledger per date and thread:

```text
all token_count deltas
= counted by model
+ fork replay skipped
+ missing model skipped
+ malformed or missing usage skipped
```

Also record files found, read, unreadable, foreign, and skipped by modification
time. A large Aug 24 or Aug 25 remainder in one exclusion class identifies the
adapter seam. No remainder moves the investigation back to H2.

### H4. The 2.1B to 573.5M reduction combined two intended changes

Confidence: high.

The page headline changed from cache-inclusive to cache-excluded in commit
`061571e6`. The fork replay guard landed later in `0693fcb2`. A fresh sync after
both changes can remove cached reads from the displayed projection and replace
fork-inflated daily atoms. The exact contribution of each change cannot be
recovered from the two headline numbers alone.

Falsification: for the same stored 30-day rows, calculate both:

```text
fresh = input + output + cacheWrite
all   = fresh + cacheRead
```

If `all` is close to 2.1B, the formula change explains that step. Re-run the old
analyzer without the fork guard against a copied fixture and compare its fresh
total with the guarded result. That isolates replay inflation without touching
the backend.

### H5. Profile and rollout dates use different day boundaries

Confidence: low-medium.

Codex's weekly chart uses Sunday through Saturday. Aistack's 30-day view uses
UTC calendar dates from today through the preceding 29 days. Aistack's `7d`
view is a rolling seven-calendar-day range, not an arbitrary historical week.
The week of 2026-08-09 is therefore 2026-08-09 through 2026-08-15 in Codex, and
cannot be compared exactly with a current `7d` button later in the month.

This cannot by itself explain a 30-day value below one contained week's value.
It could move usage between adjacent daily buckets and exaggerate an individual
date's gap. Sum three-day bands around Aug 24 and Aug 25 before concluding that
the full daily difference is missing. If the wider bands still differ by about
the same amount, timezone boundaries are not the cause.

## The shortest decisive experiment

1. For the week of 2026-08-09, compare both projections over identical dates:
   `fresh = uncached input + output` and `all = fresh + cached input`.
2. For the residual coverage question, choose 2026-08-25 as the gap day and
   2026-08-30 as the control day.
3. Enumerate local thread ids active on each day from Codex's state database,
   keeping paths and titles private. Resolve each id to its rollout and note
   missing paths, source, machine, and archived status as aggregate counts.
4. For every resolved thread, compare Codex read-only thread usage with the
   guarded local response-delta fold. Split both into fresh and cached tokens.
5. Account for every local exclusion with the per-thread ledger from H3.
6. In the Codex UI, identify account threads on Aug 25 that are not in the local
   id set. Classify only by surface or device, without exporting content.
7. Sum three-day bands around the dates once to neutralize timezone shifts.

This experiment has a control day where the aggregate already matches, so it
can distinguish a broken reconciliation method from the actual gap. The
category mismatch needs clearer presentation. Change the counting algorithm
only if the same local thread has a material guarded-total difference from its
server total.

## Product instrumentation suggested by the comparison

The product currently cannot explain its own 573.5M versus 2.1B projections in
the sync gate. A compact diagnostic surface should expose, for the selected
range and machine:

* headline fresh tokens;
* cache-read tokens beside it;
* an all-processed total for reconciliation, clearly labeled;
* exact UTC dates and machine scope;
* files found, read, unreadable, foreign, archived excluded, fork deltas
  skipped, and deltas skipped for missing model or usage.

That makes every hypothesis above testable from one sync without changing the
meaning of the public headline.
