# The CLI ships only the days the server lacks

Auto-sync runs on every Claude Code session start, and before this decision each run
re-read the whole local window and sent every day to the server, which replaced each row.
The work was mostly repeated: on a machine that syncs ten times a day, only today's row
changes. Diff-only sync needs an answer to one question: who knows what the server lacks?

The server does, and it says so in a **day manifest**: for one (stack, machine) the dates
it holds, each with a **day fingerprint**, plus the retention in days. The CLI reads the
manifest over a separate read endpoint, scans its full local window as before, hashes each
day, and publishes only the dates that are missing from the manifest or whose fingerprint
differs. The server keeps replacing per day, so a publish that carries a date it already
holds is still correct, only wasteful.

Three alternatives lost. A server-side **watermark** (one `syncedThrough` date) cannot see
behind itself, so a session log that lands for an old date, or a day the server dropped,
never syncs again. A **client state file** breaks on a fresh machine and lies after a
server-side wipe. A fixed **recent tail** (always resend the last N days) needs no
fingerprint but guesses at N, and the guess is wrong in both directions.

The fingerprint is a content hash of the day's atoms rather than a cheap stat such as a
session count, because a stat misses an edit that keeps the count. The hash covers the
aggregate version, so a rule change invalidates every stored day, which is what a rule
change should do.

**Both halves of a measured day live in one row.** This map moves the Actual Usage figures
to per-day atoms as well, and they join the same day shape, the same version, the same
hash and the same table, renamed `measuredDays`. A second table with a second manifest
would double every edge case above. The two consent bits stay two: `publishWorkflow` and
`publishCost` each gate their own half, the CLI omits the block whose bit is off, and the
read side returns null for that half even when a row holds it.

## Consequences

An old client that never asks for the manifest keeps sending its full window, and the
server accepts it by replace. So the backend deploys first and the CLI release follows,
with nothing to coordinate.

A fresh machine sees an empty manifest and sends everything it has inside the retention
the manifest names, at most 400 days. The CLI never sends a date the server would expire
on arrival.

A machine that skipped days sends the missing dates and nothing else. Today's row
changes on every sync and resends every time; that is one row per session start and it
is what keeps the freshness stat honest.

Decided in [alp82/aistack#305](https://github.com/alp82/aistack/issues/305), part of
[map #302](https://github.com/alp82/aistack/issues/302). See ADR-0009 for why a day is
one machine's, which the manifest key inherits.
