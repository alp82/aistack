import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import type { QueryCtx } from './_generated/server'
import { type FixedPrice, sumNormalizedMonthlyAmounts } from '../src/lib/pricing'
import { slugifyAscii } from '../src/lib/slug'
import { generateUniqueShortId, extractShortId } from './lib/ids'
import { InstructionItem as InstructionItemValidator } from './schema'

type ToolSubscriptionLike = {
  price: {
    pricingType: 'fixed' | 'usage' | 'mixed'
    fixed?: FixedPrice
  }
}

type BundleSubscriptionLike = {
  bundleSlug: string
  tierId: string
}

function buildFixedTotal(prices: Array<FixedPrice | undefined>) {
  return {
    currency: 'USD',
    amount: sumNormalizedMonthlyAmounts(prices),
    period: 'month' as const,
  }
}

async function calculateStackPricing(
  ctx: QueryCtx,
  toolSubscriptions: ToolSubscriptionLike[],
  bundleSubscriptions: BundleSubscriptionLike[] = []
) {
  const fixedPrices: Array<FixedPrice | undefined> = []
  let hasUsageComponent = false

  for (const sub of toolSubscriptions) {
    if (sub.price.fixed) fixedPrices.push(sub.price.fixed)
    if (sub.price.pricingType === 'usage' || sub.price.pricingType === 'mixed') {
      hasUsageComponent = true
    }
  }

  const bundles = await Promise.all(
    bundleSubscriptions.map((bs) =>
      ctx.db
        .query('bundles')
        .withIndex('by_slug', (q) => q.eq('slug', bs.bundleSlug))
        .first()
        .then((bundle) => ({ bs, bundle }))
    )
  )
  for (const { bs, bundle } of bundles) {
    if (!bundle) continue
    const tier = bundle.tiers.find((t) => t.tierId === bs.tierId)
    if (tier?.pricing.fixed) fixedPrices.push(tier.pricing.fixed)
    if (tier?.pricing.pricingType === 'usage' || tier?.pricing.pricingType === 'mixed') {
      hasUsageComponent = true
    }
  }

  return {
    fixedTotal: buildFixedTotal(fixedPrices),
    hasUsageComponent,
  }
}

const MoneyValidator = v.object({
  currency: v.string(),
  amount: v.number(),
  period: v.union(v.literal('month'), v.literal('year'), v.literal('one_time')),
})

const PriceValidator = v.object({
  pricingType: v.union(v.literal('fixed'), v.literal('usage'), v.literal('mixed')),
  fixed: v.optional(MoneyValidator),
})

const ToolValidator = v.object({
  _id: v.id('tools'),
  name: v.string(),
  slug: v.string(),
  categories: v.array(v.string()),
  iconUrl: v.optional(v.string()),
  websiteUrl: v.optional(v.string()),
  price: PriceValidator,
  originalTierPrice: v.optional(MoneyValidator),
  kind: v.union(v.literal('main'), v.literal('misc')),
  primaryUsageLabel: v.string(),
  tierName: v.string(),
  priceKind: v.union(
    v.literal('regular'),
    v.literal('discounted'),
    v.literal('bundle'),
    v.literal('usage_based'),
    v.literal('sponsored')
  ),
  bundleSlug: v.optional(v.string()),
  description: v.optional(v.string()),
})

const BundleValidator = v.object({
  _id: v.id('bundles'),
  name: v.string(),
  slug: v.string(),
  iconUrl: v.optional(v.string()),
  websiteUrl: v.optional(v.string()),
  tierId: v.string(),
  tierName: v.string(),
  price: PriceValidator,
  description: v.optional(v.string()),
})

const ModelValidator = v.object({
  _id: v.id('models'),
  name: v.string(),
  slug: v.string(),
  provider: v.string(),
  category: v.string(),
  iconUrl: v.optional(v.string()),
  role: v.union(v.literal('primary'), v.literal('secondary'), v.literal('specialized')),
  description: v.optional(v.string()),
})

const CreatorValidator = v.object({
  _id: v.id('creators'),
  name: v.string(),
  xHandle: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  verified: v.boolean(),
  personalPages: v.array(v.object({ name: v.string(), url: v.string() })),
  projectPages: v.array(v.object({ name: v.string(), url: v.string() })),
})

