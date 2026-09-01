# Codex account token statistics and cache reads

Research date: 2026-09-01.

Question: what do the Codex app's Lifetime, daily, and weekly token figures count?
In particular, do they include cached input, and can they be compared with token
counts extracted from Codex rollout logs?

Method: source inspection of `openai/codex` at commit
`a17ee5705c270ef5f243bd7f22c845341768f365`, inspection of the official OpenAI
Responses API reference, a read-only request through the installed first-party
Codex app server, and a four-day comparison between the returned account buckets
and local rollout-log totals. No third-party descriptions are used as evidence.

## Answer

The account token activity shown by Codex includes cached input. It counts those
tokens once, inside OpenAI's `input_tokens`, then adds output. The equivalent
formula over a normalized, disjoint token shape is:

```text
fresh input + cached input + cache-write input + output
```

For current Codex logs, where `input_tokens` already includes cached input, the
same formula is simply:

```text
input_tokens + output_tokens
```

Do not calculate `input_tokens + cached_input_tokens + output_tokens` from an
OpenAI response. That double-counts the cached portion.

This result is strongly supported by first-party behavior, but one limitation
matters: the public Codex source does not contain the backend implementation that
creates `lifetime_tokens` or each daily bucket. The public client receives opaque
`tokens` values. Cache inclusion is therefore empirically established, not a
published backend contract.

## Evidence

### 1. The app and `/usage` read server-side account buckets

