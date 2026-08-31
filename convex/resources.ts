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

const TargetValidator = StackTarget

// Looser target used only by getResourceBrowserContext so that stale
// pre-pivot TipTap nodes that stored a projects-table id (data-source-id)
// degrade to an empty result instead of throwing at the v.id('stacks')
// arg validator.
const BrowserTarget = v.object({
  kind: v.literal('stack'),
  id: v.string(),
})

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
      throw new Error('Stack not found')
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
      throw new Error('Stack not found')
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
        },
      ],
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
      throw new Error('Stack not found')
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
    target: BrowserTarget,
  },
  returns: v.object({
    stackResources: v.array(ResourceValidator),
    stackName: v.string(),
    isOwner: v.boolean(),
    isEditable: v.boolean(),
    stackId: v.optional(v.id('stacks')),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    const userId = user ? user.tokenIdentifier.split('|')[1] : null

    // normalizeId returns null for ids that belong to a different table (e.g.
    // stale pre-pivot TipTap nodes that stored a projects-table id). Degrade
    // gracefully to the not-found empty shape instead of throwing.
    const stackId = ctx.db.normalizeId('stacks', args.target.id)
    const stack = stackId ? await ctx.db.get(stackId) : null
    if (!stack) {
      return {
        stackResources: [],
        stackName: '',
        isOwner: false,
        isEditable: false,
        stackId: undefined,
      }
    }

    const creator = await ctx.db.get(stack.creatorId)
    const isOwner = !!(userId && creator && creator.userId === userId)

    const stackResources = await resolveLinkedResources(ctx, 'stack', stack._id)
    return {
      stackResources,
      stackName: stack.name,
      isOwner,
      isEditable: isOwner,
      stackId: stack._id,
    }
  },
})
