import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { RENAMES } from './20260829_vendor_model_ids'

/**
 * Merge the manual model picks into the derived model list (#338, map #332).
 *
 * The list a stack shows is now measured models by token share, then the
 * picks. Roles are gone, so every pick loses its `role`. Along the way each
 * pick is brought onto the catalog's current spelling: a slug still on the
 * #334 rename map is rewritten (a no-op after `20260829_vendor_model_ids`
 * ran), an alias becomes the row's slug, duplicates collapse to the first,
 * and a pick that names no catalog row is dropped. Descriptions survive.
 *
 * IDEMPOTENT. A stack whose picks already match is left untouched. Run it
 * after the deploy that made `role` optional; the follow-up revision removes
 * the field from the schema once this has run on prod.
 */
export const run = internalMutation({
  args: {},
  returns: v.object({
    stacksRewritten: v.number(),
    picksDropped: v.array(v.string()),
    picksRenamed: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const renames = new Map(RENAMES.map(({ from, to }) => [from, to]))
    const bySlug = new Map<string, string>()
    const byAlias = new Map<string, string>()
    for (const row of await ctx.db.query('models').collect()) {
      bySlug.set(row.slug, row.slug)
      for (const alias of row.aliases ?? []) {
        if (!byAlias.has(alias)) byAlias.set(alias, row.slug)
      }
    }
    const canonical = (slug: string): string | null => {
      const renamed = renames.get(slug) ?? slug
      return bySlug.get(renamed) ?? byAlias.get(renamed) ?? bySlug.get(slug) ?? byAlias.get(slug) ?? null
    }

    let stacksRewritten = 0
    const picksDropped: string[] = []
    const picksRenamed: string[] = []
    for (const stack of await ctx.db.query('stacks').collect()) {
      const subs = stack.modelSubscriptions
      if (subs === undefined) continue
      const seen = new Set<string>()
      const next: Array<{ modelSlug: string; description?: string }> = []
      for (const s of subs) {
        const slug = canonical(s.modelSlug)
        if (slug === null) {
          picksDropped.push(`${stack.slug}: ${s.modelSlug}`)
          continue
        }
        if (slug !== s.modelSlug) picksRenamed.push(`${stack.slug}: ${s.modelSlug} -> ${slug}`)
        if (seen.has(slug)) continue
        seen.add(slug)
        next.push(s.description ? { modelSlug: slug, description: s.description } : { modelSlug: slug })
      }
      const unchanged =
        next.length === subs.length &&
        next.every(
          (n, i) =>
            n.modelSlug === subs[i].modelSlug &&
            n.description === subs[i].description &&
            subs[i].role === undefined
        )
      if (unchanged) continue
      await ctx.db.patch(stack._id, { modelSubscriptions: next })
      stacksRewritten++
    }
    return { stacksRewritten, picksDropped, picksRenamed }
  },
})