export const listPublished = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('stacks'),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      oneLiner: v.string(),
      teamSize: v.optional(v.number()),
      fixedTotal: v.optional(MoneyValidator),
      hasUsageComponent: v.boolean(),
      usageTotalNotes: v.optional(v.string()),
      personalPageUrl: v.optional(v.string()),

      creator: CreatorValidator,
      tools: v.array(ToolValidator),
      upvoteCount: v.number(),
      isLowQuality: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx) => {
    const stacks = await ctx.db
      .query('stacks')
      .withIndex('by_published', (q) => q.eq('published', true))
      .collect()

    const maybeResults = await Promise.all(
      stacks.map(async (stack) => {
        const creator = await ctx.db.get(stack.creatorId)
        if (!creator) return null
        const pricing = await calculateStackPricing(ctx, stack.toolSubscriptions, stack.bundleSubscriptions ?? [])

        const toolEntries = await Promise.all(
          stack.toolSubscriptions.map(async (sub) => {
            const tool = await ctx.db
              .query('tools')
              .withIndex('by_slug', (q) => q.eq('slug', sub.toolSlug))
              .first()
            if (!tool) return null
            const tier = sub.tierId ? tool.tiers.find((t) => t.tierId === sub.tierId) : undefined
            const resolvedToolUrl = tool.iconStorageId
              ? await ctx.storage.getUrl(tool.iconStorageId)
              : null
            return {
              _id: tool._id,
              name: tool.name,
              slug: tool.slug,
              categories: tool.categories,
              iconUrl: resolvedToolUrl ?? tool.iconUrl,
              websiteUrl: tool.websiteUrl,
              price: sub.price,
              originalTierPrice: tier?.pricing.fixed,
              kind: sub.kind,
              primaryUsageLabel: sub.primaryUsageLabel,
              tierName: tier?.name ?? sub.tierId ?? '',
              priceKind: sub.priceKind,
              bundleSlug: sub.bundleSlug,
              description: sub.description,
            }
          })
        )
        const tools = toolEntries.filter((t): t is NonNullable<typeof t> => t !== null)

        const upvotes = await ctx.db
          .query('stackUpvotes')
          .withIndex('by_stackId', (q) => q.eq('stackId', stack._id))
          .collect()

        return {
          _id: stack._id,
          _creationTime: stack._creationTime,
          name: stack.name,
          slug: `${stack.slug}-${stack.shortId}`,
          oneLiner: stack.oneLiner,
          teamSize: stack.teamSize,
          fixedTotal: pricing.fixedTotal,
          hasUsageComponent: pricing.hasUsageComponent,
          usageTotalNotes: stack.usageTotalNotes,
          personalPageUrl: stack.personalPageUrl,

          creator: {
            _id: creator._id,
            name: creator.name,
            xHandle: creator.xHandle,
            avatarUrl: stack.stackImageUrl ?? creator.avatarUrl,
            verified: creator.verified,
            personalPages: creator.personalPages,
            projectPages: creator.projectPages,
          },
          tools,
          upvoteCount: upvotes.length,
          isLowQuality: stack.isLowQuality,
        }
      })
    )

    return maybeResults.filter((r): r is NonNullable<typeof r> => r !== null)
  },
})

const ToolSubscriptionInput = v.object({
  toolSlug: v.string(),
  tierId: v.optional(v.string()),
  kind: v.union(v.literal('main'), v.literal('misc')),
  primaryUsageLabel: v.string(),
  price: v.object({
    pricingType: v.union(v.literal('fixed'), v.literal('usage'), v.literal('mixed')),
    fixed: v.optional(MoneyValidator),
  }),
  priceKind: v.union(
    v.literal('regular'),
    v.literal('discounted'),
    v.literal('bundle'),
    v.literal('usage_based'),
    v.literal('sponsored')
  ),
  bundleSlug: v.optional(v.string()),
  description: v.optional(v.string()),
})

const BundleSubscriptionInput = v.object({
  bundleSlug: v.string(),
  tierId: v.string(),
  description: v.optional(v.string()),
})

const ModelSubscriptionInput = v.object({
  modelSlug: v.string(),
  role: v.union(v.literal('primary'), v.literal('secondary'), v.literal('specialized')),
  description: v.optional(v.string()),
})

