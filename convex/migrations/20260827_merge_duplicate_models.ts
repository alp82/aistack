import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'

/**
 * Merge the duplicate OpenAI catalog rows (#294, map #292).
 *
 * The catalog held two rows per model: an older, user-created spelling
 * (`gpt-56-sol`, "GPT 5.6 Sol") and the seeded canonical one (`gpt-5.6-sol`,
 * "GPT-5.6 Sol") from 20260801_openai_models and 20260802_gpt56_models. The
 * measured side resolves to the canonical slug, the authored side stored the
 * old one, so a listed model was re-suggested while it sat in the accordion.
 *
 * For each pair, the canonical row survives. The old slug becomes an alias on
 * it, the icon carries over when the canonical row has none, every stack's
 * `modelSubscriptions` and every model dismissal is rewritten to the canonical
 * slug (deduplicated when a stack already listed both), and the old row is
 * deleted.
 *
 * IDEMPOTENT. A pair whose old row is gone is skipped; the alias is still
 * ensured so the read-side alias lookup keeps working.
 */
export const MERGES: Array<{ keep: string; drop: string }> = [
  { keep: 'gpt-5.6-sol', drop: 'gpt-56-sol' },
  { keep: 'gpt-5.6-terra', drop: 'gpt-56-terra' },
  { keep: 'gpt-5.6-luna', drop: 'gpt-56-luna' },
  { keep: 'gpt-5.5', drop: 'gpt-55' },
  { keep: 'gpt-5.4', drop: 'gpt-54' },
  { keep: 'gpt-5.3-codex', drop: 'gpt-5-3-codex' },
]

export const run = internalMutation({
  args: {},
  returns: v.object({
    merged: v.array(v.string()),
    skipped: v.array(v.string()),
    stacksRewritten: v.number(),
    dismissalsRewritten: v.number(),
  }),
  handler: async (ctx) => {
    const merged: string[] = []
    const skipped: string[] = []
    const canonicalOf = new Map<string, string>()

    for (const { keep, drop } of MERGES) {
      const keepRow = await ctx.db
        .query('models')
        .withIndex('by_slug', (q) => q.eq('slug', keep))
        .first()
      if (!keepRow) {
        skipped.push(`${drop}: no ${keep} row`)
        continue
      }
      canonicalOf.set(drop, keep)
      if (!keepRow.aliases?.includes(drop)) {
        await ctx.db.patch(keepRow._id, {
          aliases: [...(keepRow.aliases ?? []), drop],
        })
      }
      const dropRow = await ctx.db
        .query('models')
        .withIndex('by_slug', (q) => q.eq('slug', drop))
        .first()
      if (!dropRow) {
        skipped.push(`${drop}: already gone`)
        continue
      }
      if (!keepRow.iconStorageId && !keepRow.iconUrl) {
        await ctx.db.patch(keepRow._id, {
          iconStorageId: dropRow.iconStorageId,
          iconUrl: dropRow.iconUrl,
        })
      }
      await ctx.db.delete(dropRow._id)
      merged.push(`${drop} -> ${keep}`)
    }

    let stacksRewritten = 0
    for (const stack of await ctx.db.query('stacks').collect()) {
      const subs = stack.modelSubscriptions ?? []
      if (!subs.some((s) => canonicalOf.has(s.modelSlug))) continue
      const seen = new Set<string>()
      const next = []
      for (const s of subs) {
        const slug = canonicalOf.get(s.modelSlug) ?? s.modelSlug
        if (seen.has(slug)) continue
        seen.add(slug)
        next.push({ ...s, modelSlug: slug })
      }
      await ctx.db.patch(stack._id, { modelSubscriptions: next })
      stacksRewritten++
    }

    let dismissalsRewritten = 0
    for (const d of await ctx.db.query('reconcileDismissals').collect()) {
      if (d.atomKind !== 'model') continue
      const slug = canonicalOf.get(d.atomKey)
      if (!slug) continue
      const clash = await ctx.db
        .query('reconcileDismissals')
        .withIndex('by_stack_atom', (q) =>
          q.eq('stackId', d.stackId).eq('atomKind', 'model').eq('atomKey', slug)
        )
        .first()
      if (clash) await ctx.db.delete(d._id)
      else await ctx.db.patch(d._id, { atomKey: slug })
      dismissalsRewritten++
    }

    return { merged, skipped, stacksRewritten, dismissalsRewritten }
  },
})
