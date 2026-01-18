import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const PageLink = v.object({
  name: v.string(),
  url: v.string(),
})

const Money = v.object({
  currency: v.string(),
  amount: v.number(),
  period: v.union(
    v.literal('month'),
    v.literal('year'),
    v.literal('one_time')
  ),
})

const UsagePricing = v.object({
  unit: v.string(),
  pricePerUnit: v.number(),
  currency: v.string(),
  notes: v.optional(v.string()),
})

const TierPricing = v.object({
  pricingType: v.union(
    v.literal('fixed'),
    v.literal('usage'),
    v.literal('mixed')
  ),
  fixed: v.optional(Money),
  usage: v.optional(UsagePricing),
})

export default defineSchema({
  creators: defineTable({
    name: v.string(),
    slug: v.string(),
    xHandle: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    verified: v.boolean(),
    personalPages: v.array(PageLink),
    projectPages: v.array(PageLink),
    bio: v.optional(v.string()),
    discordUserId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_verified', ['verified']),

  products: defineTable({
    name: v.string(),
    slug: v.string(),
    category: v.string(),
    iconUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    affiliateUrl: v.optional(v.string()),
    tiers: v.array(
      v.object({
        tierId: v.string(),
        name: v.string(),
        pricing: TierPricing,
        isDefault: v.optional(v.boolean()),
        updatedAt: v.optional(v.number()),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_category', ['category']),

  stacks: defineTable({
    slug: v.string(),
    creatorId: v.id('creators'),
    title: v.string(),
    teamSize: v.optional(v.number()),
    summary: v.string(),
    productSubscriptions: v.array(
      v.object({
        productId: v.id('products'),
        tierId: v.optional(v.string()),
        primaryUsageLabel: v.string(),
        price: TierPricing,
        priceKind: v.union(
          v.literal('regular'),
          v.literal('discounted'),
          v.literal('bundle'),
          v.literal('usage_based')
        ),
        bundleName: v.optional(v.string()),
        notes: v.optional(v.string()),
      })
    ),
    bundleCosts: v.optional(
      v.array(
        v.object({
          bundleName: v.string(),
          pricing: v.object({
            pricingType: v.literal("fixed"),
            fixed: v.object({
              currency: v.string(),
              amount: v.number(),
              period: v.union(v.literal("month"), v.literal("year"), v.literal("one_time")),
            }),
          }),
          notes: v.optional(v.string()),
        }),
      ),
    ),
    fixedTotal: v.optional(Money),
    usageTotalNotes: v.optional(v.string()),
    hasUsageComponent: v.boolean(),
    published: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_creatorId', ['creatorId'])
    .index('by_published', ['published']),

  waitlist: defineTable({
    email: v.string(),
    userId: v.optional(v.string()),
    provider: v.union(v.literal('email'), v.literal('google')),
    status: v.union(v.literal('pending'), v.literal('registered')),
    joinedAt: v.number(),
    source: v.optional(v.string()),
    lookupId: v.string(), // UUID for secure public status page access
  })
    .index('by_email', ['email'])
    .index('by_userId', ['userId'])
    .index('by_status', ['status'])
    .index('by_lookupId', ['lookupId']),
})
