import { mutation } from './_generated/server'
import { v } from 'convex/values'

export const getOrCreateForUser = mutation({
  args: {
    imageUrl: v.optional(v.string()),
  },
  returns: v.object({
    _id: v.id('creators'),
    name: v.string(),
    slug: v.string(),
    xHandle: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    verified: v.boolean(),
    personalPages: v.array(v.object({ name: v.string(), url: v.string() })),
    projectPages: v.array(v.object({ name: v.string(), url: v.string() })),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]

    const existing = await ctx.db
      .query('creators')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first()

    if (existing) {
      // Backfill avatarUrl from Google profile pic if not yet set
      if (!existing.avatarUrl && args.imageUrl) {
        await ctx.db.patch(existing._id, { avatarUrl: args.imageUrl })
      }

      return {
        _id: existing._id,
        name: existing.name,
        slug: existing.slug,
        xHandle: existing.xHandle,
        avatarUrl: existing.avatarUrl || args.imageUrl,
        verified: existing.verified,
        personalPages: existing.personalPages,
        projectPages: existing.projectPages,
      }
    }

    const name = user.name ?? 'Anonymous'
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    let slug = baseSlug
    let suffix = 2
    while (
      await ctx.db
        .query('creators')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .first()
    ) {
      slug = `${baseSlug}-${suffix}`
      suffix++
    }

    const avatarUrl = args.imageUrl ?? undefined

    const id = await ctx.db.insert('creators', {
      name,
      slug,
      userId,
      avatarUrl,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    })

    return {
      _id: id,
      name,
      slug,
      xHandle: undefined,
      avatarUrl,
      verified: false,
      personalPages: [],
      projectPages: [],
    }
  },
})

export const updateProfile = mutation({
  args: {
    xHandle: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]

    const creator = await ctx.db
      .query('creators')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first()
    if (!creator) throw new Error('Creator not found')

    await ctx.db.patch(creator._id, {
      xHandle: args.xHandle,
    })
    return null
  },
})
