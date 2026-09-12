# Homepage Discord guide prototype

Throwaway exploration for [Prototype homepage Discord installation and usage guide](https://github.com/alp82/aistack/issues/417).

Question: how should the homepage explain installing and using the bot, and show its replies?

Run `pnpm dev` (the owner's existing server already uses port 3019), then open:

- `http://localhost:3019/?variant=discord-A#discord-guide`: install-first walkthrough.
- `http://localhost:3019/?variant=discord-B#discord-guide`: command explorer with setup steps underneath.
- `http://localhost:3019/?variant=discord-C#discord-guide`: example-led invitation with expandable instructions.

All variants sit after featured stacks on the existing homepage. The floating bar and left/right keys cycle layouts; URL state survives reloads. Select a command to preview its reply. Images open at full size. Variant C expands setup instructions in memory. The ordinary homepage and production rendering omit the prototype. The install CTA uses the site's existing canonical Discord install URL; the prototype performs no Discord registration or message send.

`discord-guide-images` contains rendered PNGs from the previously approved live bot prototype. Their statistics are synthetic and visibly marked as example data. These illustrate the visual direction, not final production data acceptance. The earlier cost image has three preview entries; the agreed production contract now calls for five. Refresh final homepage images from the accepted production renderer before publication.

The owner selected variant A (install-first walkthrough). The prototype ticket is resolved. Production implementation is tracked in [Implement the homepage Discord install-first walkthrough](https://github.com/alp82/aistack/issues/418). Publish instructions only once the described commands are available; retain this prototype as the design reference until that implementation replaces the temporary wiring.

Verification: Biome checks, browser checks of all three layouts at desktop and 390px mobile widths, image loads, layout/command switching, expandable instructions, and ordinary-homepage exclusion. Repository type checking reports errors in unrelated CLI prototype and existing fixtures/tests; no errors name these changed files.
