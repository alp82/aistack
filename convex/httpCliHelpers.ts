import { internalMutation, internalQuery } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { v } from 'convex/values'
import { slugifyAscii } from '../src/lib/slug'
import { generateUniqueShortId } from './lib/ids'
import { ResourceInput } from './schema'
import {
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

export const getProjectByCreatorAndName = internalQuery({
  args: { creatorId: v.id('creators'), name: v.string() },
  returns: v.union(
    v.object({
      _id: v.id('projects'),
      slug: v.string(),
      shortId: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', args.creatorId))
      .collect()
    const match = projects.find((p) => p.name === args.name)
    if (!match) return null
    return { _id: match._id, slug: match.slug, shortId: match.shortId }
  },
})

export const getStackByShortId = internalQuery({
  args: { shortId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id('stacks'),
      slug: v.string(),
      shortId: v.string(),
      creatorId: v.id('creators'),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const stack = await ctx.db
      .query('stacks')
      .withIndex('by_shortId', (q) => q.eq('shortId', args.shortId))
      .first()
    if (!stack) return null
    return { _id: stack._id, slug: stack.slug, shortId: stack.shortId, creatorId: stack.creatorId }
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

export const incrementCloneCount = internalMutation({
  args: { projectId: v.id('projects') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId)
    if (!project) return null
    await ctx.db.patch(args.projectId, {
      cloneCount: (project.cloneCount ?? 0) + 1,
    })
    return null
  },
})

export const upsertProject = internalMutation({
  args: {
    creatorId: v.id('creators'),
    stackId: v.id('stacks'),
    name: v.string(),
    resources: v.array(ResourceInput),
    source: v.optional(v.string()),
  },
  returns: v.object({
    slug: v.string(),
    shortId: v.string(),
  }),
  handler: async (ctx, args) => {
    const projectItems: ResourceInputItem[] = []
    const globalItems: ResourceInputItem[] = []
    for (const item of args.resources) {
      if (item.scope === 'global') globalItems.push(item)
      else projectItems.push(item)
    }

    const existing = await ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', args.creatorId))
      .collect()
    const match = existing.find((p) => p.name === args.name)

    const now = Date.now()

    let projectId: Id<'projects'>
    let projectSlug: string
    let projectShortId: string
    let resolvedStackId = args.stackId

    if (match) {
      await ctx.db.patch(match._id, { updatedAt: now })
      projectId = match._id
      projectSlug = match.slug
      projectShortId = match.shortId
      resolvedStackId = match.stackId
    } else {
      projectSlug = slugifyAscii(args.name, 'project')
      projectShortId = await generateUniqueShortId(ctx, 'projects')

      projectId = await ctx.db.insert('projects', {
        name: args.name,
        slug: projectSlug,
        shortId: projectShortId,
        creatorId: args.creatorId,
        stackId: args.stackId,
        source: args.source,
        published: false,
        createdAt: now,
        updatedAt: now,
      })
    }

    await upsertResourcesForOwner(ctx, {
      addedBy: args.creatorId,
      ownerKind: 'project',
      ownerId: projectId,
      items: projectItems,
      defaultScope: 'project',
    })

    if (globalItems.length > 0) {
      const stack = await ctx.db.get(resolvedStackId)
      if (stack) {
        if (stack.creatorId !== args.creatorId) {
          throw new Error('Not authorized to write to this stack')
        }
        await upsertResourcesForOwner(ctx, {
          addedBy: args.creatorId,
          ownerKind: 'stack',
          ownerId: stack._id,
          items: globalItems,
          defaultScope: 'global',
        })
        await ctx.db.patch(stack._id, { updatedAt: now })
      }
    }

    return {
      slug: `${projectSlug}-${projectShortId}`,
      shortId: projectShortId,
    }
  },
})