export const create = mutation({
  args: {
    name: v.string(),
    oneLiner: v.string(),
    description: v.optional(v.string()),
    instructions: v.optional(v.array(InstructionItemValidator)),
    teamSize: v.optional(v.number()),
    toolSubscriptions: v.array(ToolSubscriptionInput),
    bundleSubscriptions: v.optional(v.array(BundleSubscriptionInput)),
    modelSubscriptions: v.optional(v.array(ModelSubscriptionInput)),
    stackImageUrl: v.optional(v.string()),
    personalPageUrl: v.optional(v.string()),
    published: v.boolean(),
  },
  returns: v.object({ _id: v.id('stacks'), slug: v.string() }),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]

    const creator = await ctx.db
      .query('creators')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first()
    if (!creator) throw new Error('Creator profile not found. Create one first.')

    const existingStack = await ctx.db
      .query('stacks')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creator._id))
      .first()
    if (existingStack) throw new Error('You already have a stack. Please edit your existing stack instead.')

    // Generate slug and shortId
    const slug = slugifyAscii(args.name, `${creator.slug}-stack`)
    const shortId = await generateUniqueShortId(ctx, 'stacks')
    const pricing = await calculateStackPricing(ctx, args.toolSubscriptions, args.bundleSubscriptions ?? [])

    const now = Date.now()
    const id = await ctx.db.insert('stacks', {
      name: args.name,
      slug,
      shortId,
      creatorId: creator._id,
      oneLiner: args.oneLiner,
      description: args.description,
      instructions: args.instructions,
      teamSize: args.teamSize,
      toolSubscriptions: args.toolSubscriptions,
      bundleSubscriptions: args.bundleSubscriptions,
      modelSubscriptions: args.modelSubscriptions,
      stackImageUrl: args.stackImageUrl,
      personalPageUrl: args.personalPageUrl,
      fixedTotal: pricing.fixedTotal,
      hasUsageComponent: pricing.hasUsageComponent,
      published: args.published,
      createdAt: now,
      updatedAt: now,
    })

    return { _id: id, slug: `${slug}-${shortId}` }
  },
})

export const update = mutation({
  args: {
    stackId: v.id('stacks'),
    name: v.optional(v.string()),
    oneLiner: v.optional(v.string()),
    description: v.optional(v.string()),
    instructions: v.optional(v.array(InstructionItemValidator)),
    teamSize: v.optional(v.union(v.number(), v.null())),
    toolSubscriptions: v.optional(v.array(ToolSubscriptionInput)),
    bundleSubscriptions: v.optional(v.array(BundleSubscriptionInput)),
    modelSubscriptions: v.optional(v.array(ModelSubscriptionInput)),
    stackImageUrl: v.optional(v.string()),
    personalPageUrl: v.optional(v.string()),
    published: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]

    const stack = await ctx.db.get(args.stackId)
    if (!stack) throw new Error('Stack not found')

    const creator = await ctx.db.get(stack.creatorId)
    if (!creator || creator.userId !== userId) throw new Error('Not authorized')

    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    if (args.name !== undefined) {
      patch.name = args.name
      patch.slug = slugifyAscii(args.name, stack.slug)
    }
    if (args.oneLiner !== undefined) patch.oneLiner = args.oneLiner
    if (args.description !== undefined) patch.description = args.description
    if (args.instructions !== undefined) patch.instructions = args.instructions
    if (args.teamSize !== undefined) patch.teamSize = args.teamSize === null ? undefined : args.teamSize
    const meaningfulChange =
      args.name !== undefined ||
      args.oneLiner !== undefined ||
      args.description !== undefined ||
      args.toolSubscriptions !== undefined ||
      args.bundleSubscriptions !== undefined ||
      args.modelSubscriptions !== undefined
    if (meaningfulChange && stack.isLowQuality) patch.isLowQuality = false

    if (args.toolSubscriptions !== undefined) patch.toolSubscriptions = args.toolSubscriptions
    if (args.bundleSubscriptions !== undefined) patch.bundleSubscriptions = args.bundleSubscriptions
    if (args.modelSubscriptions !== undefined) patch.modelSubscriptions = args.modelSubscriptions
    if (args.stackImageUrl !== undefined) patch.stackImageUrl = args.stackImageUrl
    if (args.personalPageUrl !== undefined) patch.personalPageUrl = args.personalPageUrl
    if (args.published !== undefined) patch.published = args.published

    const subs = args.toolSubscriptions ?? stack.toolSubscriptions
    const bSubs = args.bundleSubscriptions ?? stack.bundleSubscriptions ?? []
    const pricing = await calculateStackPricing(ctx, subs, bSubs)
    patch.fixedTotal = pricing.fixedTotal
    patch.hasUsageComponent = pricing.hasUsageComponent

    await ctx.db.patch(args.stackId, patch)
    return null
  },
})

