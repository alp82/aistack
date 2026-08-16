# The path from the email to a synced stack

Prototype asset for wayfinder ticket
[#130](https://github.com/alp82/aistack/issues/130), map
[#121](https://github.com/alp82/aistack/issues/121). Owner grilling, 2026-08-10.

This file is the build spec for
[#131](https://github.com/alp82/aistack/issues/131). It holds the locked copy
for the two surfaces the broadcast lands on: the `/sync` page and the CLI's own
output. The stack page is out of scope - map #76 refined it three times.

The reader this is written for: **they have an account, they built a stack by
hand, and they have never run the CLI.** That is the exact person the broadcast
reaches.

---

## 1. The frame

The page leads with **proof**, and carries **discovery** underneath it.

- **Proof** - the hand-built stack is a claim. Syncing publishes the reading
  behind it. The gain is credibility with a stranger.
- **Discovery** - the summary prints in full before anything sends, so the
  person learns their own numbers on the way past.

Rejected: **aliveness** ("a hand-built stack goes stale"). It reads as
criticism of the thing the reader already did.

Cancel is the **safety line under the ask**; it must not become the ask itself.
The page never offers "just look" as the headline, because that would
contradict a broadcast whose call to action is to sync.

---

## 2. One boundary, two consequences

`/sync` has exactly one boundary: **it reads files that already exist on this
machine, and nothing else.** Both of the page's hard sentences follow from it.

- It is why raw data never leaves the machine.
- It is why chat apps cannot be measured.

So the page states the boundary once and does not apologize for it.

**The page does not name Claude or ChatGPT.** Locked by the owner. The boundary
sentence carries the fact, and naming the two chat apps would invite a
comparison the page should avoid. This answers ticket question 2: the fact is
conveyed without naming the apps.

Four harness names read fine in one sentence. A compatibility matrix only
becomes necessary at six or seven, and that belongs to a later map.

### Positive claims only (#40)

The rule forbids saying a listed thing went **unused**. Nothing here does. The
`searched` line in §4 reports what the CLI **looked for**, which is a claim
about the CLI rather than about the person's behavior.

---

## 3. The `/sync` page

Replaces `src/routes/sync.tsx`. Structure below, in page order.

### 3.1 Hero

```
// sync

Show what actually ran

You listed the tools you use. This publishes the reading behind the
list - sessions, models, tokens, and cost at API prices - straight
from your own machine.
```

The old headline **"Sync your stack"** is retired. To someone who built a stack
by hand and believes they are finished, it reads as a chore on a finished thing.

### 3.2 The boundary band

New. Sits directly under the hero, above the steps, because what the tool
**reads** comes before what it **sends**.

```
WHAT IT READS

aistack reads files your agents already wrote on this machine.
That is all it reads.

Claude Code, Codex, opencode and pi-mono write those files.
```

The harness list lives here and nowhere else on the page. Step 1 loses its
inline `Claude Code and Codex` naming.

### 3.3 The two steps

**1 · Sync** - `npx @use-aistack/cli sync`

> Scans your local agent history and prints the full summary in your
> terminal - every number, every name. On the first run it opens your browser
> to link this machine. You name it, and you can revoke it any time.

**2 · Approve**

> Nothing sends until you pick Publish. Cancel sends nothing, and you keep the
> reading you just saw. The exact bytes you approved go on the wire.

The clause **"and you keep the reading you just saw"** is the whole safety line.
It is the only place the page tells the reader that cancelling still leaves
them with the summary.

### 3.4 The publishes / stays grid

Unchanged from today, except the harness-neutral wording. Keep both columns and
the existing five/four rows.

### 3.5 Tail

Unchanged: `AutoSyncNote`, then the `manage linked machines` link.

---

## 4. The CLI

### 4.1 The `searched` line

New, at the top of beat one in `buildGateSummary`
(`packages/cli/src/sync/summary.ts`), in the existing label column:

```
from your machine - sync preview

to        My Stack · aistack.to/stacks/my-stack
searched  claude code, codex, opencode, pi-mono
```

It reports what the CLI **looked for**, in search order. What it **found** is
the blocks below. Do not add found/not-found marks: that would reintroduce the
compatibility matrix this ticket decided against.

Why the line is needed: without it, a person who genuinely runs opencode but
whose install path the scan misses sees the same silence as a person who does
not run opencode at all. That silence complies with #40 but hides the bug.

### 4.2 The per-harness header becomes unconditional

**This is the non-obvious consequence, and the one real regression risk in
#131.**

`payloadBlock` today drops the `- Claude Code 2.1.220` header when only one
harness is detected (`payloads.length > 1`). That breaks the moment a `searched`
line names four: the reader sees four names, then one unlabeled block, and
cannot tell which of the four it is.

The header must always print. This changes the output for **every existing
Claude Code user**, which is the common case today. `summary.test.ts` asserts
the single-harness shape and will need deliberate updating; do not just
re-bless the snapshot.

### 4.3 `harnessLabel` covers four harnesses

`harnessLabel()` maps only `claude-code` and `codex`; everything else falls
through to the raw slug. Both copies need the two new rows:

- `packages/cli/src/harness/index.ts` - the CLI's copy, re-exported by
  `summary.ts`.
- `src/features/measured/copy.ts` - the web copy.

Labels: **`opencode`** → `opencode`, **`pi-mono`** → `pi-mono`. Both are
lowercase in their own branding, so the label is the slug - but it must be an
explicit row, so a future rename does not silently leak a slug.

`HARNESS = "Claude Code"` in `copy.ts` is a single-harness constant baked into
`NEVER_SYNCED_BODY`, `OWNER_NOT_MEASURED_BODY` and the old `/sync` step 1. The
first two are stack-page copy and stay out of scope here; flag them, do not
touch them.

### 4.4 The end of the path

Today the last thing a person reads after a successful publish is a
millisecond-precision ISO timestamp, and the public page - the proof half -
is a link nobody opens.

**Locked: print the link better, do not open a browser.** The path stays in the
terminal.

Today:

```
Snapshot received at 2026-08-10T21:03:44.123Z
https://aistack.to/stacks/my-stack
```

New:

```
Snapshot received 2026-08-10 21:03 UTC

Your stack now shows what actually ran:
https://aistack.to/stacks/my-stack
```

- Milliseconds dropped, and the `T`/`Z` machine form with them.
- The link gets its own line and a sentence that names the proof, so the last
  thing read is the result rather than a receipt.
- The lime treatment on the URL stays.
- The auto-sync settle and the connect upsell still follow, unchanged.

### 4.5 Beat two is unchanged

The elicitation dialog stays short - the #35 fold constraint is unchanged and
four harnesses do not lengthen it. It already sums tokens across payloads and
takes `days` from `payloads[0]`, which is correct while every harness shares one
30-day window.

---

## 5. What this ticket did not decide

- **Cost with no dollars.** Ticket question 3 asked what the terminal prints
  when a harness reports tokens and no dollars. **Moot**: Cursor was the only
  harness with that shape and it was cut in
  [#137](https://github.com/alp82/aistack/issues/137). The existing
  `cost      not published` line already covers an unpriced model.
- **`HARNESS` on the stack page.** Named above and deliberately left untouched.
- **The provider prefix.** `google:gemini-3.6-flash` is a legal published model
  id since [#123](https://github.com/alp82/aistack/issues/123), and no web
  surface calls `vendorModelId()` yet. The CLI gate prints `m.id` raw at
  `summary.ts:242`, so the first opencode sync shows the prefix in the terminal
  too. This belongs to map fog, not to this ticket.
