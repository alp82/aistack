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
