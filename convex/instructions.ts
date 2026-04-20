import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { InstructionItem as InstructionItemValidator } from './schema'

const StackTarget = v.object({
  kind: v.literal('stack'),
  id: v.id('stacks'),
})

const ProjectTarget = v.object({
  kind: v.literal('project'),
  id: v.id('projects'),
})

const TargetValidator = v.union(StackTarget, ProjectTarget)

export const updateInstructionContent = mutation({
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

      const existing = stack.instructions ?? []
      let matched = false
      const updatedInstructions = existing.map((item) => {
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
        instructions: updatedInstructions,
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
    const updatedInstructions = (project.instructions ?? []).map((item) => {
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
      instructions: updatedInstructions,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const getInstructionBrowserContext = query({
  args: {
    target: TargetValidator,
  },
  returns: v.object({
    stackInstructions: v.array(InstructionItemValidator),
    projectInstructions: v.array(InstructionItemValidator),
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
          stackInstructions: [],
          projectInstructions: [],
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
          stackInstructions: [],
          projectInstructions: [],
          stackName: stack.name,
          projectName: undefined,
          isOwner,
          isEditable: isOwner,
          stackId: stack._id,
        }
      }

      return {
        stackInstructions: stack.instructions ?? [],
        projectInstructions: [],
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
        stackInstructions: [],
        projectInstructions: [],
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
        stackInstructions: [],
        projectInstructions: [],
        stackName: stack?.name ?? '',
        projectName: project.name,
        isOwner,
        isEditable: isOwner,
        stackId: project.stackId,
      }
    }

    const stackCreator = stack ? await ctx.db.get(stack.creatorId) : null
    const isStackOwner = !!(userId && stackCreator && stackCreator.userId === userId)
    const stackInstructions =
      stack?.published === true || isStackOwner ? (stack?.instructions ?? []) : []

    return {
      stackInstructions,
      projectInstructions: project.instructions,
      stackName: stack?.name ?? '',
      projectName: project.name,
      isOwner,
      isEditable: isOwner,
      stackId: project.stackId,
    }
  },
})
