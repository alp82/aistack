import { mutation, query } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { v } from 'convex/values'
import { extractShortId, generateUniqueShortId } from './lib/ids'
import { slugifyAscii } from '../src/lib/slug'
import { Resource as ResourceValidator } from './schema'
import { cascadeUnlinkOwner, resolveLinkedResources } from './lib/resourceLinks'

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id('projects'),
      name: v.string(),
      slug: v.string(),
      shortId: v.string(),
      source: v.optional(v.string()),
      description: v.optional(v.string()),
      url: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      order: v.optional(v.number()),
      cloneCount: v.optional(v.number()),
      published: v.optional(v.boolean()),
      resources: v.array(ResourceValidator),
      createdAt: v.number(),
      updatedAt: v.number(),
      creator: v.object({
        _id: v.id('creators'),
        name: v.string(),
        avatarUrl: v.optional(v.string()),
        slug: v.string(),
      }),
      stack: v.object({
        _id: v.id('stacks'),
        name: v.string(),
        slug: v.string(),
        shortId: v.string(),
      }),
      isOwner: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const shortId = extractShortId(args.slug)
    const project = await ctx.db
      .query('projects')
      .withIndex('by_shortId', (q) => q.eq('shortId', shortId))
      .first()
    if (!project) return null

    const creator = await ctx.db.get(project.creatorId)
    if (!creator) return null

    const stack = await ctx.db.get(project.stackId)
    if (!stack) return null

    let isOwner = false
    const user = await ctx.auth.getUserIdentity()
    if (user) {
      const userId = user.tokenIdentifier.split('|')[1]
      isOwner = creator.userId === userId
    }

    const resources = await resolveLinkedResources(ctx, 'project', project._id)

    return {
      _id: project._id,
      name: project.name,
      slug: `${project.slug}-${project.shortId}`,
      shortId: project.shortId,
      source: project.source,
      description: project.description,
      url: project.url,
      tags: project.tags,
      order: project.order,
      cloneCount: project.cloneCount,
      published: project.published,
      resources,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      creator: {
        _id: creator._id,
        name: creator.name,
        avatarUrl: creator.avatarUrl,
        slug: creator.slug,
      },
      stack: {
        _id: stack._id,
        name: stack.name,
        slug: `${stack.slug}-${stack.shortId}`,
        shortId: stack.shortId,
      },
      isOwner,
    }
  },
})