Codex fetches the profile from `/api/codex/profiles/me` or
`/wham/profiles/me` and deserializes only a lifetime total, a peak daily total,
and daily `{start_date, tokens}` buckets
([backend client](https://github.com/openai/codex/blob/a17ee5705c270ef5f243bd7f22c845341768f365/codex-rs/backend-client/src/client.rs#L351-L362),
[response types](https://github.com/openai/codex/blob/a17ee5705c270ef5f243bd7f22c845341768f365/codex-rs/backend-client/src/types.rs#L509-L527)).
The app server forwards those values without token arithmetic
([account processor](https://github.com/openai/codex/blob/a17ee5705c270ef5f243bd7f22c845341768f365/codex-rs/app-server/src/request_processors/account_processor.rs#L1355-L1373)).
The TUI labels the backend summary value `Lifetime`
([chart renderer](https://github.com/openai/codex/blob/a17ee5705c270ef5f243bd7f22c845341768f365/codex-rs/tui/src/chatwidget/tokens/chart.rs#L155-L165)).

The server returns daily buckets, not an independently defined weekly token
field. Codex's weekly view chunks the daily values into seven-day groups and
sums each group
([weekly aggregation](https://github.com/openai/codex/blob/a17ee5705c270ef5f243bd7f22c845341768f365/codex-rs/tui/src/chatwidget/tokens/chart.rs#L410-L445)).
This establishes the public TUI behavior. The desktop app renderer is not in the
public repository, so applying the same statement to the screenshot is an
inference from its matching account-activity surface.

### 2. The account buckets match cache-inclusive rollout totals

A read-only `account/usage/read` request through installed Codex 0.151.0 fetched
the authenticated account profile. For four recent complete UTC dates, the
server buckets were compared with guarded local rollout totals. The local total
was the sum of each non-replayed response's `last_token_usage.input_tokens +
last_token_usage.output_tokens`.

| UTC date | Server bucket | Local cache-inclusive total | Difference |
|---|---:|---:|---:|
| 2026-08-26 | 229,060,233 | 227,514,047 | 0.68% |
| 2026-08-29 | 201,801,877 | 200,217,562 | 0.78% |
| 2026-08-30 | 605,385,123 | 602,137,815 | 0.54% |
| 2026-08-31 | 228,832,392 | 228,286,860 | 0.24% |

The close match on four days, including days with very high cache use, is strong
behavioral evidence that account activity counts cached input once. The small
residual can come from fetch timing, server day boundaries, delayed reporting,
or activity absent from the local rollout set. This comparison does not identify
which cause applies.

Fork replay filtering is essential. Forked Codex rollouts replay parent token
events. Without the existing replay guard, the raw local sums for August 30 and
31 were 6,089,410,173 and 4,961,121,619. Those are about 10 and 22 times their
server buckets. This validates the recent reduction in aistack's Codex totals:
the discarded events were duplicated history, not account activity that the
Codex profile counted again.

### 3. OpenAI input is cache-inclusive

The Responses API returns `input_tokens`, with `cached_tokens` and
`cache_write_tokens` under `input_tokens_details`, plus `output_tokens` and
`total_tokens`. Official examples show `total_tokens = input_tokens +
output_tokens`, with the cache values supplied as a breakdown rather than an
additional top-level quantity
([Responses API reference](https://developers.openai.com/api/reference/cli/resources/responses/methods/create)).

Codex makes the subset relationship explicit by calculating non-cached input as
`input_tokens - cached_input_tokens`
([`TokenUsage`](https://github.com/openai/codex/blob/a17ee5705c270ef5f243bd7f22c845341768f365/codex-rs/protocol/src/protocol.rs#L2384-L2404)).
Reasoning output is likewise a breakdown inside output, so it must not be added
again to `output_tokens`.

### 4. Codex has another displayed total that excludes cache

The account activity chart and a session's local status card do not use the same
headline formula. Codex defines `blended_total` as non-cached input plus output
and calls it the primary single-value display count
([`TokenUsage`](https://github.com/openai/codex/blob/a17ee5705c270ef5f243bd7f22c845341768f365/codex-rs/protocol/src/protocol.rs#L2393-L2400)).
The `/status` card uses that value
([status card](https://github.com/openai/codex/blob/a17ee5705c270ef5f243bd7f22c845341768f365/codex-rs/tui/src/status/card.rs#L351-L355)),
and human-readable `codex exec` output uses the same calculation
([exec renderer](https://github.com/openai/codex/blob/a17ee5705c270ef5f243bd7f22c845341768f365/codex-rs/exec/src/event_processor_with_human_output.rs#L391-L396),
[formula](https://github.com/openai/codex/blob/a17ee5705c270ef5f243bd7f22c845341768f365/codex-rs/exec/src/event_processor_with_human_output.rs#L509-L512)).

Therefore:

| Surface | Formula | Cache reads |
|---|---|---|
| Account Lifetime, daily, weekly | `input_tokens + output_tokens` | Included once inside input |
| Local `/status` or human `codex exec` | `input_tokens - cached_input_tokens + output_tokens` | Excluded |
| Raw Responses API `total_tokens` | `input_tokens + output_tokens` | Included once inside input |

## Comparison guidance for aistack

Aistack can compare its normalized count to the Codex account chart when it uses
`fresh input + cache read + cache write + output`, filters fork replays, and uses
the same account and time window. This is algebraically equivalent to OpenAI's
cache-inclusive `input_tokens + output_tokens`.

A remaining discrepancy should be investigated as a coverage problem before
changing the token formula. The main candidates are:

1. The Codex account figure includes activity from another machine or cloud task
   whose rollout is not present locally.
2. The compared windows differ. The account tooltip is a calendar week, while
   aistack may show a rolling 30-day window.
3. Day boundaries, delayed server ingestion, or a partially complete current day
   differ between the two reads.
4. Old local history is absent, archived, compressed, unreadable, or outside the
   scanner's configured roots.
5. Replay filtering drops genuine work or misses a different replay shape. The
   four-day match makes a broad formula error less likely, but does not prove all
   historical Codex versions have the same fork timing.

The best next validation is a date-by-date reconciliation table, not another
headline comparison. For each overlapping date, record the server bucket, the
guarded cache-inclusive local total, fresh input, cached input, output, session
count, and rollout-file count. Dates that match validate the accounting seam;
dates that diverge point directly to coverage or deduplication.
