# View analytics: the page and its entry points

Decided in [alp82/aistack#98](https://github.com/alp82/aistack/issues/98), a prototype
ticket on [map #76](https://github.com/alp82/aistack/issues/76). The owner picked every
shape below from a live prototype. This file is what the follow-up build ticket
implements.

The prototype routes are `/prototype/views`, `/prototype/views-entry` and
`/prototype/views-stack` on branch `curia/98`. They run on fixtures, they are
throwaway, and the build deletes them.

## What was decided

### 1. The profile gets an owner-only Views panel

Shape **E4** in the prototype: the headline total from E2, plus one inline box per
page from E3.

The panel renders in the owner region of `ProfilePage`, where the "View analytics
(owner-only)" seam sits today. It carries, in this order:

1. The headline total, in the accent, with `deduped daily visitors · <range>` under it.
2. One box per target — the profile and every stack, drafts included — with the
   page name, its note, its sparkline and its own total.
3. The short honest-labeling paragraph.
4. A link to `/settings/analytics`, labeled for what that page adds: the day-by-day
   reading and the referrer split.

The draft box stays in the list. A draft that reads zero is the number an owner most
needs explained, and dropping it makes the list lie by omission.

The whole panel sits inside a private fence: a dashed border, a lock icon, and the
words "only you can see this". That is the same treatment the draft-stack cards
already use, so "private" is a shape the owner knows on this page and not a sentence
they have to find.

`ProfilePage` already carries the prop the build needs. `ownerViewsSlot` is optional,
gated on `isOwner`, and falls back to today's seam.

### 2. `/settings/analytics` keeps design B

Design **B** in the prototype, which is what ships today, tightened. In order: the
headline total, one `TimeSeriesChart` line per page, the `BarsChart` of where the
visits came from, then a row per page.

This is the decision that unblocks [#95](https://github.com/alp82/aistack/issues/95).
The multi-series chart survives, so #95 still has a real multi-series chart to check
the palette on, on the page it planned to check.

Designs A (rows only, referrers as a sentence) and C (a card per page, no site-wide
total) were rejected. They live on branch `curia/98` if the question reopens.

### 3. Three ways in, not one

- **The account menu keeps Views.** It stays pointed at `/settings/analytics`.
- **The profile gets the panel above.**
- **A stack page gets a private line for its owner.**

`/stacks/{slug}/changes` gets nothing. It is already owner-only, so it adds a fourth
door without adding a reader.

### 4. The stack-page line is shape S1

A one-line strip under the hero, above the first numbered section. Lock icon, the
words "only you can see this", this stack's total in the accent, then
`deduped daily visitors · <range> · not page loads`, then a link to
`/settings/analytics` on the right.

S2, the fenced box with a trail, was rejected as too loud for a page whose own
subject is the stack and not its audience.

## What may not change

- **Strictly private means owner-gated.** The profile and a stack page are both public
  routes. A visitor's render of either must contain no line, no number and no lock.
  The prototype was checked this way: the server HTML for a visitor carries none of
  the private markup, on every variant.
- **The guard stays in the query.** `viewAnalytics.mine` takes no target argument.
  A per-stack number on a stack page must not become a query that accepts a target.
  See "What the build has to solve" below.
- **The honest labeling.** Deduped daily visitors, one visitor per page per UTC day,
  a browser on a network and not a person, owner views excluded while signed in, not
  page loads. Re-word it freely. Never let a number appear without it.
- House style: no border-radius, mono for labels and technical accents, charts only
  from `src/features/charts`.

## What the build has to solve

**The stack-page line needs a number for one stack, and `mine` answers for all of
them.** Two ways out, and the build picks one:

1. Call `mine` on the stack page and select the entry whose `targetId` matches. No
   query change, one extra read of every counter the owner has, on a page that does
   not need them.
2. Add a second owner-scoped query that takes a slug and verifies ownership server
   side before it answers. It must derive the caller the same way `mine` does, and it
   must return null rather than zero for a stack the caller does not own.

Option 1 is the smaller change and is right at this size. Option 2 is right once a
creator has enough stacks that reading all of them per stack page stops being free.

**The thin-data cases are the normal case, not the edge.** Prod holds 14 counter rows.
A target with one reading draws no sparkline — `Sparkline` returns null below two
points — so every surface needs a shape for that. The existing empty states on
`/settings/analytics` are decisions and they keep working.

## What was NOT decided

- Nothing changed on the query side. There is still no per-page referrer split, no
  per-referrer time series, and no window other than 30 days.
- The `aggregate`/`global` counter stays excluded. It has no owner.
