import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
// @ts-ignore - components will be generated after convex dev restarts
import { components } from './_generated/api'
import { isAdmin } from './lib/admin'

async function getUserInfo(ctx: any, subjectOrTokenId: string | undefined) {
  if (!subjectOrTokenId) return null
  try {
    const userId = subjectOrTokenId.includes('|')
      ? subjectOrTokenId.split('|')[1]
      : subjectOrTokenId

    const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: 'user',
      where: [{ field: '_id', value: userId }],
    })
    if (user) {
      return {
        name: user.name,
        email: user.email,
        image: user.image,
      }
    }
  } catch {
    // Fallback if user lookup fails
  }
  return null
}

export const getPendingReviewCount = query({
  args: {},
  returns: v.union(v.number(), v.null()),
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) {
      return null
    }

    const tools = await ctx.db
      .query('tools')
      .withIndex('by_reviewStatus', (q) => q.eq('reviewStatus', 'pending'))
      .collect()

    const bundles = await ctx.db
      .query('bundles')
      .withIndex('by_reviewStatus', (q) => q.eq('reviewStatus', 'pending'))
      .collect()

    const models = await ctx.db
      .query('models')
      .withIndex('by_reviewStatus', (q) => q.eq('reviewStatus', 'pending'))
      .collect()

    const editSuggestions = await ctx.db
      .query('toolEditSuggestions')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .collect()

    // Count stacks with flags that haven't been marked low quality yet
    const allFlags = await ctx.db.query('stackFlags').collect()
    const flaggedStackIds = new Set(allFlags.map((f) => f.stackId))
    let pendingFlaggedStacks = 0
    for (const stackId of flaggedStackIds) {
      const stack = await ctx.db.get(stackId)
      if (stack && !stack.isLowQuality) pendingFlaggedStacks++
    }

    return tools.length + bundles.length + models.length + editSuggestions.length + pendingFlaggedStacks
  },
})

export const getReviewTabCount = query({
  args: {},
  returns: v.union(v.number(), v.null()),
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return null

    const tools = await ctx.db
      .query('tools')
      .withIndex('by_reviewStatus', (q) => q.eq('reviewStatus', 'pending'))
      .collect()
    const bundles = await ctx.db
      .query('bundles')
      .withIndex('by_reviewStatus', (q) => q.eq('reviewStatus', 'pending'))
      .collect()
    const models = await ctx.db
      .query('models')
      .withIndex('by_reviewStatus', (q) => q.eq('reviewStatus', 'pending'))
      .collect()
    const editSuggestions = await ctx.db
      .query('toolEditSuggestions')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .collect()

    return tools.length + bundles.length + models.length + editSuggestions.length
  },
})

export const getQualityTabCount = query({
  args: {},
  returns: v.union(v.number(), v.null()),
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return null

    const allFlags = await ctx.db.query('stackFlags').collect()
    const flaggedStackIds = new Set(allFlags.map((f) => f.stackId))
    let count = 0
    for (const stackId of flaggedStackIds) {
      const stack = await ctx.db.get(stackId)
      if (stack && !stack.isLowQuality) count++
    }
    return count
  },
})

export const getPendingTools = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) {
      return null
    }

    const tools = await ctx.db
      .query('tools')
      .withIndex('by_reviewStatus', (q) => q.eq('reviewStatus', 'pending'))
      .collect()

    const toolsWithUserInfo = await Promise.all(
      tools.map(async (tool) => {
        const userInfo = await getUserInfo(ctx, tool.createdBy)
        const resolvedUrl = tool.iconStorageId
          ? await ctx.storage.getUrl(tool.iconStorageId)
          : null
        return {
          _id: tool._id,
          _creationTime: tool._creationTime,
          name: tool.name,
          slug: tool.slug,
          shortId: tool.shortId,
          aliases: tool.aliases,
          categories: tool.categories,
          iconStorageId: tool.iconStorageId,
          iconUrl: resolvedUrl ?? tool.iconUrl,
          websiteUrl: tool.websiteUrl,
          affiliateUrl: tool.affiliateUrl,
          tiers: tool.tiers,
          reviewStatus: tool.reviewStatus,
          createdBy: tool.createdBy,
          createdAt: tool.createdAt,
          updatedAt: tool.updatedAt,
          submitterInfo: userInfo,
        }
      })
    )

    return toolsWithUserInfo
  },
})

export const approveTool = mutation({
  args: {
    toolId: v.id('tools'),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error('Unauthorized')
    }

    await ctx.db.patch(args.toolId, {
      reviewStatus: 'approved',
      updatedAt: Date.now(),
    })
  },
})

export const rejectTool = mutation({
  args: {
    toolId: v.id('tools'),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error('Unauthorized')
    }

    await ctx.db.patch(args.toolId, {
      reviewStatus: 'rejected',
      updatedAt: Date.now(),
    })
  },
})

