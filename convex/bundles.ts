import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const listAll = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('bundles'),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      iconUrl: v.optional(v.string()),
      websiteUrl: v.optional(v.string()),
      toolSlugs: v.array(v.string()),
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
        })
      ),
    })
  ),
  handler: async (ctx) => {
    const bundles = await ctx.db
      .query('bundles')
      .withIndex('by_reviewStatus', (q) => q.eq('reviewStatus', 'approved'))
      .collect()
    return bundles.map((b) => ({
      _id: b._id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      iconUrl: b.iconUrl,
      websiteUrl: b.websiteUrl,
      toolSlugs: b.toolSlugs,
      tiers: b.tiers,
    }))
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    toolSlugs: v.array(v.string()),
    tiers: v.array(
      v.object({
        name: v.string(),
        pricingType: v.union(v.literal('fixed'), v.literal('usage'), v.literal('mixed')),
        fixedAmount: v.optional(v.number()),
        fixedPeriod: v.optional(v.union(v.literal('month'), v.literal('year'), v.literal('one_time'))),
      })
    ),
  },
  returns: v.id('bundles'),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')

    // Check for existing bundle with same name (case-insensitive)
    const allBundles = await ctx.db.query('bundles').collect()
    const normalizedName = args.name.trim().toLowerCase()
    const existingByName = allBundles.find(
      (b) => b.name.trim().toLowerCase() === normalizedName
    )
    if (existingByName) {
      throw new Error(`A bundle with the name "${args.name}" already exists`)
    }

    // Check for existing bundle with same website URL
    if (args.websiteUrl) {
      const normalizedUrl = args.websiteUrl.trim().toLowerCase().replace(/\/$/, '')
      const existingByUrl = allBundles.find(
        (b) => b.websiteUrl?.trim().toLowerCase().replace(/\/$/, '') === normalizedUrl
      )
      if (existingByUrl) {
        throw new Error(`A bundle with the URL "${args.websiteUrl}" already exists (${existingByUrl.name})`)
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
        .query('bundles')
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
    }))

    return await ctx.db.insert('bundles', {
      name: args.name,
      slug,
      description: args.description,
      websiteUrl: args.websiteUrl,
      toolSlugs: args.toolSlugs,
      tiers,
      reviewStatus: 'pending',
      createdBy: user.subject,
      createdAt: now,
      updatedAt: now,
    })
  },
})
