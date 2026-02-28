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

const InstructionType = v.union(
  v.literal('prompt'),
  v.literal('rule'),
  v.literal('skill'),
  v.literal('mcp'),
  v.literal('plugin'),
  v.literal('subagent')
)

const InstructionItem = v.object({
  type: InstructionType,
  name: v.string(),
  description: v.optional(v.string()),
  content: v.optional(v.string()),
  url: v.optional(v.string()),
  trigger: v.optional(v.string()),
})

const ModelCategory = v.union(
  v.literal('language'),
  v.literal('coding'),
  v.literal('reasoning'),
  v.literal('vision'),
  v.literal('audio'),
  v.literal('image'),
  v.literal('video'),
  v.literal('embedding'),
  v.literal('other')
)

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
    userId: v.optional(v.string()),
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
    .index('by_userId', ['userId'])
    .index('by_verified', ['verified']),

  tools: defineTable({
    name: v.string(),
    slug: v.string(),
    categories: v.array(v.string()),
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
    reviewStatus: v.union(
      v.literal('approved'),
      v.literal('pending'),
      v.literal('rejected')
    ),
    createdBy: v.optional(v.string()), // userId of creator
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_reviewStatus', ['reviewStatus']),

  stacks: defineTable({
    name: v.string(),
    slug: v.string(),
    creatorId: v.id('creators'),
    teamSize: v.optional(v.number()),
    oneLiner: v.string(),
    description: v.optional(v.string()),
    instructions: v.optional(v.array(InstructionItem)),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id('_storage')),
    personalPageUrl: v.optional(v.string()),
    projectPageUrl: v.optional(v.string()),
    toolSubscriptions: v.array(
      v.object({
        toolId: v.id('tools'),
        tierId: v.optional(v.string()),
        kind: v.union(v.literal('main'), v.literal('misc')),
        primaryUsageLabel: v.string(),
        price: TierPricing,
        priceKind: v.union(
          v.literal('regular'),
          v.literal('discounted'),
          v.literal('bundle'),
          v.literal('usage_based')
        ),
        bundleSlug: v.optional(v.string()),
        notes: v.optional(v.string()),
      })
    ),
    bundleSubscriptions: v.optional(
      v.array(
        v.object({
          bundleId: v.id('bundles'),
          tierId: v.string(),
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

  bundles: defineTable({
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
        pricing: TierPricing,
        isDefault: v.optional(v.boolean()),
      })
    ),
    reviewStatus: v.union(
      v.literal('approved'),
      v.literal('pending'),
      v.literal('rejected')
    ),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_reviewStatus', ['reviewStatus']),

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

  stackUpvotes: defineTable({
    stackId: v.id('stacks'),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index('by_stackId', ['stackId'])
    .index('by_userId', ['userId'])
    .index('by_stackId_userId', ['stackId', 'userId']),

  models: defineTable({
    name: v.string(),
    slug: v.string(),
    provider: v.string(),
    category: ModelCategory,
    iconUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    contextWindow: v.optional(v.number()),
    description: v.optional(v.string()),
    reviewStatus: v.union(
      v.literal('approved'),
      v.literal('pending'),
      v.literal('rejected')
    ),
    createdBy: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_provider', ['provider'])
    .index('by_category', ['category'])
    .index('by_reviewStatus', ['reviewStatus']),

  toolEditSuggestions: defineTable({
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
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected')
    ),
    submittedBy: v.optional(v.string()),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.string()),
  })
    .index('by_toolId', ['toolId'])
    .index('by_status', ['status']),
})
