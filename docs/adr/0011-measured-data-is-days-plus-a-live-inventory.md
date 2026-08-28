# Measured data is days plus a live inventory, not snapshots

Before this decision the Actual Usage figures lived in `measuredSnapshots`: one
append-only row per harness per sync holding a whole 30-day payload, downsampled by a
cron after 90 days. ADR-0010 moves the usage figures to per-day atoms on `measuredDays`.
What the day wire does not carry is inventory: the installed tools, MCP servers, skills,
models seen and the harness kit, which are "latest per machine and harness", not a sum.

We decided that measured data has exactly two shapes and two tables. **`measuredDays`**
holds the combinable atoms, replace-per-date, never pruned server-side: the 400-day
limit is the CLI's send window and the page's read cap, and the database keeps every day
a machine ever published. **`measuredInventory`** holds one row per (stack, machine,
harness), replaced on every sync, carrying the inventory sets and the last sync time.
Every surface that summed a snapshot now folds days (the stack page, history charts, the
leaderboard, the landing band), and every surface that read "newest payload per source"
now reads the inventory row (freshness, the living count and done bar, stack-list
ordering, reconcile suggestions, sync config, kept-private names). `measuredSnapshots`
retires.

Two alternatives lost. Keeping the snapshot table as the inventory carrier keeps an
append-only table and its GC alive for a replace-per-source job. Putting inventory on
today's day row makes "latest inventory" depend on which day each harness last synced and
drags a copy of the tool list into 400 rows.

## Consequences

Retirement runs as a one-shot migration after the CLI release: for each source it copies
the newest snapshot's inventory into the inventory row and, for a stack with no days,
writes the snapshot's 30-day totals as a **legacy figure** (tokens, sessions, active days,
optional dollars, captured-at) on that row. The migration refuses to run while any living
stack (synced in the last 7 days) still lacks days, so a live machine converts itself on
its next session start and only stacks that never sync again fall back to the legacy
figure. The table drops after the migration.

The `measured-snapshot-gc` cron loses its snapshot half. Its 30-day aging of
`keptPrivateNames` stays; that is consent hygiene, not data retention.

History charts change shape from "rolling 30-day total over time" to a per-day series,
which is what the range selector already implies, and they honor the machine selector
for free.

Decided in [alp82/aistack#315](https://github.com/alp82/aistack/issues/315), part of
[map #302](https://github.com/alp82/aistack/issues/302). Builds on ADR-0009 (a day is
one machine's) and ADR-0010 (one row holds both halves of a day).
