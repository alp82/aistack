/**
 * Whether the news surfaces are public yet (map #198, #207).
 *
 * The pipeline shipped before the content did. Every lane collects, both
 * projections render, and the first issue is authored, but nothing has been
 * sent, so `/news` served an empty topic index with five "Nothing published
 * yet" cards and an archive reading "No issue has gone out yet". That page was
 * linked from the header and the footer of every page on the site.
 *
 * So the surfaces are closed until the first send. While this is `false`:
 *
 * - `/news`, `/news/<slug>`, `/news/topics/<slug>`, and `/subscribe` answer
 *   404, from the LOADER. The gate runs on the server, so the first HTML
 *   carries no page content and there is no client-side flash to read.
 * - The header and footer drop the News link.
 * - `robots.txt` disallows all four paths.
 *
 * The inbox, drafting, and both `newsletter.ts` projections are untouched.
 * They run through `/admin` and `scripts/`, and neither reads this flag.
 *
 * ## Opening the surfaces
 *
 * Set this to `true`, drop the four Disallow lines from `public/robots.txt`,
 * and deploy. Nothing else moves.
 *
 * ## The one coupling to remember
 *
 * A REAL SEND MUST NOT GO OUT WHILE THIS IS `false`. Every issue carries a
 * read-in-browser link to `/news/<slug>` and the send publishes the ready item
 * stream to the topic pages, so a send now would mail links that answer 404.
 * Open the surfaces first, then send. A test send is fine: it publishes
 * nothing, and the owner is the only recipient.
 */
export const NEWS_IS_PUBLIC = false;
