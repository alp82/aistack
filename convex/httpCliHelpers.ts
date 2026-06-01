import { internalMutation, internalQuery } from './_generated/server'
import { v } from 'convex/values'
import { Resource as ResourceValidator, ResourceInput } from './schema'
import {
  resolveLinkedResources,
  upsertResourcesForOwner,
  type ResourceInputItem,
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


export const getFirstStackByCreator = internalQuery({
  args: { creatorId: v.id('creators') },
  returns: v.union(
    v.object({
      _id: v.id('stacks'),
      slug: v.string(),
      shortId: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const stack = await ctx.db
      .query('stacks')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', args.creatorId))
      .first()
    if (!stack) return null
    return { _id: stack._id, slug: stack.slug, shortId: stack.shortId }
  },
})

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

    // Every resource collected through the CLI is stack-owned and global.
    // Coerce scope BEFORE the upsert so explicit scope:'project' items still
    // land as global (upsertResourcesForOwner preserves an incoming scope).
    const items: ResourceInputItem[] = args.resources.map((item) => ({
      ...item,
      scope: 'global',
    }))

    await upsertResourcesForOwner(ctx, {
      addedBy: args.creatorId,
      ownerKind: 'stack',
      ownerId: args.stackId,
      items,
    })

    await ctx.db.patch(args.stackId, { updatedAt: Date.now() })

    return {
      slug: `${stack.slug}-${stack.shortId}`,
      shortId: stack.shortId,
    }
  },
})
