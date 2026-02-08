import { query } from './_generated/server'
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
    const bundles = await ctx.db.query('bundles').collect()
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
