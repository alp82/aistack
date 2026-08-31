import { type Infer, v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { internalQuery } from './_generated/server'
import { publicStackBySlug } from './measured'

/** Which stack a Discord command is about (wayfinder #226). See `discordCommands.ts`. */

export const StackTarget = v.union(
  v.object({ kind: v.literal('unlinked') }),
  v.object({ kind: v.literal('unknown'), slug: v.string() }),
  v.object({
    kind: v.literal('stack'),
    slug: v.string(),
    name: v.string(),
    updatedAt: v.number(),
  }),
)
export type StackTarget = Infer<typeof StackTarget>

function publicSlug(stack: Doc<'stacks'>): string {
  return `${stack.slug}-${stack.shortId}`
}

/**
 * Which stack a command is about. With a slug, that stack. Without one, the
 * newest stack of the creator linked to the Discord user.
 */
export const resolveStack = internalQuery({
  args: { discordUserId: v.string(), slug: v.optional(v.string()) },
  returns: StackTarget,
  handler: async (ctx, args) => {
    if (args.slug !== undefined) {
      const stack = await publicStackBySlug(ctx, args.slug)
      if (!stack) return { kind: 'unknown' as const, slug: args.slug }
      return {
        kind: 'stack' as const,
        slug: publicSlug(stack),
        name: stack.name,
        updatedAt: stack.updatedAt,
      }
    }
    const creator = await ctx.db
      .query('creators')
      .withIndex('by_discordUserId', (q) => q.eq('discordUserId', args.discordUserId))
      .first()
    if (!creator) return { kind: 'unlinked' as const }
    const stacks = await ctx.db
      .query('stacks')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creator._id))
      .collect()
    const stack = stacks.sort((a, b) => b.updatedAt - a.updatedAt)[0]
    if (!stack) return { kind: 'unlinked' as const }
    return {
      kind: 'stack' as const,
      slug: publicSlug(stack),
      name: stack.name,
      updatedAt: stack.updatedAt,
    }
  },
})