export const listByStack = query({
  args: { stackId: v.id('stacks'), includeUnpublished: v.optional(v.boolean()) },
  returns: v.array(
    v.object({
      _id: v.id('projects'),
      name: v.string(),
      slug: v.string(),
      shortId: v.string(),
      source: v.optional(v.string()),
      description: v.optional(v.string()),
      url: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      order: v.optional(v.number()),
      cloneCount: v.optional(v.number()),
      published: v.optional(v.boolean()),
      fileCount: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    let projects = await ctx.db
      .query('projects')
      .withIndex('by_stackId', (q) => q.eq('stackId', args.stackId))
      .collect()

    if (!args.includeUnpublished) {
      projects = projects.filter((p) => p.published === true)
    }

    const mapped = await Promise.all(
      projects.map(async (project) => {
        const resources = await resolveLinkedResources(ctx, 'project', project._id)
        let fileCount = 0
        for (const item of resources) {
          fileCount += item.files?.length ?? 0
        }
        return {
          _id: project._id,
          name: project.name,
          slug: `${project.slug}-${project.shortId}`,
          shortId: project.shortId,
          source: project.source,
          description: project.description,
          url: project.url,
          tags: project.tags,
          order: project.order,
          cloneCount: project.cloneCount,
          published: project.published,
          fileCount,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        }
      }),
    )

    mapped.sort((a, b) => {
      const orderA = a.order ?? Infinity
      const orderB = b.order ?? Infinity
      if (orderA !== orderB) return orderA - orderB
      return a.createdAt - b.createdAt
    })

    return mapped
  },
})

export const listProjectResourcesByStack = query({
  args: { stackId: v.id('stacks'), includeUnpublished: v.optional(v.boolean()) },
  returns: v.array(
    v.object({
      projectId: v.id('projects'),
      projectName: v.string(),
      projectSlug: v.string(),
      isOwnProject: v.boolean(),
      resources: v.array(ResourceValidator),
    })
  ),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    const userId = user ? user.tokenIdentifier.split('|')[1] : null

    let projects = await ctx.db
      .query('projects')
      .withIndex('by_stackId', (q) => q.eq('stackId', args.stackId))
      .collect()

    const ownedCreatorIds = new Set<string>()
    if (userId) {
      for (const project of projects) {
        if (ownedCreatorIds.has(project.creatorId)) continue
        const creator = await ctx.db.get(project.creatorId)
        if (creator && creator.userId === userId) {
          ownedCreatorIds.add(project.creatorId)
        }
      }
    }

    if (!args.includeUnpublished) {
      projects = projects.filter(
        (p) => p.published === true || ownedCreatorIds.has(p.creatorId)
      )
    }

    const mapped = await Promise.all(
      projects.map(async (project) => ({
        projectId: project._id,
        projectName: project.name,
        projectSlug: `${project.slug}-${project.shortId}`,
        isOwnProject: ownedCreatorIds.has(project.creatorId),
        resources: await resolveLinkedResources(ctx, 'project', project._id),
        order: project.order,
        createdAt: project.createdAt,
      })),
    )

    mapped.sort((a, b) => {
      const orderA = a.order ?? Infinity
      const orderB = b.order ?? Infinity
      if (orderA !== orderB) return orderA - orderB
      return a.createdAt - b.createdAt
    })

    return mapped.map(
      ({ projectId, projectName, projectSlug, isOwnProject, resources }) => ({
        projectId,
        projectName,
        projectSlug,
        isOwnProject,
        resources,
      })
    )
  },
})

export const listByCreator = query({
  args: {},
  returns: v.array(
    v.object({
      projectId: v.id('projects'),
      projectName: v.string(),
      projectSlug: v.string(),
      stackId: v.id('stacks'),
      stackName: v.string(),
      stackSlug: v.string(),
      resources: v.array(ResourceValidator),
    })
  ),
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) return []
    const userId = user.tokenIdentifier.split('|')[1]

    const creators = await ctx.db
      .query('creators')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .collect()
    if (creators.length === 0) return []

    const projects: Doc<'projects'>[] = []
    for (const creator of creators) {
      const part = await ctx.db
        .query('projects')
        .withIndex('by_creatorId', (q) => q.eq('creatorId', creator._id))
        .take(200)
      projects.push(...part)
    }

    projects.sort((a, b) => b.updatedAt - a.updatedAt)
    const limited = projects.slice(0, 200)

    const stackCache = new Map<string, { name: string; slug: string; shortId: string }>()
    const results: {
      projectId: Doc<'projects'>['_id']
      projectName: string
      projectSlug: string
      stackId: Doc<'projects'>['stackId']
      stackName: string
      stackSlug: string
      resources: Awaited<ReturnType<typeof resolveLinkedResources>>
    }[] = []
    for (const project of limited) {
      let stackInfo = stackCache.get(project.stackId)
      if (!stackInfo) {
        const stack = await ctx.db.get(project.stackId)
        if (!stack) continue
        stackInfo = { name: stack.name, slug: stack.slug, shortId: stack.shortId }
        stackCache.set(project.stackId, stackInfo)
      }
      const resources = await resolveLinkedResources(ctx, 'project', project._id)
      results.push({
        projectId: project._id,
        projectName: project.name,
        projectSlug: `${project.slug}-${project.shortId}`,
        stackId: project.stackId,
        stackName: stackInfo.name,
        stackSlug: `${stackInfo.slug}-${stackInfo.shortId}`,
        resources,
      })
    }
    return results
  },
})

export const getByShortId = query({
  args: { shortId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id('projects'),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      shortId: v.string(),
      creatorId: v.id('creators'),
      stackId: v.id('stacks'),
      source: v.optional(v.string()),
      resources: v.array(ResourceValidator),
      stackResources: v.array(ResourceValidator),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query('projects')
      .withIndex('by_shortId', (q) => q.eq('shortId', args.shortId))
      .first()
    if (!project) return null
    const resources = await resolveLinkedResources(ctx, 'project', project._id)
    // Stack resources too, so the CLI can diff stack-scoped (global) links —
    // e.g. installed plugins attach to the stack, not the project.
    const stackResources = await resolveLinkedResources(
      ctx,
      'stack',
      project.stackId
    )
    return {
      _id: project._id,
      _creationTime: project._creationTime,
      name: project.name,
      slug: project.slug,
      shortId: project.shortId,
      creatorId: project.creatorId,
      stackId: project.stackId,
      source: project.source,
      resources,
      stackResources,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }
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
    published: v.optional(v.boolean()),
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
    if (args.url !== undefined) patch.url = args.url
    if (args.tags !== undefined) patch.tags = args.tags
    if (args.order !== undefined) patch.order = args.order
    if (args.published !== undefined) patch.published = args.published

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
      source: 'web',
      description: args.description,
      url: args.url,
      tags: args.tags,
      published: false,
      createdAt: now,
      updatedAt: now,
    })

    return { _id: projectId, slug: `${slug}-${shortId}` }
  },
})

export const publishProject = mutation({
  args: {
    projectId: v.id('projects'),
    published: v.boolean(),
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

    await ctx.db.patch(args.projectId, {
      published: args.published,
      updatedAt: Date.now(),
    })
    return null
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

    if (project.published === true)
      throw new Error('Cannot delete a published project. Unpublish it first.')

    await cascadeUnlinkOwner(ctx, 'project', args.projectId)
    await ctx.db.delete(args.projectId)
    return null
  },
})
