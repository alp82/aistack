import { internalMutation } from '../_generated/server'

/**
 * The phase-1 source list of the news pipeline (#204, map #198).
 *
 * These are the 14 sources of `docs/specs/news-pipeline.md` phase 1, and the
 * prototype (#177) polled every one of them on 2026-08-19: all 14 returned a
 * parseable feed with items. Two URLs are deliberately the pre-move ones, so
 * the 301 the poller follows keeps being exercised: blog.google moved its RSS
 * path, and sst/opencode moved to anomalyco/opencode.
 *
 * The license class of each row comes from the re-serving table in the spec.
 * The four permissive repos were re-checked against the GitHub API on
 * 2026-08-23: codex and gemini-cli are Apache-2.0, opencode and pi are MIT,
 * and claude-code carries no license at all.
 *
 * `collectFrom` is the moment this runs, so the first poll collects nothing
 * older than the seed. The OpenAI feed alone serves 1139 archive items.
 *
 * IDEMPOTENT. A row is inserted only when its URL is not already a source.
 * Run with `scripts/convex-prod.sh run migrations/20260823_news_phase1_sources:run`.
 */
const PHASE_1: Array<{
  name: string
  url: string
  licenseClass:
    | 'article'
    | 'permissive-release-notes'
    | 'unlicensed-release-notes'
  attribution?: string
}> = [
  {
    name: 'OpenAI News',
    url: 'https://openai.com/news/rss.xml',
    licenseClass: 'article',
  },
  {
    name: 'Google AI Blog',
    url: 'https://blog.google/technology/ai/rss/',
    licenseClass: 'article',
  },
  {
    name: 'Latent Space',
    url: 'https://www.latent.space/feed',
    licenseClass: 'article',
  },
  {
    name: '404 Media',
    url: 'https://www.404media.co/rss/',
    licenseClass: 'article',
  },
  {
    name: 'AI News',
    url: 'https://buttondown.com/ainews/rss',
    licenseClass: 'article',
  },
  {
    name: 'Computer Things',
    url: 'https://buttondown.com/hillelwayne/rss',
    licenseClass: 'article',
  },
  {
    name: 'Simon Willison',
    url: 'https://simonwillison.net/atom/everything/',
    licenseClass: 'article',
  },
  {
    name: 'AI News and Strategy Daily',
    url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UC0C-17n9iuUQPylguM1d-lQ',
    licenseClass: 'article',
  },
  {
    name: 'aicrier',
    url: 'https://aicrier.com/feed.xml',
    licenseClass: 'article',
  },
  {
    name: 'claude-code releases',
    url: 'https://github.com/anthropics/claude-code/releases.atom',
    licenseClass: 'unlicensed-release-notes',
  },
  {
    name: 'codex releases',
    url: 'https://github.com/openai/codex/releases.atom',
    licenseClass: 'permissive-release-notes',
    attribution: 'openai/codex, Apache-2.0',
  },
  {
    name: 'gemini-cli releases',
    url: 'https://github.com/google-gemini/gemini-cli/releases.atom',
    licenseClass: 'permissive-release-notes',
    attribution: 'google-gemini/gemini-cli, Apache-2.0',
  },
  {
    name: 'opencode releases',
    url: 'https://github.com/sst/opencode/releases.atom',
    licenseClass: 'permissive-release-notes',
    attribution: 'anomalyco/opencode, MIT',
  },
  {
    name: 'pi releases',
    url: 'https://github.com/earendil-works/pi/releases.atom',
    licenseClass: 'permissive-release-notes',
    attribution: 'earendil-works/pi, MIT',
  },
]

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'untitled'
  )
}

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('newsSources').collect()
    const seenUrls = new Set(existing.map((s) => s.url))
    const seenSlugs = new Set(existing.map((s) => s.slug))
    const now = Date.now()

    let inserted = 0
    for (const source of PHASE_1) {
      if (seenUrls.has(source.url)) continue
      let slug = slugify(source.name)
      for (let n = 1; seenSlugs.has(slug); n++) {
        slug = `${slugify(source.name)}-${n}`
      }
      seenSlugs.add(slug)
      seenUrls.add(source.url)
      await ctx.db.insert('newsSources', {
        name: source.name,
        slug,
        kind: 'feed',
        url: source.url,
        licenseClass: source.licenseClass,
        attribution: source.attribution,
        enabled: true,
        collectFrom: now,
        consecutiveFailures: 0,
        createdAt: now,
        updatedAt: now,
      })
      inserted++
    }
    return { inserted, skipped: PHASE_1.length - inserted }
  },
})