export const updateTool = mutation({
  args: {
    toolId: v.id('tools'),
    name: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    websiteUrl: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    iconStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error('Unauthorized')
    }

    const { toolId, ...updates } = args
    await ctx.db.patch(toolId, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

export const updateToolFull = mutation({
  args: {
    toolId: v.id('tools'),
    name: v.string(),
    categories: v.array(v.string()),
    websiteUrl: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    iconStorageId: v.optional(v.id('_storage')),
    tiers: v.array(
      v.object({
        name: v.string(),
        pricingType: v.union(v.literal('fixed'), v.literal('usage'), v.literal('mixed')),
        fixedAmount: v.optional(v.number()),
        fixedPeriod: v.optional(v.union(v.literal('month'), v.literal('year'), v.literal('one_time'))),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error('Unauthorized')
    }

    const now = Date.now()
    const tiers = args.tiers.map((t, i) => ({
      tierId: `tier-${i + 1}`,
      name: t.name,
      pricing: {
        pricingType: t.pricingType,
        ...(t.pricingType === 'fixed' || t.pricingType === 'mixed'
          ? {
              fixed: {
                currency: 'USD',
                amount: t.fixedAmount ?? 0,
                period: t.fixedPeriod ?? ('month' as const),
              },
            }
          : {}),
      },
      isDefault: i === 0,
      updatedAt: now,
    }))

    await ctx.db.patch(args.toolId, {
      name: args.name,
      categories: args.categories,
      websiteUrl: args.websiteUrl,
      iconUrl: args.iconUrl,
      iconStorageId: args.iconStorageId,
      tiers,
      updatedAt: now,
    })
  },
})

export const updateModelFull = mutation({
  args: {
    modelId: v.id('models'),
    name: v.string(),
    provider: v.string(),
    category: v.union(
      v.literal('language'),
      v.literal('coding'),
      v.literal('reasoning'),
      v.literal('vision'),
      v.literal('audio'),
      v.literal('image'),
      v.literal('video'),
      v.literal('embedding'),
      v.literal('other')
    ),
    websiteUrl: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    iconStorageId: v.optional(v.id('_storage')),
    contextWindow: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error('Unauthorized')
    }

    const now = Date.now()
    await ctx.db.patch(args.modelId, {
      name: args.name,
      provider: args.provider,
      category: args.category,
      websiteUrl: args.websiteUrl,
      iconUrl: args.iconUrl,
      iconStorageId: args.iconStorageId,
      contextWindow: args.contextWindow,
      description: args.description,
      updatedAt: now,
    })
  },
})

export const checkIsAdmin = query({
  args: {},
  handler: async (ctx) => {
    return await isAdmin(ctx)
  },
})

export const getPendingBundles = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) {
      return null
    }

    const bundles = await ctx.db
      .query('bundles')
      .withIndex('by_reviewStatus', (q) => q.eq('reviewStatus', 'pending'))
      .collect()

    const bundlesWithUserInfo = await Promise.all(
      bundles.map(async (bundle) => {
        const userInfo = await getUserInfo(ctx, bundle.createdBy)
        const resolvedUrl = bundle.iconStorageId
          ? await ctx.storage.getUrl(bundle.iconStorageId)
          : null
        return {
          _id: bundle._id,
          _creationTime: bundle._creationTime,
          name: bundle.name,
          slug: bundle.slug,
          shortId: bundle.shortId,
          aliases: bundle.aliases,
          description: bundle.description,
          iconStorageId: bundle.iconStorageId,
          iconUrl: resolvedUrl ?? bundle.iconUrl,
          websiteUrl: bundle.websiteUrl,
          toolSlugs: bundle.toolSlugs,
          tiers: bundle.tiers,
          reviewStatus: bundle.reviewStatus,
          createdBy: bundle.createdBy,
          createdAt: bundle.createdAt,
          updatedAt: bundle.updatedAt,
          submitterInfo: userInfo,
        }
      })
    )

    return bundlesWithUserInfo
  },
})

