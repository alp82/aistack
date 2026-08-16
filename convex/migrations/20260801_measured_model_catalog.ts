import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { generateUniqueShortId } from '../lib/ids'

/**
 * Models-catalog data entry for the owner's measured window.
 *
 * Wayfinder ticket #64 (map #60). The public measured display resolves
 * published model ids against the catalog at read time (#33 decision 3), slug
 * first, then `aliases`. Four ids in the owner's real window resolve to
 * nothing and publish as raw vendor ids:
 *
 * - `claude-fable-5`   → the catalog row is `fable-5`; add the alias.
 * - `claude-opus-4-8`  → the catalog row is `claude-opus-48`; add the alias.
 * - `claude-sonnet-5`  → no catalog row; insert one.
 * - `claude-haiku-4-5` → no catalog row; insert one.
 *
 * Read-time resolution means every old immutable snapshot is fixed the moment
 * these rows exist - no republish.
 *
 * IDEMPOTENT. Aliases are only appended when absent, and a row is only
 * inserted when its slug is absent. A second run reports zero changes.
 */

/**
 * Vendor ids whose catalog row already exists under a different slug (prod).
 * On a backend where the target row is missing (dev seeds), the fallback row
 * is inserted instead, keyed by the vendor id itself, so the migration
 * converges everywhere.
 */
const ALIASES: Array<{
  slug: string
  alias: string
  fallback: { name: string; description: string }
}> = [
  {
    slug: 'fable-5',
    alias: 'claude-fable-5',
    fallback: {
      name: 'Fable 5',
      description: 'Most capable Claude 5 model, Mythos-class tier',
    },
  },
  {
    slug: 'claude-opus-48',
    alias: 'claude-opus-4-8',
    fallback: {
      name: 'Claude Opus 4.8',
      description: 'Frontier Claude 4 model for coding and agentic work',
    },
  },
]

const NEW_ROWS: Array<{
  slug: string
  name: string
  contextWindow?: number
  description: string
}> = [
  {
    slug: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    description: 'Balanced Claude 5 model for coding and agentic work',
  },
  {
    slug: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    contextWindow: 200000,
    description: 'Fast, low-cost Claude model for high-volume tasks',
  },
]

/**
 * The existing approved Anthropic row whose icon the inserted rows reuse.
 * Sharing a `_storage` id across catalog rows is how siblings already share
 * the Claude mark.
 */
const ICON_ANCHOR_SLUG = 'claude-opus-5'

export const run = internalMutation({
  args: {},
  returns: v.object({
    aliasesAdded: v.array(v.string()),
    rowsInserted: v.array(v.string()),
    skipped: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const aliasesAdded: string[] = []
    const rowsInserted: string[] = []
    const skipped: string[] = []

    const bySlug = async (slug: string) =>
      await ctx.db
        .query('models')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .first()

    const all = await ctx.db.query('models').collect()
    const anchor = await bySlug(ICON_ANCHOR_SLUG)

    const insertRow = async (spec: {
      slug: string
      name: string
      contextWindow?: number
      description: string
    }) => {
      await ctx.db.insert('models', {
        name: spec.name,
        slug: spec.slug,
        shortId: await generateUniqueShortId(ctx, 'models'),
        provider: 'Anthropic',
        category: 'coding',
        iconUrl: anchor?.iconUrl,
        iconStorageId: anchor?.iconStorageId,
        websiteUrl: 'https://anthropic.com',
        contextWindow: spec.contextWindow,
        description: spec.description,
        reviewStatus: 'approved',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      rowsInserted.push(spec.slug)
    }

    for (const { slug, alias, fallback } of ALIASES) {
      // Already resolvable - as a slug or as an alias anywhere - is a skip,
      // not an error: resolution scans every row's aliases, so a duplicate
      // entry would only add ambiguity.
      const resolvable =
        all.some((r) => r.slug === alias) ||
        all.some((r) => r.aliases?.includes(alias))
      if (resolvable) {
        skipped.push(alias)
        continue
      }
      const row = await bySlug(slug)
      if (!row) {
        await insertRow({ slug: alias, ...fallback })
        continue
      }
      await ctx.db.patch(row._id, {
        aliases: [...(row.aliases ?? []), alias],
        updatedAt: Date.now(),
      })
      aliasesAdded.push(alias)
    }

    for (const spec of NEW_ROWS) {
      if (await bySlug(spec.slug)) {
        skipped.push(spec.slug)
        continue
      }
      await insertRow(spec)
    }

    return { aliasesAdded, rowsInserted, skipped }
  },
})
