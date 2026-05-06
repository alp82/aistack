import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { Resource as ResourceValidator } from './schema'

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

    if (args.target.kind === 'stack') {
      const stack = await ctx.db.get(args.target.id)
      if (!stack) throw new Error('Stack not found')

      const creator = await ctx.db.get(stack.creatorId)
      if (!creator || creator.userId !== userId) {
        throw new Error('Not authorized')
      }

      const existing = stack.resources ?? []
      let matched = false
      const updatedResources = existing.map((item) => {
        if (item.stableKey !== args.stableKey) return item
        const updatedFiles = item.files.map((file) => {
          if (file.name !== args.fileName) return file
          matched = true
          return { ...file, content: args.content }
        })
        return { ...item, files: updatedFiles }
      })

      if (!matched) {
        throw new Error('File not found for given stableKey + fileName')
      }

      await ctx.db.patch(args.target.id, {
        resources: updatedResources,
        updatedAt: Date.now(),
      })
      return null
    }

    const project = await ctx.db.get(args.target.id)
    if (!project) throw new Error('Project not found')

    const creator = await ctx.db.get(project.creatorId)
    if (!creator || creator.userId !== userId) {
      throw new Error('Not authorized')
    }

    let matched = false
    const updatedResources = (project.resources ?? []).map((item) => {
      if (item.stableKey !== args.stableKey) return item
      const updatedFiles = item.files.map((file) => {
        if (file.name !== args.fileName) return file
        matched = true
        return { ...file, content: args.content }
      })
      return { ...item, files: updatedFiles }
    })

    if (!matched) {
      throw new Error('File not found for given stableKey + fileName')
    }

    await ctx.db.patch(args.target.id, {
      resources: updatedResources,
      updatedAt: Date.now(),
    })
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

      return {
        stackResources: stack.resources ?? [],
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
      stack?.published === true || isStackOwner ? (stack?.resources ?? []) : []

    return {
      stackResources,
      projectResources: project.resources ?? [],
      stackName: stack?.name ?? '',
      projectName: project.name,
      isOwner,
      isEditable: isOwner,
      stackId: project.stackId,
    }
  },
})
