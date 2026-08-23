# A measured source is a harness on a machine

The current measured layer is the newest snapshot per `(harness, machine)`, not per
harness. Two machines running the same harness measure disjoint sessions, so their
readings sum, exactly as two harnesses on one machine already did.

The machine is the publishing token's `name`, stamped server-side at insert. The payload
never names it. A client that could name its own bucket could split one machine's history
in two or merge itself into another machine's, and the token already carries the name the
owner typed at link time.

The name is the key rather than the token id. Relinking a machine mints a second token, so
by id one machine would hold two buckets and the dead one would carry a stale reading
forward forever. The cost is that two machines the owner names the same merge into one.

## Rows written before tagging are superseded, not backfilled

A row with no `machine` is a whole-harness reading. It is held while nothing else measures
that harness, and dropped the moment any machine of that harness reports.

Which machine wrote such a row was never recorded, and unlike `harness` it cannot be
recovered from the payload. So there is no backfill to run, only a guess to encode, and
`measuredSnapshots` is append-only by design. Summing an untagged row with a tagged one
would count the same sessions twice, and carry-forward never expires, so the double count
would be permanent rather than transient.

The eviction is evaluated at each point on the trail, not once. A reading that was the
whole truth about a harness in March must still read that way in March, even after a
machine is named for the first time in August.

Why: [alp82/aistack#243](https://github.com/alp82/aistack/issues/243). A stack linked to a
laptop and a VPS showed only whichever synced last, and with both on a 24-hour auto-sync
the public headline flipped between 4B tokens and 8M day to day.

## Consequences

Version 1 `activeDays` and `projects` counts remain lower bounds across multiple sources. A
laptop active Monday to Wednesday and a server active Thursday and Friday reads as 3
active days, not 5. A sum would be an upper bound and wrong in the other direction.

Version 2 carries sets and unions them. Mixed version 1 and version 2 readings keep the
tightest supported lower bound at each point on the trail. ADR-0007 records the set shape,
project workspace identifiers, precision labels, and the merged window.

Retention thins per source. Grouping on `(stack, day)` alone kept one row for the whole
day, which subtracted a source from every later point once that day aged past the
fine-grain window, because the fold carries the newest reading of each source forward.
That was already wrong for two harnesses; two machines syncing daily would have hit it
every day.

The rule lives in `convex/lib/sources.ts` and is imported by every surface that asks what
"current" means. It previously existed as three copies, each commented "the same rule
every other surface reads".
