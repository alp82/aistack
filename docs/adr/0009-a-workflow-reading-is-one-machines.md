# A workflow reading is one machine's, per day

The measured Workflow section shows one machine's reading at a time. `measuredWorkflowDays`
holds one row per `(stack, machine, UTC date)`, the page folds the rows inside a window
(30 days, 7 days, or the last 24 hours) and defaults to the machine that synced last, and
the machine selector switches between machines. Nothing merges two machines.

This is the opposite of what ADR-0006 does for the headline, and the difference is in the
data, not in the taste. Sessions are disjoint per machine, so token counts and session
counts sum honestly. The workflow section carries two kinds of number that do not:

The **Git half** counts commits, and the wire carries no commit identity. The CLI dedupes
by hash inside one machine, but hashes never leave the machine, so the server cannot tell
one machine's commits from another's. A repository cloned on a laptop and a server would
have its shared commits counted twice, and the additions and removals with them.

A **share** has no denominator on the wire. "42% of commits land between 23:00 and 03:00"
cannot be averaged with another machine's 8% without the commit counts behind both, and a
weighted mean of two medians means nothing at all.

**Days of ONE machine do fold**, and that is the amendment [#285](https://github.com/alp82/aistack/issues/285)
made on the decision [#277](https://github.com/alp82/aistack/issues/277) took. A day
carries only combinable atoms: counts, sums, maxes, and bucket histograms. No share, no
median, no mean travels. The server adds a machine's days into a window and computes
every figure over the fold, so a median is a median over daily values or over buckets.
A re-synced day replaces that day, and days append across syncs, so a manual sync still
builds a continuous series. Within one machine the atoms have their denominators; across
machines the Git half still cannot dedupe.

So the reading, the podium, the template lead, and the pins all describe one coherent
machine. A reader who wants the other machine picks it, the way they already pick one in
the Actual Usage section.

## Consequences

A stack that splits its work across two machines shows the more recent one by default, and
its lead says so in the scope line: the session and harness counts are that machine's.
Neither figure is a lower bound, because neither claims to cover the stack.

The pins and hides are keyed on the stack, not the machine and not the window. The
judgment is about the row, and it does not change when the selector does.

A window is measured in whole UTC days because the rows are. The 24-hour window folds the
days that touch the last 24 hours, so it can read up to 48 hours of atoms; the page names
it as the window that covers the last day rather than one that measures it.

A cross-machine merge stays possible later, and it needs one thing on the wire that is
not there today: an opaque per-commit identity so Git can dedupe. The per-metric
denominators the first version of this decision also asked for now travel, because the
daily atoms carry them. That wire bump is not worth spending before a stack exists that
needs it.

Decided in [alp82/aistack#218](https://github.com/alp82/aistack/issues/218) and amended
to per-day rows in [alp82/aistack#285](https://github.com/alp82/aistack/issues/285),
part of [map #200](https://github.com/alp82/aistack/issues/200). Spec:
[docs/specs/workflow-surface.md](../specs/workflow-surface.md). See also ADR-0006, which
settles the same question for the measured headline and answers it the other way.
