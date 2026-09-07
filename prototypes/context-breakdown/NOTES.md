# Context breakdown in the Stats top block

Throwaway prototype. One self-contained demo: `index.html`, built by `build.py`
from the accepted page in `../stack-page-compact` (template, prod data, every
variant) plus `variants9.js` and `ctx.json`.

Question: how should a "context breakdown" read next to the headline strip,
given what the logs can actually carry (see
`docs/research/context-composition-from-session-logs-2026-09.md`)? The
`/context` categories are not recoverable from Claude Code's JSONL, so every
variant draws the "B plus" split: shared prefix (system prompt and tools, the
cross-session cache read of a session's first call), session setup (CLAUDE.md,
memory, listings, first prompt: the first call's cache write), and conversation
(everything after), against the harness's window.

Data: `ctx.json`, scanned read-only from this machine's own logs, 30 days to
2026-09-07, one entry per API response. Claude Code: 15,683 calls, 262 sessions,
median call 118K, p90 261K, max 580K, 3,403 calls over 200K; window 1M (the max
proves the `[1m]` setting; the log does not carry it). Codex: 150,881 calls,
median 109K, p90 184K, window 258,400 from `model_context_window`, 526
compactions. Codex's first-call split (11.9K cached of 18.5K) is the single
observed session from the research note, not a median.

## Round 1

Three variants, switchable with the bottom bar or `?v=` (superseded, see round 2):

- `c1` Waffle - the `/context` grid, one per harness: 200 cells, one cell is
  0.5% of the window. Filled cells are the median call in the three colors,
  outlined cells reach the p90, the rest is free space. Legend with tokens and
  share of window.
- `c2` Gauge rows - one full-width bar per harness sized to its window, the
  three fills to the median, p90 and max as ticks, and a 20-bin fill histogram
  under each bar (Claude's is real, Codex's is a stand-in shape).
- `c3` Distribution - the 25K-bin histogram of every Claude Code call by
  context size, the fixed overhead shaded, the 200K line marked, and a facts
  row per harness (median, p90, share of window, calls over 200K or
  compactions).

Open questions the variants surface:

- On a 1M window the waffle is 88% empty. That is the honest picture, but the
  grid spends most of its area saying "free". The 200K line in c3 may be the
  more useful reference for readers on the default window.
- The three colors follow the palette, not the accent, per the charts rule.
- Every figure here is a median or p90 over calls, which the server folds from
  `log-buckets` atoms. None of these atoms exist yet; section 6 of the research
  note proposes them.

Run: `python3 build.py`, then open `index.html`. Variants: `?v=c1`, `?v=c2`,
`?v=c3`. The other 44 variants of the host page are still reachable behind the
bar's `…` button.

## Round 2

Operator verdict on round 1: c1, but drop every other prototype version and
toggle. The host is the page as committed, and only the addition matters.

One render, no bar. The waffle block leaves the top block and becomes a
**Context** row at the head of the Stats accordion, before Time, in the shape
of the production rows: head line with the median call and its share of each
harness's window, body with the two grids and legends.

## Round 3, locked

Operator notes on round 2, applied: the "one cell" and "median API call" notes
are cut, the rule inside the legend is gone, and the rows got plain names:
harness (system prompt and tool definitions, the cross-session cache read),
instructions (CLAUDE.md, memory, skills, agents, first prompt: the first call's
cache write), usual chat (the median call after those two), long chat (the p90
call after those two, so both chat rows compare directly), free. Hover titles
carry the definitions. The Context row opens by default.

Verdict: locked on 2026-09-07. This render is the reference for the build.
