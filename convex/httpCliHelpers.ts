import { internalMutation, internalQuery } from './_generated/server'
import { v } from 'convex/values'
import { Resource as ResourceValidator, ResourceInput } from './schema'
import {
  resolveLinkedResources,
  upsertResourcesForOwner,
} from './lib/resourceLinks'

export const getCreatorByUserId = internalQuery({
  args: { userId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id('creators'),
      name: v.string(),
      slug: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const creator = await ctx.db
      .query('creators')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .first()
    if (!creator) return null
    return { _id: creator._id, name: creator.name, slug: creator.slug }
  },
})


// `getFirstStackByCreator` was retired here by #38: it silently picked whichever
// stack the by_creatorId index returned first, which was tolerable only while
// one-stack-per-creator was assumed. The CLI now uses the stack bound to the
// bearer token at link time (#33 decision 7).

export const getStackWithResourcesByCreator = internalQuery({
  args: { creatorId: v.id('creators') },
  returns: v.union(
    v.object({
      name: v.string(),
      slug: v.string(),
      shortId: v.string(),
      resources: v.array(ResourceValidator),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const stack = await ctx.db
      .query('stacks')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', args.creatorId))
      .first()
    if (!stack) return null
    const resources = await resolveLinkedResources(ctx, 'stack', stack._id)
    return {
      name: stack.name,
      slug: `${stack.slug}-${stack.shortId}`,
      shortId: stack.shortId,
      resources,
    }
  },
})

export const upsertStackResources = internalMutation({
  args: {
    creatorId: v.id('creators'),
    stackId: v.id('stacks'),
    resources: v.array(ResourceInput),
  },
  returns: v.object({
    slug: v.string(),
    shortId: v.string(),
  }),
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId)
    if (!stack) throw new Error('Stack not found')
    if (stack.creatorId !== args.creatorId) {
      throw new Error('Not authorized to write to this stack')
    }

    // Every resource collected through the CLI is stack-owned. Old published
    // CLIs may still send a scope field on items; ResourceInput tolerates it and
    // upsertResourcesForOwner ignores it, so the payload passes through as-is.
    await upsertResourcesForOwner(ctx, {
      addedBy: args.creatorId,
      ownerKind: 'stack',
      ownerId: args.stackId,
      items: args.resources,
    })

    await ctx.db.patch(args.stackId, { updatedAt: Date.now() })

    return {
      slug: `${stack.slug}-${stack.shortId}`,
      shortId: stack.shortId,
    }
  },
})
