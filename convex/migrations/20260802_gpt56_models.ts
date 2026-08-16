import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { generateUniqueShortId } from '../lib/ids'

/**
 * Models-catalog data entry for the gpt-5.6 family (#72, map #60).
 *
 * The Codex live test (#69) surfaced `gpt-5.6-sol`, `gpt-5.6-luna` and
 * `gpt-5.6-terra` in real rollouts; none resolve against the catalog, so the
 * public page renders the raw ids. These rows make them resolve, and
 * read-time resolution fixes every already-published snapshot with no
 * republish - the same shape as 20260801_openai_models.
 *
 * `codex-auto-review` is deliberately NOT added: it is an internal Codex
 * routing label, not a public model (openai/codex#20981). It gets a price in
 * the CLI table but stays out of the catalog, so reconcile never suggests it
 * as an authored model.
 *
 * IDEMPOTENT. A row is only inserted when its slug resolves to nothing.
 */
const NEW_ROWS: Array<{
  slug: string
  name: string
  description: string
}> = [
  {
    slug: 'gpt-5.6-sol',
    name: 'GPT-5.6 Sol',
    description: 'Frontier tier of the OpenAI GPT-5.6 family',
  },
  {
    slug: 'gpt-5.6-terra',
    name: 'GPT-5.6 Terra',
    description: 'Balanced tier of the OpenAI GPT-5.6 family',
  },
  {
    slug: 'gpt-5.6-luna',
    name: 'GPT-5.6 Luna',
    description: 'Fast, low-cost tier of the OpenAI GPT-5.6 family',
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