export const updateBundleFull = mutation({
  args: {
    bundleId: v.id('bundles'),
    name: v.string(),
    websiteUrl: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    iconStorageId: v.optional(v.id('_storage')),
    tiers: v.array(
      v.object({
        name: v.string(),
        pricingType: v.union(v.literal('fixed'), v.literal('usage'), v.literal('mixed')),
        fixedAmount: v.optional(v.number()),
        fixedPeriod: v.optional(v.union(v.literal('month'), v.literal('year'), v.literal('one_time'))),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error('Unauthorized')
    }

    const now = Date.now()
    const tiers = args.tiers.map((t, i) => ({
      tierId: `tier-${i + 1}`,
      name: t.name,
      pricing: {
        pricingType: t.pricingType,
        ...(t.pricingType === 'fixed' || t.pricingType === 'mixed'
          ? {
              fixed: {
                currency: 'USD',
                amount: t.fixedAmount ?? 0,
                period: t.fixedPeriod ?? ('month' as const),
              },
            }
          : {}),
      },
      isDefault: i === 0,
      updatedAt: now,
    }))

    await ctx.db.patch(args.bundleId, {
      name: args.name,
      websiteUrl: args.websiteUrl,
      iconUrl: args.iconUrl,
      iconStorageId: args.iconStorageId,
      tiers,
      updatedAt: now,
    })
  },
})

export const approveBundle = mutation({
  args: {
    bundleId: v.id('bundles'),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error('Unauthorized')
    }

    await ctx.db.patch(args.bundleId, {
      reviewStatus: 'approved',
      updatedAt: Date.now(),
    })
  },
})

export const rejectBundle = mutation({
  args: {
    bundleId: v.id('bundles'),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error('Unauthorized')
    }

    await ctx.db.patch(args.bundleId, {
      reviewStatus: 'rejected',
      updatedAt: Date.now(),
    })
  },
})

export const getPendingModels = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) {
      return null
    }

    const models = await ctx.db
      .query('models')
      .withIndex('by_reviewStatus', (q) => q.eq('reviewStatus', 'pending'))
      .collect()

    const modelsWithUserInfo = await Promise.all(
      models.map(async (model) => {
        const userInfo = await getUserInfo(ctx, model.createdBy)
        const resolvedUrl = model.iconStorageId
          ? await ctx.storage.getUrl(model.iconStorageId)
          : null
        return {
          _id: model._id,
          _creationTime: model._creationTime,
          name: model.name,
          slug: model.slug,
          shortId: model.shortId,
          aliases: model.aliases,
          provider: model.provider,
          category: model.category,
          iconStorageId: model.iconStorageId,
          iconUrl: resolvedUrl ?? model.iconUrl,
          websiteUrl: model.websiteUrl,
          contextWindow: model.contextWindow,
          description: model.description,
          reviewStatus: model.reviewStatus,
          createdBy: model.createdBy,
          createdAt: model.createdAt,
          updatedAt: model.updatedAt,
          submitterInfo: userInfo,
        }
      })
    )

    return modelsWithUserInfo
  },
})

export const approveModel = mutation({
  args: {
    modelId: v.id('models'),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error('Unauthorized')
    }

    await ctx.db.patch(args.modelId, {
      reviewStatus: 'approved',
      updatedAt: Date.now(),
    })
  },
})

export const rejectModel = mutation({
  args: {
    modelId: v.id('models'),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error('Unauthorized')
    }

    await ctx.db.patch(args.modelId, {
      reviewStatus: 'rejected',
      updatedAt: Date.now(),
    })
  },
})

export const getPendingToolEditSuggestions = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) {
      return null
    }

    const suggestions = await ctx.db
      .query('toolEditSuggestions')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .collect()

    const suggestionsWithTools = await Promise.all(
      suggestions.map(async (suggestion) => {
        const tool = await ctx.db.get(suggestion.toolId)
        const userInfo = await getUserInfo(ctx, suggestion.submittedBy)
        const resolvedUrl = tool?.iconStorageId
          ? await ctx.storage.getUrl(tool.iconStorageId)
          : null
        return {
          ...suggestion,
          originalTool: tool ? {
            _id: tool._id,
            name: tool.name,
            categories: tool.categories,
            websiteUrl: tool.websiteUrl,
            iconStorageId: tool.iconStorageId,
            iconUrl: resolvedUrl ?? tool.iconUrl,
            tiers: tool.tiers,
          } : null,
          submitterInfo: userInfo,
        }
      })
    )

    return suggestionsWithTools
  },
})

export const approveToolEditSuggestion = mutation({
  args: {
    suggestionId: v.id('toolEditSuggestions'),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error('Unauthorized')
    }

    const user = await ctx.auth.getUserIdentity()
    const suggestion = await ctx.db.get(args.suggestionId)
    if (!suggestion) throw new Error('Suggestion not found')

    const tool = await ctx.db.get(suggestion.toolId)
    if (!tool) throw new Error('Tool not found')

    const now = Date.now()
    const tiers = suggestion.suggestedTiers.map((t, i) => ({
      tierId: `tier-${i + 1}`,
      name: t.name,
      pricing: {
        pricingType: t.pricingType,
        ...(t.pricingType === 'fixed' || t.pricingType === 'mixed'
          ? {
              fixed: {
                currency: 'USD',
                amount: t.fixedAmount ?? 0,
                period: t.fixedPeriod ?? ('month' as const),
              },
            }
          : {}),
      },
      isDefault: i === 0,
      updatedAt: now,
    }))

    await ctx.db.patch(suggestion.toolId, {
      name: suggestion.suggestedName,
      categories: suggestion.suggestedCategories,
      websiteUrl: suggestion.suggestedWebsiteUrl,
      tiers,
      updatedAt: now,
    })

    await ctx.db.patch(args.suggestionId, {
      status: 'approved',
      reviewedAt: now,
      reviewedBy: user?.subject,
    })
  },
})