export const getForEdit = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id('stacks'),
      name: v.string(),
      slug: v.string(),
      oneLiner: v.string(),
      description: v.optional(v.string()),
      instructions: v.optional(v.array(InstructionItemValidator)),
      teamSize: v.optional(v.number()),
      fixedTotal: v.optional(MoneyValidator),
      hasUsageComponent: v.boolean(),
      published: v.boolean(),
      stackImageUrl: v.optional(v.string()),
      personalPageUrl: v.optional(v.string()),

      toolSubscriptions: v.array(v.object({
        toolSlug: v.string(),
        toolName: v.string(),
        toolCategories: v.array(v.string()),
        toolIconUrl: v.optional(v.string()),
        tierId: v.optional(v.string()),
        kind: v.union(v.literal('main'), v.literal('misc')),
        primaryUsageLabel: v.string(),
        price: PriceValidator,
        originalTierPrice: v.optional(MoneyValidator),
        priceKind: v.union(
          v.literal('regular'),
          v.literal('discounted'),
          v.literal('bundle'),
          v.literal('usage_based'),
          v.literal('sponsored')
        ),
        bundleSlug: v.optional(v.string()),
        description: v.optional(v.string()),
      })),
      bundleSubscriptions: v.array(v.object({
        bundleSlug: v.string(),
        bundleName: v.string(),
        tierId: v.string(),
        tierName: v.string(),
        price: v.optional(PriceValidator),
        description: v.optional(v.string()),
      })),
      modelSubscriptions: v.array(v.object({
        modelSlug: v.string(),
        modelName: v.string(),
        modelProvider: v.string(),
        modelCategory: v.string(),
        modelIconUrl: v.optional(v.string()),
        role: v.union(v.literal('primary'), v.literal('secondary'), v.literal('specialized')),
        description: v.optional(v.string()),
      })),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) return null
    const userId = user.tokenIdentifier.split('|')[1]

    const shortId = extractShortId(args.slug)
    const stack = await ctx.db
      .query('stacks')
      .withIndex('by_shortId', (q) => q.eq('shortId', shortId))
      .first()
    if (!stack) return null

    const creator = await ctx.db.get(stack.creatorId)
    if (!creator || creator.userId !== userId) return null

    const toolSubEntries = await Promise.all(
      stack.toolSubscriptions.map(async (sub) => {
        const tool = await ctx.db
          .query('tools')
          .withIndex('by_slug', (q) => q.eq('slug', sub.toolSlug))
          .first()
        if (!tool) return null
        const tier = sub.tierId ? tool.tiers.find((t) => t.tierId === sub.tierId) : undefined
        const resolvedToolUrl = tool.iconStorageId
          ? await ctx.storage.getUrl(tool.iconStorageId)
          : null
        return {
          toolSlug: sub.toolSlug,
          toolName: tool.name,
          toolCategories: tool.categories,
          toolIconUrl: resolvedToolUrl ?? tool.iconUrl,
          tierId: sub.tierId,
          kind: sub.kind,
          primaryUsageLabel: sub.primaryUsageLabel,
          price: sub.price,
          originalTierPrice: tier?.pricing.fixed,
          priceKind: sub.priceKind,
          bundleSlug: sub.bundleSlug,
          description: sub.description,
        }
      })
    )
    const toolSubs = toolSubEntries.filter((s): s is NonNullable<typeof s> => s !== null)

    const bundleSubEntries = await Promise.all(
      (stack.bundleSubscriptions ?? []).map(async (bs) => {
        const bundle = await ctx.db
          .query('bundles')
          .withIndex('by_slug', (q) => q.eq('slug', bs.bundleSlug))
          .first()
        if (!bundle) return null
        const tier = bundle.tiers.find((t) => t.tierId === bs.tierId)
        return {
          bundleSlug: bs.bundleSlug,
          bundleName: bundle.name,
          tierId: bs.tierId,
          tierName: tier?.name ?? bs.tierId,
          price: tier?.pricing ? { pricingType: tier.pricing.pricingType, fixed: tier.pricing.fixed } : undefined,
          description: bs.description,
        }
      })
    )
    const bundleSubs = bundleSubEntries.filter((s): s is NonNullable<typeof s> => s !== null)

    const modelSubEntries = await Promise.all(
      (stack.modelSubscriptions ?? []).map(async (ms) => {
        const model = await ctx.db
          .query('models')
          .withIndex('by_slug', (q) => q.eq('slug', ms.modelSlug))
          .first()
        if (!model) return null
        const resolvedModelUrl = model.iconStorageId
          ? await ctx.storage.getUrl(model.iconStorageId)
          : null
        return {
          modelSlug: ms.modelSlug,
          modelName: model.name,
          modelProvider: model.provider,
          modelCategory: model.category,
          modelIconUrl: resolvedModelUrl ?? model.iconUrl,
          role: ms.role,
          description: ms.description,
        }
      })
    )
    const modelSubs = modelSubEntries.filter((s): s is NonNullable<typeof s> => s !== null)

    const pricing = await calculateStackPricing(ctx, stack.toolSubscriptions, stack.bundleSubscriptions ?? [])

    return {
      _id: stack._id,
      name: stack.name,
      slug: `${stack.slug}-${stack.shortId}`,
      oneLiner: stack.oneLiner,
      description: stack.description,
      instructions: stack.instructions,
      teamSize: stack.teamSize,
      fixedTotal: pricing.fixedTotal,
      hasUsageComponent: pricing.hasUsageComponent,
      published: stack.published,
      stackImageUrl: stack.stackImageUrl,
      personalPageUrl: stack.personalPageUrl,
      toolSubscriptions: toolSubs,
      bundleSubscriptions: bundleSubs,
      modelSubscriptions: modelSubs,
    }
  },
})

