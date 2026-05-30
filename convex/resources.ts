import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { Resource as ResourceValidator, ResourceInput } from './schema'
import {
  canonicalizeRepoUrl,
  normalizeUpstreamPath,
  resolveLinkedResourceDocs,
  resolveLinkedResources,
  unlinkResourceFromOwner,
  upsertResourcesForOwner,
} from './lib/resourceLinks'

const StackTarget = v.object({
  kind: v.literal('stack'),
  id: v.id('stacks'),
})

const ProjectTarget = v.object({
  kind: v.literal('project'),
  id: v.id('projects'),
})

const TargetValidator = v.union(StackTarget, ProjectTarget)

export const updateResourceContent = mutation({
  args: {
    target: TargetValidator,
    stableKey: v.string(),
    fileName: v.string(),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]
    if (!userId) throw new Error('Not authenticated')

    const owner = await ctx.db.get(args.target.id)
    if (!owner) {
      throw new Error(args.target.kind === 'stack' ? 'Stack not found' : 'Project not found')
    }

    const creator = await ctx.db.get(owner.creatorId)
    if (!creator || !creator.userId || creator.userId !== userId) {
      throw new Error('Not authorized')
    }

    // Resolve the single resources row linked to this owner under the given
    // stableKey, then patch the matched file's content on that row.
    const docs = await resolveLinkedResourceDocs(
      ctx,
      args.target.kind,
      args.target.id,
    )

    let matched = false
    for (const resource of docs) {
      if (resource.stableKey !== args.stableKey) continue

      const updatedFiles = (resource.files ?? []).map((file) => {
        if (file.name !== args.fileName) return file
        matched = true
        return { ...file, content: args.content }
      })

      if (matched) {
        await ctx.db.patch(resource._id, { files: updatedFiles })
        break
      }
    }

    if (!matched) {
      throw new Error('File not found for given stableKey + fileName')
    }

    await ctx.db.patch(args.target.id, { updatedAt: Date.now() })
    return null
  },
})

export const linkResource = mutation({
  args: {
    target: TargetValidator,
    item: ResourceInput,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]
    if (!userId) throw new Error('Not authenticated')

    const owner = await ctx.db.get(args.target.id)
    if (!owner) {
      throw new Error(
        args.target.kind === 'stack' ? 'Stack not found' : 'Project not found',
      )
    }

    const creator = await ctx.db.get(owner.creatorId)
    if (!creator || !creator.userId || creator.userId !== userId) {
      throw new Error('Not authorized')
    }

    if (!args.item.upstream) {
      throw new Error('A linked resource requires an upstream repo URL')
    }

    const canonical = canonicalizeRepoUrl(args.item.upstream.repoUrl)
    if (canonical === null) {
      throw new Error(
        'Only GitHub repository URLs (github.com/owner/repo) can be linked',
      )
    }

    const normPath = normalizeUpstreamPath(args.item.upstream.path)
    const stableKey = `linked:${canonical}:${normPath}`

    await upsertResourcesForOwner(ctx, {
      addedBy: creator._id,
      ownerKind: args.target.kind,
      ownerId: args.target.id,
      items: [
        {
          ...args.item,
          files: undefined,
          upstream: {
            ...args.item.upstream,
            repoUrl: canonical,
            path: normPath || undefined,
          },
          stableKey,
          scope: 'global',
        },
      ],
      defaultScope: 'global',
    })

    await ctx.db.patch(args.target.id, { updatedAt: Date.now() })
    return null
  },
})

export const unlinkResource = mutation({
  args: {
    target: TargetValidator,
    stableKey: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]
    if (!userId) throw new Error('Not authenticated')

    const owner = await ctx.db.get(args.target.id)
    if (!owner) {
      throw new Error(args.target.kind === 'stack' ? 'Stack not found' : 'Project not found')
    }

    const creator = await ctx.db.get(owner.creatorId)
    if (!creator || !creator.userId || creator.userId !== userId) {
      throw new Error('Not authorized')
    }

    const removed = await unlinkResourceFromOwner(
      ctx,
      args.target.kind,
      args.target.id,
      args.stableKey,
    )
    if (removed) {
      await ctx.db.patch(args.target.id, { updatedAt: Date.now() })
    }
    return null
  },
})

export const getResourceBrowserContext = query({
  args: {
    target: TargetValidator,
  },
  returns: v.object({
    stackResources: v.array(ResourceValidator),
    projectResources: v.array(ResourceValidator),
    stackName: v.string(),
    projectName: v.optional(v.string()),
    isOwner: v.boolean(),
    isEditable: v.boolean(),
    stackId: v.optional(v.id('stacks')),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    const userId = user ? user.tokenIdentifier.split('|')[1] : null

    if (args.target.kind === 'stack') {
      const stack = await ctx.db.get(args.target.id)
      if (!stack) {
        return {
          stackResources: [],
          projectResources: [],
          stackName: '',
          projectName: undefined,
          isOwner: false,
          isEditable: false,
          stackId: undefined,
        }
      }

      const creator = await ctx.db.get(stack.creatorId)
      const isOwner = !!(
        userId && creator && creator.userId === userId
      )

      if (!stack.published && !isOwner) {
        return {
          stackResources: [],
          projectResources: [],
          stackName: stack.name,
          projectName: undefined,
          isOwner,
          isEditable: isOwner,
          stackId: stack._id,
        }
      }

      const stackResources = await resolveLinkedResources(ctx, 'stack', stack._id)
      return {
        stackResources,
        projectResources: [],
        stackName: stack.name,
        projectName: undefined,
        isOwner,
        isEditable: isOwner,
        stackId: stack._id,
      }
    }

    const project = await ctx.db.get(args.target.id)
    if (!project) {
      return {
        stackResources: [],
        projectResources: [],
        stackName: '',
        projectName: undefined,
        isOwner: false,
        isEditable: false,
        stackId: undefined,
      }
    }

    const creator = await ctx.db.get(project.creatorId)
    const isOwner = !!(userId && creator && creator.userId === userId)

    const stack = await ctx.db.get(project.stackId)

    const projectPublished = project.published === true
    if (!projectPublished && !isOwner) {
      return {
        stackResources: [],
        projectResources: [],
        stackName: stack?.name ?? '',
        projectName: project.name,
        isOwner,
        isEditable: isOwner,
        stackId: project.stackId,
      }
    }

    const stackCreator = stack ? await ctx.db.get(stack.creatorId) : null
    const isStackOwner = !!(userId && stackCreator && stackCreator.userId === userId)
    const stackResources =
      stack && (stack.published === true || isStackOwner)
        ? await resolveLinkedResources(ctx, 'stack', stack._id)
        : []
    const projectResources = await resolveLinkedResources(ctx, 'project', project._id)

    return {
      stackResources,
      projectResources,
      stackName: stack?.name ?? '',
      projectName: project.name,
      isOwner,
      isEditable: isOwner,
      stackId: project.stackId,
    }
  },
})
