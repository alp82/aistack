import { internalMutation } from '../_generated/server'
import { DEFAULT_MIN_POINTS } from '../lib/hackerNews'

/**
 * The Hacker News lane of the news pipeline (#208, map #198).
 *
 * ONE row, not a list. Hacker News is one place, read through one API, so the
 * owner never adds a second. The Sources view shows this row like any other:
 * the enable toggle, the health of the last run, and the points gate.
 *
 * The URL is the Algolia `search_by_date` endpoint the lane calls. It is not a
 * feed and nothing parses it as one: `collect` reads `feed` sources and
 * `collectHackerNews` reads `hn` sources.
 *
 * `collectFrom` is the moment this runs, so the lane starts empty and collects
 * forward, like every other source. The first run then reads the trailing 48
 * hours as usual.
 *
 * IDEMPOTENT. The row is inserted only when no `hn` source exists.
 * Run with `scripts/convex-prod.sh run migrations/20260823_news_hn_lane:run`.
 */
const HN_SOURCE = {
  name: 'Hacker News',
  slug: 'hacker-news',
  url: 'https://hn.algolia.com/api/v1/search_by_date',
}

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const sources = await ctx.db.query('newsSources').collect()
    if (sources.some((s) => s.kind === 'hn')) {
      return { inserted: 0, skipped: 1 }
    }
    const now = Date.now()
    await ctx.db.insert('newsSources', {
      name: HN_SOURCE.name,
      slug: sources.some((s) => s.slug === HN_SOURCE.slug)
        ? `${HN_SOURCE.slug}-lane`
        : HN_SOURCE.slug,
      kind: 'hn',
      url: HN_SOURCE.url,
      // Titles and links, with comment excerpts that link back. From the
      // re-serving table in docs/specs/news-pipeline.md.
      licenseClass: 'hn',
      enabled: true,
      collectFrom: now,
      minPoints: DEFAULT_MIN_POINTS,
      consecutiveFailures: 0,
      createdAt: now,
      updatedAt: now,
    })
    return { inserted: 1, skipped: 0 }
  },
})
