import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const ADMIN_EMAILS = ['alportac@gmail.com']

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

    return tools
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
    category: v.optional(v.string()),
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
    category: v.string(),
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
      category: args.category,
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

    return bundles
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