export const getUserStack = query({
  args: {},
  returns: v.union(
    v.object({
      slug: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) return null
    const userId = user.tokenIdentifier.split('|')[1]

    const creator = await ctx.db
      .query('creators')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first()
    if (!creator) return null

    const stack = await ctx.db
      .query('stacks')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creator._id))
      .first()
    
    if (!stack) return null

    return {
      slug: `${stack.slug}-${stack.shortId}`,
    }
  },
})

export const getLandingStats = query({
  args: {},
  returns: v.object({
    stackCount: v.number(),
    avgCost: v.number(),
    toolCount: v.number(),
  }),
  handler: async (ctx) => {
    const stacks = await ctx.db
      .query('stacks')
      .withIndex('by_published', (q) => q.eq('published', true))
      .collect()

    const toolIds = new Set<string>()
    let totalCost = 0
    let stacksWithCost = 0

    const pricings = await Promise.all(
      stacks.map((stack) =>
        calculateStackPricing(ctx, stack.toolSubscriptions, stack.bundleSubscriptions ?? [])
      )
    )
    for (let i = 0; i < stacks.length; i++) {
      const stack = stacks[i]
      const pricing = pricings[i]
      if (pricing.fixedTotal.amount) {
        totalCost += pricing.fixedTotal.amount
        stacksWithCost++
      }
      for (const sub of stack.toolSubscriptions) {
        toolIds.add(sub.toolSlug)
      }
    }

    return {
      stackCount: stacks.length,
      avgCost: stacksWithCost > 0 ? Math.round(totalCost / stacksWithCost) : 0,
      toolCount: toolIds.size,
    }
  },
})

