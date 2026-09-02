# Stack page compact pass (alp82/aistack#351)

Throwaway prototype. One self-contained demo: `index.html` (built by `build.py`
from `template.html` + `variants.js` + `slim.json`).

Data: the owner's real prod stack (alpers-coding-stack), fetched read-only from
the public Convex queries on 2026-08-30 and baked into `slim.json`.

## Round 1

Six renders of the whole page, switchable with the bottom bar or `?v=`:

- `base` - today's page reproduced, full copy and spacing. The yardstick.
- `v1` Tight editorial - today's layout language at half rhythm, cards become rows.
- `v2` Ledger - monospace data sheet, ruled tables, two-column measurement list.
- `v3` Mosaic - uniform stat tiles, no tabs, all 15 measurements at once.
- `v4` Split rail - sticky identity rail replaces hero + nav + CTA.
- `v5` Digest - narrow column, summary sentences, detail behind <details>.

Cuts applied in every compact variant: nav block, kickers, notch note,
"random fun fact", per-figure "vs the 30 days before", per-card "/month" and
"Visit", per-figure cost captions folded into one footnote
(">= list prices · 100% priced · table ids"). The switcher prints each
variant's measured height as a share of baseline.

## Round 2

Operator verdict on round 1: too dense, packed, no identity. V1 best of the
worst. Asked for 10 new, strongly distinct designs.

Ten new renders (v6-v15), all with real tool logos embedded and richer charts
(commit heatmap, git bars, phase strip). Same copy cuts as round 1:

- v6 Magazine - giant numerals, alternating dark/light bands, logo strip.
- v7 Terminal - the page as one CLI session, prompt lines per section.
- v8 Bento - mixed-size tile grid, lime cost tile, one fact per tile.
- v9 Billboard - full-bleed statement bands, black/lime/white, giant figures.
- v10 Blueprint - grid paper, outlined modules, callouts, bill of materials.
- v11 Receipt - till-receipt statement, perforated edge, barcode.
- v12 Ticker - trading terminal: model tape, quote tiles, git volume bars.
- v13 Spine - 30-day chart on top, sections alternate along a lime spine.
- v14 Rails - phone-first horizontal snap rails per section.
- v15 Split hero - sticky lime diagonal hero half, compact scrolling half.

## Round 3

Operator verdict on round 2: V6 and V9 set the look, V7 and V10 have good
workflow/tools/projects treatments, V15's right column is nice, the deep info
is missing everywhere. Wants 10 more distinct variations on those preferences.

New shared depth kit: microViz() gives each of the 15 measurements its own
inline chart, plus deep model/tool/project tables with logos and dollars.

- v16 Magazine deep - V6 with the real page's numbered headers and full depth.
- v17 Billboard data - V9 bands, each followed by a deep contrast panel.
- v18 Windows - editorial hero, sections as terminal-window panels (V7 idea).
- v19 Blueprint editorial - V10 modules with V16 typography, 15 gauges.
- v20 Dossier - annual-report paper: chapters, pull-stat sidebars.
- v21 Chapters - V15 per section: sticky giant title half + deep half.
- v22 Mural - one continuous infographic story with connector lines.
- v23 Console pro - matured dashboard, chart column + deep list column.
- v24 Feature table - every measurement row carries its inline chart.
- v25 Story scroll - near-fullscreen chapter slides, giant figures.

## Round 4

Operator verdict on round 3: v16 very strong. Bands too contrasty, try 2 or 4
tints. Usage is a wall of widgets: play with hierarchy, value vs nice-to-have,
visible vs hidden. Liked: v17's lime summary as an accent, v20's title rail,
v22's timeline for single elements, v25's project-integrated stats. Rejected:
v18/19/23 (borders, density), v21 alternating sides, v24 scanning.

Six refinements of v16, one per axis:

- v26 Tonal 4 - four dark tints, podium + quick-scan rows, lime summary accent.
- v27 Rail + drawer - two shades, v20 title rail headers, tail behind a drawer.
- v28 Distributed - measurements move to their natural sections: git stats to
  Projects (with v25 stat cards), kit/routing/effort to Tools, time in Usage.
- v29 Timeline - usage leads with an annotated 30-day timeline (tokens+commits).
- v30 Quiet drawers - value layer only, every deep layer behind styled drawers.
- v31 One moment - each section spends its boldness on one giant statement.

## Round 5

Operator verdict on round 4: v27 frame is strong (title rail, two shades,
drawer presentation). The originals must come back: the metric block with the
fun-fact deck, the cost tooltip, and the colored model breakdown with notches
(screenshot attached in thread). Usage still the open problem: prefer tabbed
or simple-to-details. v28's distributed idea approved but its stats never
rendered. Section rename idea: "Stats". v30 and v31 rejected.

Bug found and fixed: wfCells never carried the row id, so every micro chart in
rounds 3 and 4 silently rendered empty. That was the "wall of labels".

Five treatments of the Stats interior, all in the locked v27 frame with the
rebuilt originals up top (watermark metric block, fun facts on tap, cost hover
card, colored breakdown with hatched notches):

- v32 Simple to details - podium of three, then the drawer with twelve.
- v33 Tabs - the five familiar tabs, compact, pure CSS.
- v34 Distributed - time stays in Stats, git stats to Projects, usage stats
  to Tools, all rendering real figures now.
- v35 Two level - value layer only, drawer opens the full tabbed set.
- v36 Grouped scan - every measurement one row with its chart beside it.

## Round 6

Operator verdict on round 5: v33 (tabs) wins, but the layout is unsteady, the
rhythm and spacing are missing. New idea: the five tabs as accordion rows, one
meaningful summary row per topic with key metrics and a background history
chart. Asked for live toggles: v26 vs v27 title style, plus toggles for other
earlier feedback where applicable.

v37 Composed: one design on a steady 48px rhythm with aligned columns.
Stats = originals top block, then five accordion topic rows (Time, Code,
Models, Harness, Skills), each a one-line summary with key figures over a
watermark history chart, expanding to the full grid. Four live toggles appear
in the bottom bar on v37: title (rail/01-header), bands (2/4 tints),
name (Stats/Actual Usage), rows (accordion/tabs).

## Round 7

Locked in round 6: rail title, 4 tints, "Stats", accordion. Fixes applied:
max-width now 1280px to match the site, the accordion is exclusive (0 or 1
open, native details name= plus a toggle fallback), and boxes, charts, and
chips carry tooltips like the original.

Two new variation knobs on v37, both cycling in the bottom bar:

- top: side / stack / merged / hero - the relationship of the tokens box and
  the model breakdown. stack puts one headline strip over a full-width
  breakdown, merged binds them into one panel, hero leads with the number.
- exp: grid / feature / rows - the accordion's expanded formatting. feature
  pairs the topic's lead chart with scan rows, rows gives one aligned row per
  measurement.

## Round 8 - converged

Operator locked top: stack and exp: feature, both now the demo defaults.
Verdict: the prototype is good enough. Implementation moves to a follow-up
ticket that starts with a short grilling (what to keep from the old page,
what to replace, what to combine, like the previous tooltips) and depends on
the hero prototype (#352). The accepted design is v37 with rail title,
4 tints, "Stats", exclusive accordion, stack top block, feature expansion:
/index.html?v=v37
