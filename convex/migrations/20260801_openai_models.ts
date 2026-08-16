import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { generateUniqueShortId } from '../lib/ids'

/**
 * Models-catalog data entry for the Codex harness (#67, map #60).
 *
 * The public measured display resolves published model ids against the
 * catalog at read time (#33 decision 3). Codex payloads publish OpenAI slugs
 * (`gpt-5.5`, `gpt-5.4`, …) that resolve to nothing today; these rows make
 * them resolve, and read-time resolution fixes every already-published
 * snapshot with no republish.
 *
 * Slugs come from the observed rollout corpus and `models_cache.json`
 * (docs/research/codex-session-log-anatomy-2026-08.md §3). Only models
 * actually observed in rollouts are added - the catalog is not a mirror of
 * the vendor's whole lineup.
 *
 * IDEMPOTENT. A row is only inserted when its slug resolves to nothing.
 */
const NEW_ROWS: Array<{
  slug: string
  name: string
  description: string
}> = [
  {
    slug: 'gpt-5.5',
    name: 'GPT-5.5',
    description: 'Frontier OpenAI model for coding and agentic work',
  },
  {
    slug: 'gpt-5.4',
    name: 'GPT-5.4',
    description: 'OpenAI general-purpose model for coding and agentic work',
  },
  {
    slug: 'gpt-5.4-mini',
    name: 'GPT-5.4 mini',
    description: 'Fast, low-cost OpenAI model for high-volume tasks',
  },
  {
    slug: 'gpt-5.3-codex',
    name: 'GPT-5.3 Codex',
    description: 'OpenAI model tuned for Codex agentic coding',
  },
]

export const run = internalMutation({
  args: {},
  returns: v.object({
    rowsInserted: v.array(v.string()),
    skipped: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const rowsInserted: string[] = []
    const skipped: string[] = []

    const all = await ctx.db.query('models').collect()
    const resolvable = (id: string) =>
      all.some((r) => r.slug === id || r.aliases?.includes(id))

    for (const spec of NEW_ROWS) {
      if (resolvable(spec.slug)) {
        skipped.push(spec.slug)
        continue
      }
      await ctx.db.insert('models', {
        name: spec.name,
        slug: spec.slug,
        shortId: await generateUniqueShortId(ctx, 'models'),
        provider: 'OpenAI',
        category: 'coding',
        websiteUrl: 'https://openai.com',
        description: spec.description,
        reviewStatus: 'approved',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      rowsInserted.push(spec.slug)
    }

    return { rowsInserted, skipped }
  },
})
