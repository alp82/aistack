# Charting library for the house style

**Ticket:** [Research: charting library for the house style](https://github.com/alp82/aistack/issues/79) (map [#76](https://github.com/alp82/aistack/issues/76))
**Date:** 2026-08-04
**Status:** decided

## Verdict

**Build the charts by hand as SVG components, on `d3-shape` and `d3-time` only.**
Collect them in one internal module so the four surfaces share one chart layer.
Measured added weight: **5.2 KB gzip**.

**Fallback: [visx](https://airbnb.io/visx/) (29 KB gzip).** Use it if the axis and
scale code we write starts to cost more than it saves. visx renders the same
plain SVG and server-renders correctly, so moving to it replaces internals and
keeps the component API. It is an escalation, not a rewrite.

**Recharts and the shadcn/ui chart family are ruled out.** They render **nothing**
on the server, and they cost 146 KB gzip.

## The measurement

Every number below was measured in this repo's toolchain, not read from a
listicle. Method and reproduction are at the end.

### Added bundle weight

Each candidate was built alone with Vite 7 and esbuild minification. React and
React DOM are external, so the number is the weight the chart layer **adds**.

| Candidate | raw | **gzip** | brotli |
|---|---:|---:|---:|
| Recharts 3.10.1 (area + stacked bar + tooltip + legend) | 605 KB | **146 KB** | 118 KB |
| Observable Plot 0.6.17 (area + line) | 374 KB | **105 KB** | 88 KB |
| visx 4.0.0 (shape + scale + axis + group) | 103 KB | **29 KB** | 26 KB |
| `d3-scale` + `d3-shape` | 60 KB | **17 KB** | 15 KB |
| **`d3-time` + `d3-shape` (the recommendation)** | 18 KB | **5.2 KB** | — |
| Zero dependencies (arithmetic + `<polyline>`) | 0.9 KB | **0.5 KB** | 0.4 KB |

Split of the d3 packages: `d3-scale` alone is 13.3 KB gzip, `d3-shape` alone is
3.0 KB, `d3-time` alone is 2.3 KB. Most of `d3-scale` is date formatting and
color interpolation that `Intl.DateTimeFormat` and our own tokens already cover.

For scale: this app's main client chunk is **223 KB gzip** today
(`main-xkMTyyUu.js`, 703 KB raw). Recharts adds 65% to that figure.

### Server rendering

Each component was passed to `renderToString`. The table counts the SVG marks
that reached the server HTML.

| Candidate | bytes of HTML | marks rendered |
|---|---:|---|
| Recharts, `ResponsiveContainer` | 139 | **none** |
| Recharts, fixed 600x240 pixels | 127 | **none** — an empty `<div class="recharts-wrapper">` |
| visx | 12,876 | 2 paths, 27 lines, 25 text nodes |
| `d3-shape` hand-rolled | 635 | 2 paths, 4 text nodes |
| Zero-dependency hand-rolled | 232 | 1 polyline |

Recharts 3 renders an empty wrapper **even when the size is fixed**, so the usual
`ResponsiveContainer` workaround does not help. The cause is the v3 rewrite: chart
state moved into a Redux store that only fills after an effect runs, and React
does not run effects on the server.

This is confirmed by the maintainers, not inferred:

- [recharts#5997](https://github.com/recharts/recharts/issues/5997) — "Unable to
  render chart on the server using 3.0.0", opened 2025-06-24, **still open**.
  Maintainer: "recharts is a client side library and uses APIs that require a
  browser. This was the case in 2.x as well, server side rendering has never been
  explicitly supported."
- [recharts#6139](https://github.com/recharts/recharts/issues/6139) — closed as a
  duplicate of the above.

## Why this matters more here than on a normal dashboard

Three of the four surfaces are public and server-rendered. Only the private view
analytics dashboard is not, because `/settings/*` routes already set `ssr: false`
(`src/routes/settings.machines.tsx:19`).

A client-only chart on the public pages costs three things:

1. **A flash.** The stack page paints, the chart box stays empty, then it pops in.
   The ticket names this as a thing to avoid.
2. **Machine readability.** `docs/direction.md` treats citable, crawlable numbers
   as the point of the aggregate page. Server-rendered SVG carries real `<text>`
   nodes. An empty div carries nothing.
3. **The leaderboard.** A sparkline per row means many charts on one page. Each
   Recharts chart mounts its own Redux store and `ResizeObserver`. Recharts also
   has an open bug for two charts sharing a page
   ([recharts#5996](https://github.com/recharts/recharts/issues/5996)). A
   hand-rolled sparkline is one `<polyline>` in the server HTML.

## The house style argument

The repo's style is unusual for chart libraries: no border-radius anywhere,
monospace labels, lime accent, sharp corners, flat panels. Every library ships
its own opinion about rounded bars, drop shadows, default gray axes and a
tooltip card, and the work becomes overriding those opinions.

The repo already hand-rolls its only chart. The model share bar in
`src/features/measured/MeasuredSection.tsx:226` is a `<span>` with a width
percentage. It looks correct because nothing had to be undone first.

**One conflict to record so it is not re-argued.** The `dataviz` skill specifies
4px rounded data-ends on bars. `AGENTS.md` specifies no border-radius. **The
house rule wins: square ends everywhere.** Every other rule in that skill
applies unchanged.

## What we give up, and what it costs

Hand-rolling means we write the hover layer ourselves. The `dataviz` skill makes
a crosshair and tooltip mandatory on line and area charts, and a per-mark tooltip
on bars. That is the one real cost of this decision.

It is smaller than it looks. A tooltip that matches this site is a mono-label
panel with a sharp border, which is a component the design system already has.
Restyling a library tooltip to reach the same result costs about the same, and
leaves the library's markup underneath.

What we do **not** give up: `d3-shape` supplies the path generators (`area`,
`line`, `stack`, curves) and `d3-time` supplies honest date ticks. Those are the
two parts that are genuinely fiddly to write. Position is a linear interpolation.
Labels are `Intl.DateTimeFormat`.

If the arithmetic gets awkward, adding `d3-scale` costs 13 KB gzip and is a
normal step, not a change of plan.

## Chart types the four surfaces need

| Surface | Form | Fits the recommendation |
|---|---|---|
| Stack page | Time series over sparse, irregular days | Yes. A time scale places points by real date, so a two-week gap looks like a gap. |
| Stack page | Stacked composition per harness and model | Yes. `d3-shape`'s `stack`. |
| Aggregate page | Horizontal bars, totals | Yes. Already the pattern in `MeasuredSection`. |
| Leaderboard | Sparkline per row | Yes, and this is where a library hurts most. |
| Private analytics | Views per day, bars | Yes. This route is client-only anyway. |

**Sparse data degrades well.** With two to five points, a library draws its full
axis furniture and grid around almost nothing, which reads as broken. Our own
component decides what to draw: below a point threshold, show the points and drop
the grid. That decision is not available inside a library's render.

## Candidates ruled out

| Candidate | Reason |
|---|---|
| **Recharts 3.10.1** | Renders nothing on the server. 146 KB gzip. Pulls Redux Toolkit, react-redux, immer, reselect and a bundled d3 copy as runtime dependencies. |
| **shadcn/ui charts** | A thin wrapper over Recharts v3. It inherits every point above. Its CSS-variable theming is the one good part, and we can copy that idea without the library. |
| **Tremor 3.18.7** | Last published 2025-01. Peer dependency is React 18, and this app is on React 19. Wraps Recharts v2. Rounded corners are baked into its look. Dead end. |
| **Nivo 0.99.0** | Last published 2025-05, 15 months stale. Adds react-spring. Its strength is looking good by default, which is the opposite of what this repo needs. |
| **Observable Plot 0.6.17** | 105 KB gzip and it depends on all of `d3`. It builds DOM imperatively rather than returning React elements, so it needs a client effect or a jsdom shim on the server. |
| **Apache ECharts 6.1.0** | Canvas-first. It does support `renderToSVGString` on the server, but that path is documented as non-interactive and needs a separate client runtime to restore hover. Large, imperative, and themed by JS objects rather than CSS variables, so light and dark mode stop being a CSS concern. |
| **Chart.js 4.5.1** | Canvas. No server rendering. Nothing in a canvas is selectable, crawlable or CSS-themeable. |
| **uPlot 1.6.32** | Canvas, last published 2025-03. Built for 100,000 points at speed. Our charts have 2 to 90 points. Wrong tool. |
| **MUI X Charts 9.10.1** | Healthy and server-renderable, but it requires `@mui/material`, `@mui/system` and Emotion. Pulling a second design system into a Tailwind app is not worth it. |
| **LayerChart** | Svelte only. Not applicable. |

## Finding for the prototype ticket: the existing chart tokens fail

`src/styles.css` carries `--chart-1` through `--chart-5`, scaffolded by shadcn and
never used. Run through the `dataviz` validator against the dark canvas
(`#0b0d11`), they fail:

```
[FAIL] Lightness band       #83b755 (0.721), #8dcd50 (0.779) outside the dark band
[FAIL] Chroma floor         #499fb8 at 0.09 reads as gray
[FAIL] Normal-vision floor  #8dcd50 vs #83b755 — ΔE 6.5, below the floor of 15
[WARN] CVD separation       #8dcd50 vs #83b755 — ΔE 6.2 deutan
```

The cause is plain: `--chart-2` and `--chart-4` are both lime at hue 132 and
differ only in lightness. Nobody can tell them apart, with or without color
vision deficiency.

**A validated categorical palette has to be built before any multi-series chart
ships.** That is work for
[Prototype: the living stack page](https://github.com/alp82/aistack/issues/80),
not for this ticket. The lime accent stays the single-series color, which needs
no palette at all.

Two further notes for that ticket:

- The site has 12 per-stack accent presets (`.accent-*` in `src/styles.css`). A
  single-series chart on a stack page should use the stack's own accent. A
  multi-series chart must not, because the palette has to stay fixed per entity.
- Light and dark need separately chosen steps, not an automatic flip. The
  validator has to be run for both surfaces.

## Method

Everything is reproducible.

1. Bundle weight: a scratch Vite 7 project, one entry per candidate, built in
   library mode with `esbuild` minification, React marked external. Sizes are
   `gzip -9` over the emitted chunk.
2. Server rendering: `renderToString` from `react-dom/server` on each candidate
   component, counting `<path>`, `<rect>`, `<line>` and `<text>` in the output.
3. Library metadata: `npm view <pkg> version time.modified peerDependencies
   dependencies` against the live registry on 2026-08-04.
4. Maintainer statements: the GitHub issues linked above, read with `gh`.
5. Palette: repo OKLCH tokens converted to sRGB hex, then
   `dataviz/scripts/validate_palette.js --mode dark --surface "#0b0d11"`.

Baseline for comparison: `.output/public/assets/main-xkMTyyUu.js`, 703 KB raw and
223 KB gzip, from the build of 2026-08-03.