export const toggleUpvote = mutation({
  args: {
    stackId: v.id('stacks'),
  },
  returns: v.object({
    upvoted: v.boolean(),
    count: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]

    // Prevent users from upvoting their own stack
    const stack = await ctx.db.get(args.stackId)
    if (!stack) throw new Error('Stack not found')
    const creator = await ctx.db.get(stack.creatorId)
    if (creator && creator.userId === userId) {
      throw new Error('You cannot upvote your own stack')
    }

    const existing = await ctx.db
      .query('stackUpvotes')
      .withIndex('by_stackId_userId', (q) => 
        q.eq('stackId', args.stackId).eq('userId', userId)
      )
      .first()

    if (existing) {
      await ctx.db.delete(existing._id)
      const count = await ctx.db
        .query('stackUpvotes')
        .withIndex('by_stackId', (q) => q.eq('stackId', args.stackId))
        .collect()
      return { upvoted: false, count: count.length }
    }

    await ctx.db.insert('stackUpvotes', {
      stackId: args.stackId,
      userId,
      createdAt: Date.now(),
    })

    const count = await ctx.db
      .query('stackUpvotes')
      .withIndex('by_stackId', (q) => q.eq('stackId', args.stackId))
      .collect()
    return { upvoted: true, count: count.length }
  },
})

