# Discord reply prototype

Throwaway visual asset for [Prototype concise replies for the chosen Discord questions](https://github.com/alp82/aistack/issues/401).
The ticket's resolution comment is the canonical decision record.

Run `pnpm dev`, then open `/prototype/discord-replies`. The owner's existing server
serves this route at http://localhost:3019/prototype/discord-replies.

The route is visible only in development. The default variant follows the selected
example. Override it with `?variant=A`, `?variant=B`, or `?variant=C`, or use the bottom
arrows. The example dropdown and narrow-width button are preview controls. They do
not propose Discord command syntax or interactive components.

All people, measurements, prices, and model labels are synthetic. The fixture price
source illustrates the disclosure shape and is not a citation to a real price period.
No database access, Discord registration, or message publication is involved.

The image variant is an HTML/SVG composition for visual review, not an uploaded
image. Charts use the existing shared chart components and Context body. Browser
rendering does not establish Discord's final attachment sizing or mobile legibility.

The examples cover totals, crowded breakdowns, daily cost by model, period/person
comparisons, a zero baseline, subscription and usage costs, context, habits, Git,
missing dates, unavailable measurements, and unpublished cost. Inspect full reply
data exposes the fixture and the unabridged breakdown.

Validation: browser navigation and default selection, desktop and narrow visual
inspection, Biome on the TypeScript files, and whitespace/no-em-dash checks. The
workspace TypeScript check reports errors in unrelated files and none in this
prototype. No live Discord rendering has been validated.
