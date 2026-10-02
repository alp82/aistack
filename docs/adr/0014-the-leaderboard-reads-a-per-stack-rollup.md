# The leaderboard reads a per-stack rollup

Before this decision `/leaderboard` derived every figure at read time. Scope ticket
[#82](https://github.com/alp82/aistack/issues/82) recorded that as a consequence: reads
are live, there is no rollup table and no cron, and "a later rollup must reproduce these
numbers exactly". `leaderboard.get` scanned `stacks`, and for each stack read its
inventory, every measured day it ever published (an unbounded `by_stack` read, filtered
to 30 days in JavaScript) and its creator, then folded the days.

That stopped fitting. A Convex function gets one second of JavaScript time
(`DATABASE_UDF_USER_TIMEOUT_SECONDS`, default 1; database waits do not count). With 9
measured stacks on prod one uncached run of the query already cost about that second.
The query calls `Date.now()`, so Convex drops its cached result after 17 seconds and the
next visitor pays the full cost again. About half of the `/leaderboard` requests returned
HTTP 500 with "Function execution timed out (maximum duration: 1s)". `leaderboard.model`
and the Discord commands read the same population and share the problem. The cost grows
with every stack and with every day of history, so the limit was already reached at 9
stacks, far below the low thousands #82 estimated.

We decided that **the board reads one precomputed row per measured stack**, a
**leaderboard rollup** in `leaderboardRollups`, written at sync time. This reverses the
recorded consequence of #82 and keeps its condition: the rollup board equals the live
board field for field at the same instant.

There is one derivation. `deriveFigures` in `convex/leaderboard.ts` turns a stack's
inventory and its window of days into board figures. The live read called it inside the
query for every stack. `leaderboard.refreshStack` calls it for one stack in a mutation
of its own and stores the result. The rollup's day read is bounded to the 30-day window
through the `by_stack_date` index. Convex cannot project fields, so a day row still
arrives with its `workflow` block, which the board does not use; reading 30 dates per
machine instead of the whole history is the lever.

## What is stored and what is read live

A rollup stores what depends only on the stack's measured rows, the window and the price
table: `lastSyncMs`, tokens, sessions, the per-day points, the active harnesses with
their tokens, the tokens per measured model id (`unknown` kept), the spend with its
coverage, and the price-table ids. It also stores the window it was computed for and
when its content last changed. A stack with a legacy figure and no days stores that
figure. A stack with no board reading holds no row.

Everything else is read when the board is assembled, so it cannot be stale:

* **`living`** is `now - lastSyncMs <= 7 days`, evaluated on every read. A stack goes
  quiet with no write. The read is cheap now, so the 17-second cache expiry no longer
  matters.
* **`publishCost`** is checked on the stack row at read time. The flag changes nothing
  in a reading except the cost: with it off the fold returns the same tokens, sessions,
  models and harnesses and no cost. So the rollup stores the priced figure and the read
  drops it when the flag is off. A toggle shows on the next read and no writer of the
  flag needs a hook. The stored dollars are the ones already on the stack's
  `measuredDays` rows.
* **The stack's name, slug and `isLowQuality`, and the creator's name** come from the
  stack and creator rows, one `db.get` each per rollup. These change outside a sync (a
  rename, an admin flag, a sync reopening a flagged stack). Reading the rows needs no
  hook in any of those writers. The read is driven by the rollup table; `stacks` is not
  scanned.
* **Model display names** resolve against `models` at read time. The rollup keys its
  tokens by the raw measured id, which a catalog change cannot move. The rollup read
  does not touch `modelPrices`.

## When a rollup is written

* **Every sync.** `publishForToken` and `publishSnapshot` are the only writers of
  `measuredDays` and `measuredInventory`. Each schedules `refreshStack` for its stack at
  delay 0, once per publish. The refresh runs in its own mutation, so the publish keeps
  its own one-second budget and a rollup failure cannot fail a sync.
* **Every hour, on the hour.** The `leaderboard-rollup-refresh` cron schedules one
  `refreshStack` per stack that has inventory or a rollup. It folds nothing itself.
  This run catches the two things that move a rollup without a sync: the window slides
  at UTC midnight, and a price change re-prices the days the backend fills.

A refresh whose result equals the stored row writes nothing. A write invalidates the
board's cached result, so an idle hour of the cron leaves the cache alone. A stack that
lost its reading, or that no longer exists, has its row deleted by the next refresh, and
the read skips a rollup whose stack is gone.

## Staleness

A rollup can be behind the live figures in three cases:

* after a sync, until the refresh it scheduled has run. That is a moment;
* after UTC midnight, until the cron run at 00:00 UTC reaches the stack. The bound is
  one hour and in practice it is seconds;
* after a change to `modelPrices`, for the spend of days the CLI left unpriced. The
  bound is one hour.

Nothing else on the board can be stale. A refresh that fails leaves the previous row in
place, and the next cron run tries again.

Two alternatives lost. **Bounding the live read to the window** removes the unbounded
history read and keeps reads live, but the fold of every stack still runs inside one
query, so the limit returns as the population grows. **One board document** written by a
cron reads fastest, but one mutation would fold every stack and inherit the same limit,
and a sync could not update its own row without rebuilding the whole board.

## Consequences

The rollout has two phases, because an empty board must never be served. Phase A adds
the table, the write hooks, the cron, the backfill migration
`migrations/20261002_leaderboard_rollups:run` and a temporary public query
`leaderboard.getRolledUp`, while `get`, `model` and the Discord commands stay on the
live path. After the deploy the cron or the migration fills the table and the two
queries are compared on prod. Phase B moves `get` and `model` onto
`readRollupPopulation` and deletes `getRolledUp`, `readPopulation` and `readStack`.

There is no stack-delete or machine-removal path today. One that lands must call
`scheduleRollupRefresh` like the publish paths do. Until it does, the cron removes the
orphan within the hour and the read ignores it.

The cron's fan-out collects `measuredInventory` and `leaderboardRollups` in one
mutation. That is fine for hundreds of sources. It needs pagination before the
inventory table outgrows one transaction's read limit.

`measuredDays` and `measuredInventory` stay the source of truth (ADR-0011). The stack
page still folds days at read time, for one stack per request.

Builds on ADR-0011 (measured data is days plus a live inventory) and ADR-0012 (prices
are a table of periods). Reverses the read-time consequence of
[#82](https://github.com/alp82/aistack/issues/82).
