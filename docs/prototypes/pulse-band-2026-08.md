# Landing pulse band, second pass - "One Number" (2026-08)

**Question**: the E1 pulse band (locked in #84) did not land on the start page -
too busy, ~800px tall, the token graph buried at 18% opacity. What should the
landing activity section look like instead? Ticket: #147.

**Method**: five variants live behind `?variant=` on `/`, all reading the real
`api.activityFeed.band`. The variants stay in main under
`src/features/activity/prototype/` (owner rule: prototypes stay in main), with
the dev-only switcher still mounted.

## Variants

- **A "Ground"** - the chart full-bleed as the section's floor, content overlaid.
- **B "Annotated"** - feed events pinned as markers on the token line.
- **C "Ticker"** - feed as a scrolling marquee strip over a chart + stat column.
- **D "One Number"** - one colossal insight via React Bits Pro SpeedingText.
- **E "Reel"** - insights rotating one at a time in a single bold display (words mode).

A/B/C were rejected in one round: "nothing lands, too busy - focus on some key
insights and make them bold." D and E merged over four refinement rounds.

## Verdict - D, refined

- Kicker: **Usage in the last 24 hours** (14px mono, lime, live dot).
- The 24h token count colossal with a ` tokens` suffix - SpeedingText counter,
  per-digit-group motion smear.
- Under it the **reel**: SpeedingText words mode toggling
  sessions / projects / tools / stacks.
- Chart titled **"Usage in the" + range select** (BrutalistSelect, last 7 /
  last 30 days), with standing high/low chips and a hover/tap crosshair chip.
- **Chip styling took three rounds**: bordered chips read as controls (the
  select already uses that look); solid fills failed next (white too heavy on
  the dark canvas, lime clashes with the lime line). The final version is
  **quiet glass**: translucent canvas, no border, small lime square marking the
  live chip.
- The feed compressed to one `latest:` line. CTA **add your tokens → `/sync`**.

## Fold-in facts (#147)

- Production component: `src/features/activity/PulseHero.tsx`. The vendored
  licensed SpeedingText lives at `src/components/speeding-text.tsx` (the
  shadcn registry route needs `REACTBITS_LICENSE_KEY`, not configured).
- The canonical figures live in an sr-only sentence in the first HTML, not in
  the animation; the animated pair is aria-hidden.
- `PulseBand` narrowed to page-only (`/activity`); the band's daily points
  window widened 14 → 30 days for the range select.
- Accepted copy/data gap: the reel figures come from the 24-hour usage window.
