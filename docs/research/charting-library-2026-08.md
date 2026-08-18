# Charting library for the house style

**Ticket:** [Research: charting library for the house style](https://github.com/alp82/aistack/issues/79) (map [#76](https://github.com/alp82/aistack/issues/76))
**Date:** 2026-08-04
**Status:** decided

## Verdict

**Use [TanStack Charts](https://tanstack.com/charts) (`@tanstack/charts` +
`@tanstack/react-charts`), pinned to an exact version and wrapped in one
internal chart module.** Measured added weight: **44 KB gzip** for everything
the four surfaces need.

**Fallback: hand-rolled SVG components on `d3-shape` and `d3-time`, 5.2 KB
gzip.** Take it if the pre-1.0 API churns faster than the map can absorb. The
fallback is fully costed in this report, so it is a known path.

**Recharts and the shadcn/ui chart family are ruled out.** They render
**nothing** on the server, and they cost 146 KB gzip.

The single risk in this choice is maturity: TanStack Charts is **0.6.2,
published 2026-08-03**. See [Maturity risk](#maturity-risk) for why it is worth
taking and how it is contained.

## The measurement

Every number below was measured in this repo's toolchain rather than read from
a comparison article. Method and reproduction are at the end.

### Server rendering

This is the criterion that decided it. Each component was passed to
`renderToString`, counting the SVG marks that reached the server HTML.

| Candidate | bytes of HTML | marks rendered |
|---|---:|---|
| **TanStack Charts** - series | **7,242** | **2 paths, 18 lines, 10 text** |
| **TanStack Charts** - composition | **4,300** | **2 rects, 11 lines, 9 text** |
| visx | 12,876 | 2 paths, 27 lines, 25 text |
| `d3-shape` hand-rolled | 635 | 2 paths, 4 text |
| Recharts, `ResponsiveContainer` | 139 | **none** |
| Recharts, fixed 600x240 pixels | 127 | **none** - an empty `<div class="recharts-wrapper">` |

TanStack Charts emits a complete, responsive SVG on the server:

```html
<svg class="ts-chart" width="100%" height="100%" viewBox="0 0 720 240"
     role="img" aria-roledescription="chart" aria-label="tokens per day" tabindex="0">
```

That is a `viewBox` that scales with CSS, so there is no client measurement, no
`ResizeObserver` before first paint, and no flash. The documented adapter
contract states that React gets "Complete SVG" on the server and
"Hydrates and adopts the existing surface" in the browser.

Recharts 3 renders an empty wrapper **even when the size is fixed**, so the usual
`ResponsiveContainer` workaround does not help. The cause is the v3 rewrite:
chart state moved into a Redux store that only fills after an effect runs, and
React does not run effects on the server.

The maintainers confirm this:

- [recharts#5997](https://github.com/recharts/recharts/issues/5997) - "Unable to
  render chart on the server using 3.0.0", opened 2025-06-24, **still open**.
  Maintainer: "recharts is a client side library and uses APIs that require a
  browser. This was the case in 2.x as well, server side rendering has never been
  explicitly supported."
- [recharts#6139](https://github.com/recharts/recharts/issues/6139) - closed as a
  duplicate of the above.

### Added bundle weight

Each candidate was built alone with Vite 7 and esbuild minification. React and
React DOM are external, so the number is the weight the chart layer **adds**.

| Candidate | raw | **gzip** | brotli |
|---|---:|---:|---:|
| Recharts 3.10.1 (area + stacked bar + tooltip + legend) | 605 KB | **146 KB** | 118 KB |
| Observable Plot 0.6.17 (area + line) | 374 KB | **105 KB** | 88 KB |
| **TanStack Charts 0.6.2** (area + line + bar + tooltip + `d3-scale`) | 149 KB | **44 KB** | 38 KB |
| TanStack Charts - one line mark, no tooltip, no axes | 118 KB | **34 KB** | - |
| visx 4.0.0 (shape + scale + axis + group) | 103 KB | **29 KB** | 26 KB |
| `d3-scale` + `d3-shape` | 60 KB | **17 KB** | 15 KB |
| **`d3-time` + `d3-shape` (the fallback)** | 18 KB | **5.2 KB** | - |
| Zero dependencies (arithmetic + `<polyline>`) | 0.9 KB | **0.5 KB** | 0.4 KB |

The two TanStack rows show where its weight sits: about **34 KB is the grammar
engine floor**, and the full set of marks and the tooltip add roughly 10 KB on
top. Marks tree-shake; the runtime does not.

For scale: this app's main client chunk is **223 KB gzip**
(`main-xkMTyyUu.js`, 703 KB raw, build of 2026-08-03). TanStack Charts adds 20%
to that figure and only on the routes that import it. Recharts adds 65%.

## Why TanStack Charts wins

**1. It solves the hard problem by design.** Server-rendered responsive SVG is
what ruled Recharts out, and this library documents it as a contract with a
per-adapter support table and a determinism checklist.

Three of the four surfaces are public and server-rendered. Only the private view
analytics dashboard is not, because `/settings/*` routes already set
`ssr: false` (`src/routes/settings.machines.tsx:19`). Server-rendered SVG carries
real `<text>` nodes, which matters because `DIRECTION.md` treats citable,
crawlable numbers as the point of the aggregate page.

**2. It ships no visual theme to override.** The house style is unusual for chart
libraries: no border-radius anywhere, monospace labels, lime accent, sharp
corners, flat panels. Most libraries ship rounded bars, gray axes and a tooltip
card, and the work becomes undoing them.

TanStack Charts defaults to `currentColor` for foreground, text and grid,
`transparent` for the background, and six CSS-variable categorical colors. It
inherits the surrounding application rather than installing a look. Light and
dark stay a pure CSS concern, so there is no theme flash and no JS theme object.

**3. It includes the interaction layer we would otherwise write by hand.** The `dataviz`
skill makes a crosshair and tooltip mandatory on line and area, and a per-mark
tooltip on bars. It also wants legends, keyboard access and exact-value
alternatives. TanStack Charts ships tooltips, grouped focus, keyboard
navigation, legends, reduced-motion support and `role="img"` with an aria label.
That was the one real cost of the hand-rolled option, and it is the difference
between 5.2 KB and 44 KB.

**4. It fits this codebase.** The app is TanStack throughout - Router, Start,
Query, Form, Virtual. The library also ships `llms.txt`, an API reference and an
AI-authoring guide inside the package, which is genuinely useful in a codebase
driven by coding agents.

**5. Every form the four surfaces need is a built-in mark.** `areaY` and `lineY`
for the time series, implicit stacking by repeated x for composition, `barX` for
horizontal bars, and a marks-only chart with `axis: false` for a leaderboard
sparkline.

## Maturity risk

`@tanstack/charts` is **0.6.2**, first published days before this decision. That
is the whole case against it, and it is a serious one. A pre-1.0 library can
break its API inside the window this map runs.

Three things contain it:

1. **Pin the exact version.** No caret. Upgrade deliberately.
2. **Wrap it.** The shared chart module
   ([#91](https://github.com/alp82/aistack/issues/91)) is the only place that
   imports it. The four surfaces import our components, never the library.
3. **The fallback is already designed.** Hand-rolled SVG on
   `d3-shape` + `d3-time` is measured at 5.2 KB gzip in this report, with a
   working server-render test. If the library becomes a problem, the exit is a
   module rewrite behind a stable component API rather than a surface rewrite.

The trade being made: accept churn risk on a wrapped dependency, in exchange for
a correct SSR story and an accessible interaction layer we would otherwise write
and test ourselves.

## Candidates ruled out

| Candidate | Reason |
|---|---|
| **Recharts 3.10.1** | Renders nothing on the server, even at a fixed size. 146 KB gzip. Pulls Redux Toolkit, react-redux, immer, reselect and a bundled d3 copy as runtime dependencies. Also has an open two-charts-per-page bug ([recharts#5996](https://github.com/recharts/recharts/issues/5996)), which the leaderboard would hit on every row. |
| **shadcn/ui charts** | A thin wrapper over Recharts v3. It inherits every point above. Its CSS-variable theming is the good part, and TanStack Charts does the same thing without the Recharts underneath. |
| **Bklit UI** | Suggested on the ticket, and genuinely nice work - MIT, 1.4k stars, a shadcn registry of 17+ charts you copy into the repo rather than install. But it is **client-only by construction**: every component starts with `"use client"` and sizes itself with `ParentSize` from `@visx/responsive`, so the server sends an empty box. It also builds on visx, so it is starting source for the visx option rather than a separate engine choice. Its Vercel/Geist look is the opposite of this repo's. Worth keeping as a **reference for chart anatomy and tooltip behavior** rather than as the chart layer. |
| **visx 4.0.0** | Healthy, server-renders correctly, 29 KB. It is the middle option: more machinery than hand-rolling, no grammar, no tooltip or focus layer, and axes we would restyle anyway. TanStack Charts gives more for 15 KB more; hand-rolling gives enough for 24 KB less. visx loses to both. |
| **Tremor 3.18.7** | Last published 2025-01. Peer dependency is React 18, and this app is on React 19. Wraps Recharts v2. Rounded corners are baked into its look. It is a dead end. |
| **Nivo 0.99.0** | Last published 2025-05, 15 months stale. Adds react-spring. Its strength is looking good by default, which is the opposite of what this repo needs. |
| **Observable Plot 0.6.17** | 105 KB gzip and it depends on all of `d3`. It builds DOM imperatively rather than returning React elements, so it needs a client effect or a jsdom shim on the server. TanStack Charts uses the same marks-and-channels grammar with a React adapter and half the weight. |
| **Apache ECharts 6.1.0** | Canvas-first. It does support `renderToSVGString` on the server, but that path is documented as non-interactive and needs a separate client runtime to restore hover. Large, imperative, and themed by JS objects rather than CSS variables, so light and dark mode stops being a CSS concern. |
| **Chart.js 4.5.1** | Canvas. No server rendering. Nothing in a canvas is selectable, crawlable or CSS-themeable. |
| **uPlot 1.6.32** | Canvas, last published 2025-03. Built for 100,000 points at speed. Our charts have 2 to 90 points, so it is the wrong tool. |
| **MUI X Charts 9.10.1** | Healthy and server-renderable, but it requires `@mui/material`, `@mui/system` and Emotion. Pulling a second design system into a Tailwind app is not worth it. |
| **`react-charts` 2.0.0-beta.7** | The old TanStack chart package. Last published 2023-11, React 16 peer. Superseded by `@tanstack/charts`. Do not confuse the two. |
| **LayerChart** | Svelte only. Not applicable. |

## Chart types the four surfaces need

| Surface | Form | Mark |
|---|---|---|
| Stack page | Time series over sparse, irregular days | `areaY` + `lineY` on `scaleUtc`, so a two-week gap looks like a gap |
| Stack page | Stacked composition per harness and model | `areaY`/`barX` with implicit stacking by repeated position |
| Aggregate page | Horizontal bars, totals | `barX` |
| Leaderboard | Sparkline per row | `lineY` with `axis: false` |
| Private analytics | Views per day, bars | `barY`. This route is client-only anyway |

**Sparse data is the common case.** Most stacks will have two to five points for
a long while. Any library draws its full axis furniture around almost nothing,
which reads as broken. The library choice does not solve this; our wrapper has
to decide what to draw below a point threshold. That decision belongs
in the chart module either way.

## Style rules to carry forward

**One conflict is resolved here so it is not re-argued.** The `dataviz` skill specifies
4px rounded data-ends on bars. `AGENTS.md` specifies no border-radius. **The
house rule wins: square ends everywhere.** Every other rule in that skill
applies unchanged.

**Palette tokens.** TanStack Charts reads `--ts-chart-1` through `--ts-chart-6`
at any container boundary. Map them from our own validated tokens in one place.

## Finding for the shared chart module: the existing chart tokens fail

`src/styles.css` carries `--chart-1` through `--chart-5`, scaffolded by shadcn and
never used. Run through the `dataviz` validator against the dark canvas
(`#0b0d11`), they fail:

```
[FAIL] Lightness band       #83b755 (0.721), #8dcd50 (0.779) outside the dark band
[FAIL] Chroma floor         #499fb8 at 0.09 reads as gray
[FAIL] Normal-vision floor  #8dcd50 vs #83b755 - ΔE 6.5, below the floor of 15
[WARN] CVD separation       #8dcd50 vs #83b755 - ΔE 6.2 deutan
```

The cause: `--chart-2` and `--chart-4` are both lime at hue 132 and
differ only in lightness. Nobody can tell them apart, with or without color
vision deficiency.

**A validated categorical palette has to be built before any multi-series chart
ships.** That is work for
[Task: the shared chart module](https://github.com/alp82/aistack/issues/91).
The lime accent stays the single-series color, which needs no palette at all.

Two further notes for that ticket:

- The site has 12 per-stack accent presets (`.accent-*` in `src/styles.css`). A
  single-series chart on a stack page should use the stack's own accent. A
  multi-series chart must not, because categorical color has to stay fixed per
  entity.
- Light and dark need separately chosen steps rather than an automatic flip. The
  validator has to be run against both surfaces.

## Method

Everything is reproducible.

1. Bundle weight: a scratch Vite 7 project, one entry per candidate, built in
   library mode with `esbuild` minification, React marked external. Sizes are
   `gzip -9` over the emitted chunk.
2. Server rendering: `renderToString` from `react-dom/server` on each candidate
   component, counting `<path>`, `<rect>`, `<line>` and `<text>` in the output.
3. Library metadata: `npm view <pkg> version time.modified peerDependencies
   dependencies` against the live registry on 2026-08-04.
4. TanStack Charts behavior: read from the docs shipped inside the package
   (`node_modules/@tanstack/charts/docs`), not from the website.
5. Bklit behavior: read from `bklit/bklit-ui` source on GitHub
   (`packages/ui/src/line-chart.tsx`).
6. Maintainer statements: the GitHub issues linked above, read with `gh`.
7. Palette: repo OKLCH tokens converted to sRGB hex, then
   `dataviz/scripts/validate_palette.js --mode dark --surface "#0b0d11"`.
