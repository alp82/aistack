import { internalMutation, internalQuery } from './_generated/server'
import { v } from 'convex/values'
import { slugifyAscii } from '../src/lib/slug'
import { generateUniqueShortId } from './lib/ids'
import { InstructionItem as InstructionItemValidator } from './schema'

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
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const stack = await ctx.db
      .query('stacks')
      .withIndex('by_shortId', (q) => q.eq('shortId', args.shortId))
      .first()
    if (!stack) return null
    return { _id: stack._id, slug: stack.slug, shortId: stack.shortId }
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
    instructions: v.array(InstructionItemValidator),
    source: v.optional(v.string()),
  },
  returns: v.object({
    slug: v.string(),
    shortId: v.string(),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', args.creatorId))
      .collect()
    const match = existing.find((p) => p.name === args.name)

    if (match) {
      await ctx.db.patch(match._id, {
        instructions: args.instructions,
        updatedAt: Date.now(),
      })
      return { slug: `${match.slug}-${match.shortId}`, shortId: match.shortId }
    }

    const slug = slugifyAscii(args.name, 'project')
    const shortId = await generateUniqueShortId(ctx, 'projects')
    const now = Date.now()

    await ctx.db.insert('projects', {
      name: args.name,
      slug,
      shortId,
      creatorId: args.creatorId,
      stackId: args.stackId,
      source: args.source,
      published: false,
      instructions: args.instructions,
      createdAt: now,
      updatedAt: now,
    })

    return { slug: `${slug}-${shortId}`, shortId }
  },
})
