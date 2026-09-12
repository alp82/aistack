# Production renderer validation

On 2026-09-12, `pnpm build` completed and the resulting
`.output/server/index.mjs` served signed requests on a separate local port.
The local `discordStats.readAnswer` projection for `alperortac`, covering
2026-09-06 through 2026-09-12, supplied all statistics and catalog icons.
The database had already been refreshed from production by the data-read task.

All five starter payloads and their person-comparison variants returned HTTP
200 and PNG content. The ten PNGs were 49,852 through 161,162 bytes. The
comparison smoke uses the same real subject on both sides to verify identical
values and zero difference; unequal and unavailable counterparts are covered
by renderer tests and subsequent live acceptance.

Representative outputs were visually inspected:

- [Context matrix](context.png): inferred window, median/p90, real harness icon,
  palette legend and the shared 200-cell context derivation.
- [Full subscription list](cost.png): paid bundles charged once, included/free
  states, real icons and measured-cost sources/coverage below current plans.
- [Person comparison](compare-comparison.png): token/cost values, source and
  coverage disclosure for each subject, model shares and aligned bars.

The built output contains native Sharp and libvips dependencies under
`.output/server/node_modules`. The smoke exercised actual rasterization through
the built HTTP route. No production deployment, command registration or Discord
message was needed.

The renderer, palette and no-em-dash suites passed all 28 tests. Biome checks
passed for the new TypeScript modules. Whole-app TypeScript checking still has
existing unrelated errors; none reference the new renderer modules.
