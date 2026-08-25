# A workflow reading is one machine's

The measured Workflow section shows one machine's reading at a time. `measuredWorkflows`
holds one row per `(stack, machine)`, the page defaults to the machine that synced last,
and the machine selector switches between them. Nothing merges.

This is the opposite of what ADR-0006 does for the headline, and the difference is in the
data, not in the taste. Sessions are disjoint per machine, so token counts and session
counts sum honestly. The workflow section carries two kinds of number that do not:

The **Git half** counts commits, and the wire carries no commit identity. The CLI dedupes
by hash inside one machine, but hashes never leave the machine, so the server cannot tell
one machine's commits from another's. A repository cloned on a laptop and a server would
have its shared commits counted twice, and the additions and removals with them.

A **pool metric** is a value with a band, and no denominator. "42% of commits land between
23:00 and 03:00" cannot be averaged with another machine's 8% without the commit counts
behind both, and a weighted mean of two medians means nothing at all. Coverage is already
per machine: it is the share of THAT machine's synced harnesses the rule counts.

So the reading, the podium, the template lead, and the pins all describe one coherent
machine. A reader who wants the other machine picks it, the way they already pick one in
the Actual Usage section.

## Consequences

A stack that splits its work across two machines shows the more recent one by default, and
its lead says so in the scope line: the session and harness counts are that machine's.
Neither figure is a lower bound, because neither claims to cover the stack.

The pins and hides are keyed on the stack, not the machine. The judgment is about the row,
and it does not change when the selector does.

A cross-machine merge stays possible later, and it needs two things on the wire that are
not there today: an opaque per-commit identity so Git can dedupe, and a denominator per
pool metric so shares can combine. Both are wire bumps, and neither is worth spending
before a stack exists that needs them.

Decided in [alp82/aistack#218](https://github.com/alp82/aistack/issues/218), part of
[map #200](https://github.com/alp82/aistack/issues/200). Spec:
[docs/specs/workflow-surface.md](../specs/workflow-surface.md). See also ADR-0006, which
settles the same question for the measured headline and answers it the other way.