export const rejectToolEditSuggestion = mutation({
  args: {
    suggestionId: v.id('toolEditSuggestions'),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error('Unauthorized')
    }

    const user = await ctx.auth.getUserIdentity()

    await ctx.db.patch(args.suggestionId, {
      status: 'rejected',
      reviewedAt: Date.now(),
      reviewedBy: user?.subject,
    })
  },
})

export const getFlaggedStacks = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return null

    const allFlags = await ctx.db.query('stackFlags').collect()

    // Group flags by stackId
    const flagsByStack = new Map<Id<'stacks'>, typeof allFlags>()
    for (const flag of allFlags) {
      const existing = flagsByStack.get(flag.stackId) ?? []
      existing.push(flag)
      flagsByStack.set(flag.stackId, existing)
    }

    const result = []
    for (const [stackId, flags] of flagsByStack) {
      const stack = await ctx.db.get(stackId)
      if (!stack || stack.isLowQuality) continue // already acted on or deleted

      const creator = await ctx.db.get(stack.creatorId)
      result.push({
        _id: stack._id,
        name: stack.name,
        slug: `${stack.slug}-${stack.shortId}`,
        oneLiner: stack.oneLiner,
        creatorName: creator?.name ?? 'Unknown',
        flagCount: flags.length,
        firstFlaggedAt: Math.min(...flags.map((f) => f.createdAt)),
      })
    }

    return result.sort((a, b) => b.flagCount - a.flagCount)
  },
})

export const markStackLowQuality = mutation({
  args: { stackId: v.id('stacks') },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) throw new Error('Unauthorized')
    await ctx.db.patch(args.stackId, { isLowQuality: true, updatedAt: Date.now() })
  },
})

export const dismissStackFlags = mutation({
  args: { stackId: v.id('stacks') },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) throw new Error('Unauthorized')
    const flags = await ctx.db
      .query('stackFlags')
      .withIndex('by_stackId', (q) => q.eq('stackId', args.stackId))
      .collect()
    for (const flag of flags) {
      await ctx.db.delete(flag._id)
    }
  },
})

export const unmarkStackLowQuality = mutation({
  args: { stackId: v.id('stacks') },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) throw new Error('Unauthorized')
    await ctx.db.patch(args.stackId, { isLowQuality: false, updatedAt: Date.now() })
    // Also clear all flags so it doesn't reappear in the flagged queue
    const flags = await ctx.db
      .query('stackFlags')
      .withIndex('by_stackId', (q) => q.eq('stackId', args.stackId))
      .collect()
    for (const flag of flags) {
      await ctx.db.delete(flag._id)
    }
  },
})

export const getLowQualityStacks = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return null

    const stacks = await ctx.db
      .query('stacks')
      .withIndex('by_isLowQuality', (q) => q.eq('isLowQuality', true))
      .collect()

    return await Promise.all(
      stacks.map(async (stack) => {
        const creator = await ctx.db.get(stack.creatorId)
        const flagCount = (
          await ctx.db
            .query('stackFlags')
            .withIndex('by_stackId', (q) => q.eq('stackId', stack._id))
            .collect()
        ).length
        return {
          _id: stack._id,
          name: stack.name,
          slug: `${stack.slug}-${stack.shortId}`,
          oneLiner: stack.oneLiner,
          creatorName: creator?.name ?? 'Unknown',
          flagCount,
          updatedAt: stack.updatedAt,
        }
      })
    )
  },
})

export const updateToolEditSuggestion = mutation({
  args: {
    suggestionId: v.id('toolEditSuggestions'),
    suggestedName: v.string(),
    suggestedCategories: v.array(v.string()),
    suggestedWebsiteUrl: v.optional(v.string()),
    suggestedTiers: v.array(
      v.object({
        name: v.string(),
        pricingType: v.union(v.literal('fixed'), v.literal('usage'), v.literal('mixed')),
        fixedAmount: v.optional(v.number()),
        fixedPeriod: v.optional(v.union(v.literal('month'), v.literal('year'), v.literal('one_time'))),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error('Unauthorized')
    }

    const suggestion = await ctx.db.get(args.suggestionId)
    if (!suggestion) throw new Error('Suggestion not found')

    await ctx.db.patch(args.suggestionId, {
      suggestedName: args.suggestedName,
      suggestedCategories: args.suggestedCategories,
      suggestedWebsiteUrl: args.suggestedWebsiteUrl,
      suggestedTiers: args.suggestedTiers,
    })
  },
})
