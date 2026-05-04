import { internalMutation, internalQuery } from './_generated/server'
import { Infer, v } from 'convex/values'
import { slugifyAscii } from '../src/lib/slug'
import { generateUniqueShortId } from './lib/ids'

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

const IncomingInstructionItem = v.object({
  type: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  group: v.string(),
  scope: v.optional(v.union(v.literal('global'), v.literal('project'))),
  stableKey: v.string(),
  files: v.array(
    v.object({
      name: v.string(),
      content: v.string(),
      path: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    }),
  ),
  source: v.optional(v.union(v.literal('authored'), v.literal('cli'), v.literal('github'))),
  upstream: v.optional(v.object({
    repoUrl: v.string(),
    path: v.optional(v.string()),
    license: v.optional(v.string()),
    stars: v.optional(v.number()),
    lastCommitSha: v.optional(v.string()),
    mirrorMode: v.union(v.literal('link'), v.literal('preview'), v.literal('mirror')),
    lastSyncAt: v.optional(v.number()),
  })),
})

type Item = Infer<typeof IncomingInstructionItem>

function mergeByStableKey(existing: Item[], incoming: Item[]): Item[] {
  const incomingKeys = new Set<string>()
  for (const item of incoming) {
    incomingKeys.add(item.stableKey)
  }
  const preserved = existing.filter((item) => !incomingKeys.has(item.stableKey))
  return [...preserved, ...incoming]
}

export const upsertProject = internalMutation({
  args: {
    creatorId: v.id('creators'),
    stackId: v.id('stacks'),
    name: v.string(),
    instructions: v.array(IncomingInstructionItem),
    source: v.optional(v.string()),
  },
  returns: v.object({
    slug: v.string(),
    shortId: v.string(),
  }),
  handler: async (ctx, args) => {
    const projectItems: Item[] = []
    const globalItems: Item[] = []
    for (const item of args.instructions) {
      // Server forces source='cli' for HTTP CLI endpoint;
      // web/GitHub-link paths use a different code path.
      const stored: Item = { ...item, source: 'cli' as const }
      if (item.scope === 'global') globalItems.push(stored)
      else projectItems.push(stored)
    }

    const existing = await ctx.db
      .query('projects')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', args.creatorId))
      .collect()
    const match = existing.find((p) => p.name === args.name)

    const now = Date.now()

    let projectSlug: string
    let projectShortId: string
    let resolvedStackId = args.stackId

    if (match) {
      const mergedProjectInstructions = mergeByStableKey(
        match.instructions,
        projectItems,
      )
      await ctx.db.patch(match._id, {
        instructions: mergedProjectInstructions,
        updatedAt: now,
      })
      projectSlug = match.slug
      projectShortId = match.shortId
      resolvedStackId = match.stackId
    } else {
      projectSlug = slugifyAscii(args.name, 'project')
      projectShortId = await generateUniqueShortId(ctx, 'projects')

      await ctx.db.insert('projects', {
        name: args.name,
        slug: projectSlug,
        shortId: projectShortId,
        creatorId: args.creatorId,
        stackId: args.stackId,
        source: args.source,
        published: false,
        instructions: projectItems,
        createdAt: now,
        updatedAt: now,
      })
    }

    if (globalItems.length > 0) {
      const stack = await ctx.db.get(resolvedStackId)
      if (stack) {
        if (stack.creatorId !== args.creatorId) {
          throw new Error('Not authorized to write to this stack')
        }
        const existingStackInstructions = stack.instructions ?? []
        const mergedStackInstructions = mergeByStableKey(
          existingStackInstructions,
          globalItems,
        )
        await ctx.db.patch(stack._id, {
          instructions: mergedStackInstructions,
          updatedAt: now,
        })
      }
    }

    return {
      slug: `${projectSlug}-${projectShortId}`,
      shortId: projectShortId,
    }
  },
})
