import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const listAll = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('tools'),
      name: v.string(),
      slug: v.string(),
      aliases: v.optional(v.array(v.string())),
      categories: v.array(v.string()),
      iconUrl: v.optional(v.string()),
      websiteUrl: v.optional(v.string()),
      tiers: v.array(
        v.object({
          tierId: v.string(),
          name: v.string(),
          pricing: v.object({
            pricingType: v.union(v.literal('fixed'), v.literal('usage'), v.literal('mixed')),
            fixed: v.optional(v.object({
              currency: v.string(),
              amount: v.number(),
              period: v.union(v.literal('month'), v.literal('year'), v.literal('one_time')),
            })),
            usage: v.optional(v.object({
              unit: v.string(),
              pricePerUnit: v.number(),
              currency: v.string(),
              notes: v.optional(v.string()),
            })),
          }),
          isDefault: v.optional(v.boolean()),
          updatedAt: v.optional(v.number()),
        })
      ),
    })
  ),
  handler: async (ctx) => {
    const tools = await ctx.db
      .query('tools')
      .withIndex('by_reviewStatus', (q) => q.eq('reviewStatus', 'approved'))
      .collect()
    return tools.map((t) => ({
      _id: t._id,
      name: t.name,
      slug: t.slug,
      aliases: t.aliases,
      categories: t.categories,
      iconUrl: t.iconUrl,
      websiteUrl: t.websiteUrl,
      tiers: t.tiers,
    }))
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    categories: v.array(v.string()),
    websiteUrl: v.optional(v.string()),
    tiers: v.array(
      v.object({
        name: v.string(),
        pricingType: v.union(v.literal('fixed'), v.literal('usage'), v.literal('mixed')),
        fixedAmount: v.optional(v.number()),
        fixedPeriod: v.optional(v.union(v.literal('month'), v.literal('year'), v.literal('one_time'))),
      })
    ),
  },
  returns: v.id('tools'),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')

    // Check for existing tool with same name (case-insensitive)
    const allTools = await ctx.db.query('tools').collect()
    const normalizedName = args.name.trim().toLowerCase()
    const existingByName = allTools.find(
      (t) => t.name.trim().toLowerCase() === normalizedName
    )
    if (existingByName) {
      throw new Error(`A tool with the name "${args.name}" already exists`)
    }

    // Check for existing tool with same website URL
    if (args.websiteUrl) {
      const normalizedUrl = args.websiteUrl.trim().toLowerCase().replace(/\/$/, '')
      const existingByUrl = allTools.find(
        (t) => t.websiteUrl?.trim().toLowerCase().replace(/\/$/, '') === normalizedUrl
      )
      if (existingByUrl) {
        throw new Error(`A tool with the URL "${args.websiteUrl}" already exists (${existingByUrl.name})`)
      }
    }

    const baseSlug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    let slug = baseSlug
    let suffix = 2
    while (
      await ctx.db
        .query('tools')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .first()
    ) {
      slug = `${baseSlug}-${suffix}`
      suffix++
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

    return await ctx.db.insert('tools', {
      name: args.name,
      slug,
      categories: args.categories,
      websiteUrl: args.websiteUrl,
      tiers,
      reviewStatus: 'pending',
      createdBy: user.subject,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const suggestEdit = mutation({
  args: {
    toolId: v.id('tools'),
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
    reason: v.optional(v.string()),
  },
  returns: v.id('toolEditSuggestions'),
  handler: async (ctx, args) => {
    const tool = await ctx.db.get(args.toolId)
    if (!tool) throw new Error('Tool not found')

    const user = await ctx.auth.getUserIdentity()

    return await ctx.db.insert('toolEditSuggestions', {
      toolId: args.toolId,
      suggestedName: args.suggestedName,
      suggestedCategories: args.suggestedCategories,
      suggestedWebsiteUrl: args.suggestedWebsiteUrl,
      suggestedTiers: args.suggestedTiers,
      reason: args.reason,
      status: 'pending',
      submittedBy: user?.subject,
      createdAt: Date.now(),
    })
  },
})
