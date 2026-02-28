import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
// @ts-ignore - components will be generated after convex dev restarts
import { components } from './_generated/api'

const ADMIN_EMAILS = ['alportac@gmail.com']

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

async function isAdmin(ctx: any) {
  const user = await ctx.auth.getUserIdentity()
  if (!user) return false

  if (ADMIN_EMAILS.includes(user.email)) return true

  // Dev-only admin access via Convex IS_DEV env var
  // (process.env.NODE_ENV is always 'production' in Convex runtime, even during local dev)
  if (user.email === 'dev-admin@example.com' && process.env.IS_DEV === 'true') {
    return true
  }

  return false
}

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
        return { ...tool, submitterInfo: userInfo }
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
      tiers,
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
        return { ...bundle, submitterInfo: userInfo }
      })
    )

    return bundlesWithUserInfo
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
        return { ...model, submitterInfo: userInfo }
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
        return {
          ...suggestion,
          originalTool: tool ? {
            name: tool.name,
            categories: tool.categories,
            websiteUrl: tool.websiteUrl,
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
