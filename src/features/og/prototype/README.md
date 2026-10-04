# OG images prototype

Throwaway visual asset. Question: what should the OG images look like, one per
subpage and one per dynamic page, so that they read as one family?

Run `pnpm dev`, then open http://localhost:3019/prototype/og-images. The route
and the image endpoint are visible only in development.

Switch families with `?variant=A` through `?variant=M`, the bottom bar, or the
arrow keys. Every image is rendered by takumi at 1200x630 through
`/api/og/prototype/<card>?variant=<A|B|C>&id=<slug or handle>`, from the local
database. Without `id` the endpoint picks a real row (the leaderboard leader, a
creator with an avatar, the newest sent issue, the first topic) and falls back to
a fixture when the local database has none.

The nine families, over one `OgCard` (`cards.ts`). D is what production ships
today, so the others can be judged against it:

* **A Ledger.** Type-led. The landing hero as a card: mono kicker, black
  uppercase headline with one accent word, a rule, a ledger row of figures.
* **B Plate.** Number-led. The Discord card language: lime name plate with a hard
  shadow, one hero figure on the right, secondary figures under a rule.
* **C Split.** Color-block. A lime panel carries the brand, section and faces;
  the dark panel carries a mixed-case title and a stats table.
* **D Current (as shipped).** What production serves today. The stack card is
  the generated stack image (`src/components/og/StackOgImage.tsx`). Every other
  card is the one static banner, `public/banners/aistack.png`, shown as the
  file itself: no page-specific copy exists yet.
* **E Banner, per page.** That banner rebuilt per page in takumi: mono kicker,
  huge headline with the accent word on a lime block (no skew: takumi has no
  transforms), barred description, and the two buttons carrying the first two
  figures. Dynamic cards add a faces row under the headline.
* **F Terminal.** Mono throughout. The sync log as a card: a prompt line, the
  mixed-case title, the description as a comment, one OK row per figure.
* **G Poster.** One figure fills the card. Title, faces and the other figures
  sit in a small footer.
* **H Frame.** An accent frame around a dark panel, centered mixed-case title
  with the avatar above it, three columns of figures along the bottom.
* **I Topbar.** A strong accent bar across the top only. Below it a
  left-aligned mixed-case title, the description, faces, and a ledger row of
  figures over a rule.

Two takumi facts learned here: an explicit `undefined` style value crashes the
renderer (the dev server answers "socket hang up"), and adjacent inline spans in
a flex row drop their spaces, so a headline with an accent word needs a `gap`.

A third fact, about Vite rather than takumi: in dev, a request carrying
`Sec-Fetch-Dest: image` (a plain `<img src>`) is routed around the app server and
answers "Cannot GET". The gallery fetches each image and shows a blob URL instead.
The existing `/api/og/stack/$slug` route has the same dev-only limitation; a
top-level navigation to it works, and production is unaffected.

## Round two

The review of A to I kept: the hero headline with the accent word (A, E), the
stack-card header (D), the chip grid (D), the metric boxes (E), the frame and
centering (H), the split (C), and the top bar (I, a bit thinner). It dropped B,
F and G. Round two composes those pieces along two directions, because the
subpages differ in what they lead with:

Big title in focus:

* **J Title.** Top bar, kicker and brand row, the hero headline with the accent
  word on a block, metric boxes as the footer. No quote bar, no icons.
* **L Frame 2.** The frame, everything bigger: uppercase headline with the
  accent word, larger avatar, icons or a higher-contrast description, metric
  boxes centered along the bottom.

Smaller title, elements in focus:

* **K Board.** Top bar, the stack-card header (avatar, mixed-case title,
  kicker), the chip grid as the body, metric boxes as the footer. Cards without
  icons show the description large instead of the grid.
* **M Split 2.** The headline on the lime panel, the chip grid and metric boxes
  on the dark panel.
