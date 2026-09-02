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

# Hero and subnav (alp82/aistack#352)

Same demo, same data. The accepted v37 body stays untouched under each variant;
only the top of the page and the section navigation change. Default variant is
now v38. The bottom bar keeps the v37 knobs on v38-v40 and gains a "390" button
that opens the current variant in a 390px window for the mobile read.

## Round 1

Three hero and subnav pairs, each answering the same three questions: what the
hero promises, how the subnav guides and tracks scroll, and how both behave
on mobile.

- v38 Masthead + tabs. Hero promises identity plus two figures: the authored
  price (lime tile, hover for the breakdown) and the measured tokens (outlined
  tile with the 30-day sparkline, links to Stats), then a "built with" logo
  strip. Subnav is a tab bar under the hero that sticks under the site header;
  each tab carries the section's stat, the current tab gets a lime underline,
  and the stack name and price appear in the bar once it is stuck. Mobile: tiles
  side by side, tabs scroll horizontally with the stats dropped.
- v39 Figures first. The four section figures are the hero: 6.18B tokens,
  6 projects, 11 tools at $336/mo, 2 min guide, one tile each with a watermark
  chart, every tile a link to its section. The name shrinks to a masthead line,
  the one-liner follows in large type. Subnav is a vertical rail on the left on
  screens wider than 1560px, with a lime progress line that fills as the page is
  read; narrower screens get a sticky strip of the same four figures under the
  header. Mobile: tiles in a 2x2 grid, figure strip stays pinned.
- v40 Contents + scrubber. Hero is a two-column split: name, one-liner and
  byline on the left, an "in this stack" ladder on the right with one sentence
  per section (numbers only, no adjectives), each a link. Subnav is a reading
  scrubber pinned under the header once the hero leaves: four segments sized by
  section height, the current one underlined, a lime fill that shows how far
  through each section the reader is. Mobile: the segments keep only their
  numbers except the current one.

Rules carried from the real hero: no measured dollars in the hero (the only
money is the authored price), nothing without a reading, the spy marks the
section a third of the way down the viewport.

## Round 2

Operator verdict on round 1: v38 by far. Issues: the upvote, share and report
chips are ugly, small, and ignore that the three actions differ in importance;
the rule above the logo strip distracts (same grey as everything else);
"built with" reads as "this page was built with"; "checked" should be
"updated"; the subnav has too many lines.

Four knobs on v38, cycling in the bottom bar (defaults first):

- act: stacked (Upvote as a lime outline button and Share as a ghost button
  under the one-liner, Report a dotted text link by the update stamp) /
  tile (the two buttons head the tile column) / corner (top right of the hero)
  / chips (round 1).
- rule: dim (25% hairline) / none (spacing only) / line (round 1).
- lbl: "runs on" / "11 tools" / none.
- nav: quiet (one dim hairline, no tab borders) / bare (tint band, no lines,
  shadow when stuck) / lines (round 1).

## Round 3

Locked: act tile, lbl none (logos carry tooltips with name and price, the +N
chip lists the rest), nav quiet with no stats and every tab 180px wide. rule
none gained more room; new rule dim2 draws the hairline above and below the
logo strip for symmetry. The bottom bar collapses the 40 variants and the v37
knobs behind a "…" button; only the #352 knobs show by default.

## Round 4

Title fitter: the name shrinks from 88px until it fits one line; below 44px it
wraps to two lines and shrinks again to fit two. The title block reserves two
lines of height so every stack's hero is the same height. `?name=...` swaps in
any name to test it. Mobile keeps the buttons at their natural width and puts
the two tiles side by side. The quiet subnav underlines only the label, not the
180px tab. The "// sync" style kickers are gone from the section rails.

## Round 5

Name and one-liner sit right under the byline; the tool row follows at 36px
logos, five tools with a +N chip, or all six when there are six. The update
stamp and Report link sit under the tokens tile as part of the column. Quiet
subnav tabs are 150px wide with a 20px gap and the underline spans the tab.
The left column reserves a fixed height so a one-line name gets the space.

## Round 6

Quiet tabs are 100px wide with a 14px gap. The underline is now a visibility
indicator: each tab's lime segment covers the part of its section that is on
screen (left edge = share scrolled past the top, right edge = share still
below the fold), so one continuous line across the tabs shows what is on
screen. The stuck bar keeps the name on the left and moves the price to the
far right.

## Round 7

The stuck subnav is two lines: an identity row (avatar, name, author, price,
30-day sparkline with the token total, upvotes) appears above the unchanged
tab row, so nothing shifts sideways. Tabs are 136px wide with no gap, so the
visibility segments join into one line. Mobile keeps avatar and name only in
the identity row.

## Round 8

Identity row: avatar, name, upvotes, price; sparkline and token total on the
right. A "window" dropdown (30 days, 7 days, 24 hours) ends the tab row and
sets `?win=`, which relabels the Stats meta and headline (the demo has 30-day
data only, so the figures do not change). The visibility segments overlap
their neighbor by 1px to close the seam. A tab is active while at least half
of its section, or half of the viewport, shows it.

## Round 9

Micro animations: the identity row unfolds (grid-rows 0fr to 1fr plus a fade)
when the bar sticks and folds back on the way up; tab clicks smooth-scroll to
the section and update the hash; the visibility segments ease between scroll
frames. A click anywhere on the identity row scrolls smoothly to the top.
