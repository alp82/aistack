# Stats release verification, 2026-09-20

Acceptance contract: [Lock the Stats cut list and build spec](https://github.com/alp82/aistack/issues/466#issuecomment-5747486474).
Completion task: [Update Stats docs and verify the production release](https://github.com/alp82/aistack/issues/469).

## Deployed revision

`https://aistack.to/api/discord/render` returned `ready: true` and revision
`142f4bcfb72370ebdea888f9d57c6880a41ecfcb`, the merged Stats UI release.
[Its deployment workflow](https://github.com/alp82/aistack/actions/runs/35491527661)
completed successfully. This audit changes documentation only.

## Browser checks

Chromium loaded each production page at 1440px, 390px and 320px. All nine checks
passed: no horizontal overflow, no window/machine controls or tabs, and no cut metric
labels. Vendor model names containing "thinking" remain valid model names.

| Reading | Production page | Visible blocks below tiles |
| --- | --- | --- |
| Rich | [Alper's Coding Stack](https://aistack.to/stacks/alpers-coding-stack-unw0sl) | Models, Harnesses, Context per call, Skills, Subagent types, The week, Lines changed, Where the time goes, Languages |
| Sparse | [Brilliant Insane](https://aistack.to/stacks/brilliant-insane-xg5pfo) | Models, The week, Lines changed, Languages |
| Sparsest reading | [Radiumcoders](https://aistack.to/stacks/radiumcoders-b73vfg) | Models, Harnesses, Context per call, The week, Lines changed, Languages |

Both rich phone widths opened all four independent disclosures: additional models,
subagent routing, every hour, and pricing sources. Expanded pages still fit. Context
waffles remained visible. Desktop hover exposed both shorter and longer session tracks.
Screenshots confirmed the compact five-tile layout, mirrored line bars and omission of
empty categories. The rich page contains no MCP block because its public MCP inventory
is empty; this is expected missing-data behavior.

With JavaScript disabled, the production rich page still contained the Stats section
and 1,368 SVG rect/path marks. This verifies page-level server rendering as well as the
component SSR tests. No production server-render error marker appeared in the HTML.

## Deployed readings

Read-only queries used `scripts/convex-prod.sh run` on the server. No local Convex CLI
was pointed at production and no production data or consent flag was changed.

- All three Stats readings reported August 22 through September 20, with July 23
  through August 21 as the previous period.
- Rich median: 8-16 measured minutes over 479 sessions; prior: 4-8 over 112 sessions.
  Both sparse medians were null and their tiles were absent.
- Rich inventory: nine public skills, three subagent types and zero MCP servers.
  Both sparse inventories were empty and rendered no inventory blocks.
- Rich Git additions: 786,351. Sparse: 36,910. Sparsest: 379,941. The rendered totals
  matched their respective public single-source readings.
- Rich cost: estimated USD 6,393.59, with 98.4% of tokens covered and six cited price
  sources. The phone showed approximately USD 6,394, coverage and the source disclosure.
  Withheld skill/subagent and extension notices remained visible without private names.

Consent-off and incomplete-evidence cases were verified in tests rather than by
changing public accounts. The tested contracts include all-machine unequal weights,
Git source isolation, incomplete inventory counts, withheld denominators, current and
previous median ranges, sparse evidence, null live responses and both consent gates.

## Checks and limitations

202 tests passed: 97 across workflow aggregation, Stats, chart SSR/palette and the
no-em-dash check; 105 in measured usage, including cost consent. `git diff --check`
passed. No application source changed in this documentation task.

Chromium reported React hydration error 418 on all three production pages. It did not
prevent complete Stats server HTML, live readings, disclosures or layout checks. This
audit does not establish its cause or claim a clean whole-page hydration run. The local
rich page separately exhibits the previously recorded Tiptap SSR fallback; local server
HTML was not used as production SSR evidence. These page-level limitations remain
outside the verified Stats rendering and data contracts.

Session-local raw query responses, browser logs and screenshots are under
`/tmp/stats-release-audit/` on the verification machine. This document preserves the
results without requiring those temporary files to survive.
