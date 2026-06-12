import { mutation, query } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { v } from 'convex/values'
import { generateUniqueShortId } from './lib/ids'
import { slugifyAscii } from '../src/lib/slug'

/**
 * Normalize and validate a project URL submitted by the owner.
 * - Scheme-less strings (e.g. "example.com") are prefixed with "https://".
 * - javascript:, data:, and any other non-http(s) scheme throws.
 * Returns the normalized URL string, or undefined when input is absent/empty.
 */
export function normalizeProjectUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  const trimmed = url.trim()
  if (!trimmed) return undefined
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let parsed: URL
  try {
    parsed = new URL(normalized)
  } catch {
    throw new Error('Invalid URL')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http and https URLs are allowed')
  }
  return parsed.href
}

export const listByStack = query({
  args: { stackId: v.id('stacks') },
  returns: v.array(
    v.object({
      _id: v.id('projects'),
      name: v.string(),
      slug: v.string(),
      shortId: v.string(),
      description: v.optional(v.string()),
      url: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      order: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query('projects')
      .withIndex('by_stackId', (q) => q.eq('stackId', args.stackId))
      .collect()

    const mapped = projects.map((project) => ({
      _id: project._id,
      name: project.name,
      slug: `${project.slug}-${project.shortId}`,
      shortId: project.shortId,
      description: project.description,
      url: project.url,
      tags: project.tags,
      order: project.order,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }))

    mapped.sort((a, b) => {
      const orderA = a.order ?? Infinity
      const orderB = b.order ?? Infinity
      if (orderA !== orderB) return orderA - orderB
      return a.createdAt - b.createdAt
    })

    return mapped
  },
})

export const updateProject = mutation({
  args: {
    projectId: v.id('projects'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    url: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]

    const project = await ctx.db.get(args.projectId)
    if (!project) throw new Error('Project not found')

    const creator = await ctx.db.get(project.creatorId)
    if (!creator || creator.userId !== userId) throw new Error('Not authorized')

    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    if (args.name !== undefined) {
      patch.name = args.name
      patch.slug = slugifyAscii(args.name, project.slug)
    }
    if (args.description !== undefined) patch.description = args.description
    if (args.url !== undefined) patch.url = normalizeProjectUrl(args.url)
    if (args.tags !== undefined) patch.tags = args.tags
    if (args.order !== undefined) patch.order = args.order

    await ctx.db.patch(args.projectId, patch)
    return null
  },
})

export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    url: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    stackId: v.optional(v.id('stacks')),
  },
  returns: v.object({ _id: v.id('projects'), slug: v.string() }),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]

    const creator = await ctx.db
      .query('creators')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first()
    if (!creator) throw new Error('Creator profile not found. Create one first.')

    let resolvedStackId: Id<'stacks'>
    if (args.stackId !== undefined) {
      const stack = await ctx.db.get(args.stackId)
      if (!stack) throw new Error('Stack not found')
      if (stack.creatorId !== creator._id) throw new Error('Not authorized')
      resolvedStackId = stack._id
    } else {
      const stack = await ctx.db
        .query('stacks')
        .withIndex('by_creatorId', (q) => q.eq('creatorId', creator._id))
        .first()
      if (!stack) throw new Error('You need a stack before adding projects.')
      resolvedStackId = stack._id
    }

    const slug = slugifyAscii(args.name, 'project')
    const shortId = await generateUniqueShortId(ctx, 'projects')
    const now = Date.now()

    const projectId = await ctx.db.insert('projects', {
      name: args.name,
      slug,
      shortId,
      creatorId: creator._id,
      stackId: resolvedStackId,
      description: args.description,
      url: normalizeProjectUrl(args.url),
      tags: args.tags,
      createdAt: now,
      updatedAt: now,
    })

    return { _id: projectId, slug: `${slug}-${shortId}` }
  },
})

export const reorderProjects = mutation({
  args: {
    stackId: v.id('stacks'),
    projectIds: v.array(v.id('projects')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]

    const stack = await ctx.db.get(args.stackId)
    if (!stack) throw new Error('Stack not found')

    const creator = await ctx.db.get(stack.creatorId)
    if (!creator || creator.userId !== userId) throw new Error('Not authorized')

    for (let i = 0; i < args.projectIds.length; i++) {
      const project = await ctx.db.get(args.projectIds[i])
      if (!project || project.stackId !== args.stackId) {
        throw new Error('Not authorized')
      }
      await ctx.db.patch(args.projectIds[i], { order: i })
    }
    return null
  },
})

export const deleteProject = mutation({
  args: { projectId: v.id('projects') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]

    const project = await ctx.db.get(args.projectId)
    if (!project) throw new Error('Project not found')

    const creator = await ctx.db.get(project.creatorId)
    if (!creator || creator.userId !== userId) throw new Error('Not authorized')

    await ctx.db.delete(args.projectId)
    return null
  },
})
