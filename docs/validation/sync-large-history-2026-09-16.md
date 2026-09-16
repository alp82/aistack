# Large-history sync fixes

Gvaste's CLI 0.16.10 log showed a Cursor stack overflow after reading a
308,140-message session, a 102-second session listing, a failed account refresh,
and repeated recent/historical reads for Codex and Grok.

## Reproduced failures

- A synthetic 308,140-message Cursor session raised `Maximum call stack size
  exceeded` at `Math.min(...times)` in the real scan. Related Composer and
  account timestamp paths failed the same way. They now calculate bounds
  without passing an unbounded number of function arguments.
- Empty Cursor account windows (`{}` or a count-only zero response) and
  count-only terminal pages were rejected. These exact shapes are documented
  as live-verified by [CodexBar's Cursor integration](https://github.com/steipete/CodexBar/blob/main/docs/cursor.md#token-cost-dashboard-api).
  Tests cover them and still reject malformed arrays, error envelopes,
  inconsistent counts, and incomplete pagination. Gvaste's actual response
  body was not available, so this explains a supported cause of the warning.
- Fetching 10,000 account events required 100 requests. Pages now request
  1,000 events, reducing that fixture to ten requests. The split threshold
  remains 10,000 events. The request budget scales from 1,000 to 100 to retain
  the same maximum requested event volume.
- The installed Cursor reader's metadata SQL loaded message bodies through
  `length(CAST(value AS BLOB))` and the projected `value IS NULL` expression.
  The dependency patch uses `octet_length(value)` for both. SQLite can obtain
  this value from record metadata without reading the body, as described in
  its [function documentation](https://www.sqlite.org/lang_corefunc.html#octet_length).
  A regression test captures queries from the real reader and checks SQLite's
  compiled instructions for length/null-only column reads. Existing byte-limit
  and malformed-source tests remain in place.
- Codex's overlapping windows read each file four times, including the
  fingerprint validation passes. A shared read now feeds independent window
  states in two passes. Grok likewise feeds independent window states from
  one stable file read. Tests compare measurements with separate scans and
  count actual stream openings, including compressed Codex files.

## Validation

```sh
pnpm test packages/cli/src/harness packages/cli/src/sync src/__tests__/no-em-dash.test.ts
pnpm exec tsc --noEmit -p packages/cli/tsconfig.json
pnpm --filter @use-aistack/cli build
```

A local SQLite microbenchmark used 64 rows of 1 MiB text each, ten metadata
queries per sample, and the median of five samples. The old expressions took
24.02 ms; the new ones took 0.24 ms. Both reported 67,108,864 bytes. This is a
warm, in-memory query benchmark, not an estimate of Gvaste's Windows sync time.

No private source history, account credentials, or production database was
needed. No sync was published. A Windows run after release is still required
to measure the end-to-end improvement and confirm which account response
caused Gvaste's warning.