export const getUpvoteStatus = query({
  args: {
    stackId: v.id('stacks'),
  },
  returns: v.object({
    upvoted: v.boolean(),
    count: v.number(),
    isOwner: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    const userId = user ? user.tokenIdentifier.split('|')[1] : null

    const upvotes = await ctx.db
      .query('stackUpvotes')
      .withIndex('by_stackId', (q) => q.eq('stackId', args.stackId))
      .collect()

    const upvoted = userId 
      ? upvotes.some((u) => u.userId === userId)
      : false

    // Check if user owns this stack
    let isOwner = false
    if (userId) {
      const stack = await ctx.db.get(args.stackId)
      if (stack) {
        const creator = await ctx.db.get(stack.creatorId)
        isOwner = creator?.userId === userId
      }
    }

    return { upvoted, count: upvotes.length, isOwner }
  },
})

export const reportStack = mutation({
  args: { stackId: v.id('stacks') },
  returns: v.object({ reported: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]

    const stack = await ctx.db.get(args.stackId)
    if (!stack) throw new Error('Stack not found')

    const creator = await ctx.db.get(stack.creatorId)
    if (creator && creator.userId === userId) throw new Error('You cannot report your own stack')

    const existing = await ctx.db
      .query('stackFlags')
      .withIndex('by_stackId_userId', (q) => q.eq('stackId', args.stackId).eq('userId', userId))
      .first()
    if (existing) return { reported: true }

    await ctx.db.insert('stackFlags', { stackId: args.stackId, userId, createdAt: Date.now() })
    return { reported: true }
  },
})

export const unreportStack = mutation({
  args: { stackId: v.id('stacks') },
  returns: v.object({ reported: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]

    const existing = await ctx.db
      .query('stackFlags')
      .withIndex('by_stackId_userId', (q) => q.eq('stackId', args.stackId).eq('userId', userId))
      .first()
    if (existing) await ctx.db.delete(existing._id)
    return { reported: false }
  },
})

export const getReportStatus = query({
  args: { stackId: v.id('stacks') },
  returns: v.object({ reported: v.boolean(), flagCount: v.number() }),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    const userId = user ? user.tokenIdentifier.split('|')[1] : null

    const flags = await ctx.db
      .query('stackFlags')
      .withIndex('by_stackId', (q) => q.eq('stackId', args.stackId))
      .collect()

    const reported = userId ? flags.some((f) => f.userId === userId) : false
    return { reported, flagCount: flags.length }
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id('stacks'),
      _creationTime: v.number(),
      updatedAt: v.optional(v.number()),
      name: v.string(),
      slug: v.string(),
      oneLiner: v.string(),
      description: v.optional(v.string()),
      instructions: v.optional(v.array(InstructionItemValidator)),
      teamSize: v.optional(v.number()),
      fixedTotal: v.optional(MoneyValidator),
      hasUsageComponent: v.boolean(),
      usageTotalNotes: v.optional(v.string()),
      stackImageUrl: v.optional(v.string()),
      personalPageUrl: v.optional(v.string()),

      creator: CreatorValidator,
      tools: v.array(ToolValidator),
      bundles: v.array(BundleValidator),
      models: v.array(ModelValidator),
      isLowQuality: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const shortId = extractShortId(args.slug)
    const stack = await ctx.db
      .query('stacks')
      .withIndex('by_shortId', (q) => q.eq('shortId', shortId))
      .first()

    if (!stack || !stack.published) return null

    const creator = await ctx.db.get(stack.creatorId)
    if (!creator) return null

    const toolEntries = await Promise.all(
      stack.toolSubscriptions.map(async (sub) => {
        const tool = await ctx.db
          .query('tools')
          .withIndex('by_slug', (q) => q.eq('slug', sub.toolSlug))
          .first()
        if (!tool) return null
        const toolTier = sub.tierId ? tool.tiers.find((t) => t.tierId === sub.tierId) : undefined
        const resolvedToolUrl = tool.iconStorageId
          ? await ctx.storage.getUrl(tool.iconStorageId)
          : null
        return {
          _id: tool._id,
          name: tool.name,
          slug: tool.slug,
          categories: tool.categories,
          iconUrl: resolvedToolUrl ?? tool.iconUrl,
          websiteUrl: tool.websiteUrl,
          price: sub.price,
          originalTierPrice: toolTier?.pricing.fixed,
          kind: sub.kind,
          primaryUsageLabel: sub.primaryUsageLabel,
          tierName: toolTier?.name ?? sub.tierId ?? '',
          priceKind: sub.priceKind,
          bundleSlug: sub.bundleSlug,
          description: sub.description,
        }
      })
    )
    const tools = toolEntries.filter((t): t is NonNullable<typeof t> => t !== null)

    const bundleEntries = await Promise.all(
      (stack.bundleSubscriptions ?? []).map(async (bs) => {
        const bundle = await ctx.db
          .query('bundles')
          .withIndex('by_slug', (q) => q.eq('slug', bs.bundleSlug))
          .first()
        if (!bundle) return null
        const tier = bundle.tiers.find((t) => t.tierId === bs.tierId)
        if (!tier) return null
        const resolvedBundleUrl = bundle.iconStorageId
          ? await ctx.storage.getUrl(bundle.iconStorageId)
          : null
        return {
          _id: bundle._id,
          name: bundle.name,
          slug: bundle.slug,
          iconUrl: resolvedBundleUrl ?? bundle.iconUrl,
          websiteUrl: bundle.websiteUrl,
          tierId: bs.tierId,
          tierName: tier.name,
          price: tier.pricing,
          description: bs.description,
        }
      })
    )
    const bundles = bundleEntries.filter((b): b is NonNullable<typeof b> => b !== null)

    const modelEntries = await Promise.all(
      (stack.modelSubscriptions ?? []).map(async (ms) => {
        const model = await ctx.db
          .query('models')
          .withIndex('by_slug', (q) => q.eq('slug', ms.modelSlug))
          .first()
        if (!model) return null
        const resolvedModelUrl = model.iconStorageId
          ? await ctx.storage.getUrl(model.iconStorageId)
          : null
        return {
          _id: model._id,
          name: model.name,
          slug: model.slug,
          provider: model.provider,
          category: model.category,
          iconUrl: resolvedModelUrl ?? model.iconUrl,
          role: ms.role,
          description: ms.description,
        }
      })
    )
    const models = modelEntries.filter((m): m is NonNullable<typeof m> => m !== null)

    const pricing = await calculateStackPricing(ctx, stack.toolSubscriptions, stack.bundleSubscriptions ?? [])

    return {
      _id: stack._id,
      _creationTime: stack._creationTime,
      updatedAt: stack.updatedAt ?? stack._creationTime,
      name: stack.name,
      slug: `${stack.slug}-${stack.shortId}`,
      oneLiner: stack.oneLiner,
      description: stack.description,
      instructions: stack.instructions,
      teamSize: stack.teamSize,
      fixedTotal: pricing.fixedTotal,
      hasUsageComponent: pricing.hasUsageComponent,
      usageTotalNotes: stack.usageTotalNotes,
      stackImageUrl: stack.stackImageUrl,
      personalPageUrl: stack.personalPageUrl,
      creator: {
        _id: creator._id,
        name: creator.name,
        xHandle: creator.xHandle,
        avatarUrl: stack.stackImageUrl ?? creator.avatarUrl,
        verified: creator.verified,
        personalPages: creator.personalPages,
        projectPages: creator.projectPages,
      },
      tools,
      bundles,
      models,
      isLowQuality: stack.isLowQuality,
    }
  },
})
