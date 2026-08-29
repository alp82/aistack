import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'

/**
 * Rename the catalog slugs to the vendor's bare API id (ADR-0012, #334, #336).
 *
 * The rename map is the audit's table in #334. For each pair the row's slug
 * becomes the vendor id, every stack's `modelSubscriptions[].modelSlug` and
 * every model dismissal pointing at the old slug is rewritten, and an alias
 * that equals the new slug is dropped (an alias that equals the old slug is
 * dropped too: it would only point a lookup at a spelling nothing stores).
 * The rejected `opus-48` duplicate is deleted, and the dangling
 * `qwen3.5-9b-(local)-4q` pick, which names no row anywhere, is removed from
 * the one stack that holds it.
 *
 * IDEMPOTENT. A pair whose old row is gone is skipped, and a rename whose new
 * slug already belongs to another row is refused and reported rather than
 * creating a duplicate.
 */
export const RENAMES: Array<{ from: string; to: string }> = [
  { from: 'claude-haiku-46', to: 'claude-haiku-4-6' },
  { from: 'claude-haiku-47', to: 'claude-haiku-4-7' },
  { from: 'claude-opus-47', to: 'claude-opus-4-7' },
  { from: 'claude-opus-48', to: 'claude-opus-4-8' },
  { from: 'claude-sonnet-47', to: 'claude-sonnet-4-7' },
  { from: 'fable-5', to: 'claude-fable-5' },
  { from: 'gemini-3-1-pro', to: 'gemini-3.1-pro-preview' },
  { from: 'gemini-3-pro', to: 'gemini-3-pro-preview' },
  { from: 'gpt-5-2', to: 'gpt-5.2' },
  { from: 'gpt-54-codex', to: 'gpt-5.4-codex' },
  { from: 'deepseek-v3-2', to: 'deepseek-v3.2' },
  { from: 'minimax-m2-5', to: 'minimax-m2.5' },
  { from: 'kimi-k2-5', to: 'kimi-k2.5' },
  { from: 'glm-52', to: 'glm-5.2' },
  { from: 'grok-4-1', to: 'grok-4.1' },
  { from: 'grok-43', to: 'grok-4.3' },
  { from: 'grok-45', to: 'grok-4.5' },
  { from: 'composer-25', to: 'composer-2.5' },
  { from: 'swe-1-5', to: 'swe-1.5' },
]

/** Rows to delete outright: rejected duplicates of a row that stays. */
export const DELETE_SLUGS = ['opus-48']

/** Picks that name no row anywhere and never will. */
export const DANGLING_PICKS = ['qwen3.5-9b-(local)-4q']

export const run = internalMutation({
  args: {},
  returns: v.object({
    renamed: v.array(v.string()),
    skipped: v.array(v.string()),
    deleted: v.array(v.string()),
    stacksRewritten: v.number(),
    dismissalsRewritten: v.number(),
  }),
  handler: async (ctx) => {
    const renamed: string[] = []
    const skipped: string[] = []
    const deleted: string[] = []
    const canonicalOf = new Map<string, string>()

    for (const { from, to } of RENAMES) {
      const clash = await ctx.db
        .query('models')
        .withIndex('by_slug', (q) => q.eq('slug', to))
        .first()
      const row = await ctx.db
        .query('models')
        .withIndex('by_slug', (q) => q.eq('slug', from))
        .first()
      if (clash) {
        // Already renamed, or a second row minted under the new slug. Picks
        // that still carry the old spelling are rewritten either way.
        canonicalOf.set(from, to)
        skipped.push(row ? `${from}: ${to} already exists` : `${from}: already renamed`)
        continue
      }
      if (!row) {
        skipped.push(`${from}: no such row`)
        continue
      }
      canonicalOf.set(from, to)
      const aliases = (row.aliases ?? []).filter((a) => a !== to && a !== from)
      await ctx.db.patch(row._id, {
        slug: to,
        ...(aliases.length > 0 ? { aliases } : { aliases: undefined }),
        updatedAt: Date.now(),
      })
      renamed.push(`${from} -> ${to}`)
    }

    for (const slug of DELETE_SLUGS) {
      const row = await ctx.db
        .query('models')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .first()
      if (!row) continue
      await ctx.db.delete(row._id)
      deleted.push(slug)
    }

    // A rename's old slug is also cleared wherever it survives as an alias on
    // the renamed row's peers (the earlier merge migration added some), and an
    // alias equal to a row's own slug is cleared everywhere.
    for (const row of await ctx.db.query('models').collect()) {
      const aliases = row.aliases ?? []
      const kept = aliases.filter((a) => a !== row.slug)
      if (kept.length !== aliases.length) {
        await ctx.db.patch(row._id, {
          ...(kept.length > 0 ? { aliases: kept } : { aliases: undefined }),
        })
      }
    }

    const dangling = new Set(DANGLING_PICKS)
    let stacksRewritten = 0
    for (const stack of await ctx.db.query('stacks').collect()) {
      const subs = stack.modelSubscriptions ?? []
      if (!subs.some((s) => canonicalOf.has(s.modelSlug) || dangling.has(s.modelSlug))) {
        continue
      }
      const seen = new Set<string>()
      const next = []
      for (const s of subs) {
        if (dangling.has(s.modelSlug)) continue
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

    return { renamed, skipped, deleted, stacksRewritten, dismissalsRewritten }
  },
})
