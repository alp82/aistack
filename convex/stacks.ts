import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

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
  category: v.string(),
  iconUrl: v.optional(v.string()),
  websiteUrl: v.optional(v.string()),
  price: PriceValidator,
  kind: v.union(v.literal('main'), v.literal('misc')),
  primaryUsageLabel: v.string(),
  priceKind: v.union(
    v.literal('regular'),
    v.literal('discounted'),
    v.literal('bundle'),
    v.literal('usage_based')
  ),
  bundleSlug: v.optional(v.string()),
  notes: v.optional(v.string()),
})

const BundleValidator = v.object({
  _id: v.id('bundles'),
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  iconUrl: v.optional(v.string()),
  websiteUrl: v.optional(v.string()),
  tierId: v.string(),
  tierName: v.string(),
  price: PriceValidator,
  notes: v.optional(v.string()),
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
      slug: v.string(),
      oneLiner: v.string(),
      teamSize: v.optional(v.number()),
      fixedTotal: v.optional(MoneyValidator),
      hasUsageComponent: v.boolean(),
      usageTotalNotes: v.optional(v.string()),
      creator: CreatorValidator,
      tools: v.array(ToolValidator),
    })
  ),
  handler: async (ctx) => {
    const stacks = await ctx.db
      .query('stacks')
      .withIndex('by_published', (q) => q.eq('published', true))
      .collect()

    const results = []
    for (const stack of stacks) {
      const creator = await ctx.db.get(stack.creatorId)
      if (!creator) continue

      const tools = []
      for (const sub of stack.toolSubscriptions) {
        const tool = await ctx.db.get(sub.toolId)
        if (!tool) continue
        tools.push({
          _id: tool._id,
          name: tool.name,
          slug: tool.slug,
          category: tool.category,
          iconUrl: tool.iconUrl,
          websiteUrl: tool.websiteUrl,
          price: sub.price,
          kind: sub.kind,
          primaryUsageLabel: sub.primaryUsageLabel,
          priceKind: sub.priceKind,
          bundleSlug: sub.bundleSlug,
          notes: sub.notes,
        })
      }

      results.push({
        _id: stack._id,
        _creationTime: stack._creationTime,
        slug: stack.slug,
        oneLiner: stack.oneLiner,
        teamSize: stack.teamSize,
        fixedTotal: stack.fixedTotal,
        hasUsageComponent: stack.hasUsageComponent,
        usageTotalNotes: stack.usageTotalNotes,
        creator: {
          _id: creator._id,
          name: creator.name,
          xHandle: creator.xHandle,
          avatarUrl: creator.avatarUrl,
          verified: creator.verified,
          personalPages: creator.personalPages,
          projectPages: creator.projectPages,
        },
        tools,
      })
    }

    return results
  },
})

const ToolSubscriptionInput = v.object({
  toolId: v.id('tools'),
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
    v.literal('usage_based')
  ),
  bundleSlug: v.optional(v.string()),
  notes: v.optional(v.string()),
})

const BundleSubscriptionInput = v.object({
  bundleId: v.id('bundles'),
  tierId: v.string(),
  notes: v.optional(v.string()),
})

export const create = mutation({
  args: {
    oneLiner: v.string(),
    description: v.optional(v.string()),
    stackUrl: v.optional(v.string()),
    prompts: v.optional(v.boolean()),
    rules: v.optional(v.boolean()),
    skills: v.optional(v.boolean()),
    mcps: v.optional(v.boolean()),
    resources: v.optional(v.array(v.object({ label: v.string(), url: v.string() }))),
    teamSize: v.optional(v.number()),
    toolSubscriptions: v.array(ToolSubscriptionInput),
    bundleSubscriptions: v.optional(v.array(BundleSubscriptionInput)),
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

    const baseSlug = `${creator.slug}-stack`
    let slug = baseSlug
    let suffix = 2
    while (
      await ctx.db
        .query('stacks')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .first()
    ) {
      slug = `${baseSlug}-${suffix}`
      suffix++
    }

    let fixedTotal = 0
    let hasUsageComponent = false
    for (const sub of args.toolSubscriptions) {
      if (sub.price.fixed) fixedTotal += sub.price.fixed.amount
      if (sub.price.pricingType === 'usage' || sub.price.pricingType === 'mixed') {
        hasUsageComponent = true
      }
    }
    if (args.bundleSubscriptions) {
      for (const bs of args.bundleSubscriptions) {
        const bundle = await ctx.db.get(bs.bundleId)
        if (!bundle) continue
        const tier = bundle.tiers.find((t) => t.tierId === bs.tierId)
        if (tier?.pricing.fixed) fixedTotal += tier.pricing.fixed.amount
        if (tier?.pricing.pricingType === 'usage' || tier?.pricing.pricingType === 'mixed') {
          hasUsageComponent = true
        }
      }
    }

    const now = Date.now()
    const id = await ctx.db.insert('stacks', {
      slug,
      creatorId: creator._id,
      oneLiner: args.oneLiner,
      description: args.description,
      stackUrl: args.stackUrl,
      prompts: args.prompts,
      rules: args.rules,
      skills: args.skills,
      mcps: args.mcps,
      resources: args.resources,
      teamSize: args.teamSize,
      toolSubscriptions: args.toolSubscriptions,
      bundleSubscriptions: args.bundleSubscriptions,
      fixedTotal: { currency: 'USD', amount: fixedTotal, period: 'month' as const },
      hasUsageComponent,
      published: args.published,
      createdAt: now,
      updatedAt: now,
    })

    return { _id: id, slug }
  },
})

export const update = mutation({
  args: {
    stackId: v.id('stacks'),
    oneLiner: v.optional(v.string()),
    description: v.optional(v.string()),
    stackUrl: v.optional(v.string()),
    prompts: v.optional(v.boolean()),
    rules: v.optional(v.boolean()),
    skills: v.optional(v.boolean()),
    mcps: v.optional(v.boolean()),
    resources: v.optional(v.array(v.object({ label: v.string(), url: v.string() }))),
    teamSize: v.optional(v.number()),
    toolSubscriptions: v.optional(v.array(ToolSubscriptionInput)),
    bundleSubscriptions: v.optional(v.array(BundleSubscriptionInput)),
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
    if (args.oneLiner !== undefined) patch.oneLiner = args.oneLiner
    if (args.description !== undefined) patch.description = args.description
    if (args.stackUrl !== undefined) patch.stackUrl = args.stackUrl
    if (args.prompts !== undefined) patch.prompts = args.prompts
    if (args.rules !== undefined) patch.rules = args.rules
    if (args.skills !== undefined) patch.skills = args.skills
    if (args.mcps !== undefined) patch.mcps = args.mcps
    if (args.resources !== undefined) patch.resources = args.resources
    if (args.teamSize !== undefined) patch.teamSize = args.teamSize
    if (args.toolSubscriptions !== undefined) patch.toolSubscriptions = args.toolSubscriptions
    if (args.bundleSubscriptions !== undefined) patch.bundleSubscriptions = args.bundleSubscriptions
    if (args.published !== undefined) patch.published = args.published

    const subs = args.toolSubscriptions ?? stack.toolSubscriptions
    let fixedTotal = 0
    let hasUsageComponent = false
    for (const sub of subs) {
      if (sub.price.fixed) fixedTotal += sub.price.fixed.amount
      if (sub.price.pricingType === 'usage' || sub.price.pricingType === 'mixed') {
        hasUsageComponent = true
      }
    }
    const bSubs = args.bundleSubscriptions ?? stack.bundleSubscriptions ?? []
    for (const bs of bSubs) {
      const bundle = await ctx.db.get(bs.bundleId)
      if (!bundle) continue
      const tier = bundle.tiers.find((t) => t.tierId === bs.tierId)
      if (tier?.pricing.fixed) fixedTotal += tier.pricing.fixed.amount
      if (tier?.pricing.pricingType === 'usage' || tier?.pricing.pricingType === 'mixed') {
        hasUsageComponent = true
      }
    }
    patch.fixedTotal = { currency: 'USD', amount: fixedTotal, period: 'month' as const }
    patch.hasUsageComponent = hasUsageComponent

    await ctx.db.patch(args.stackId, patch)
    return null
  },
})

export const getForEdit = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id('stacks'),
      slug: v.string(),
      oneLiner: v.string(),
      description: v.optional(v.string()),
      stackUrl: v.optional(v.string()),
      prompts: v.optional(v.boolean()),
      rules: v.optional(v.boolean()),
      skills: v.optional(v.boolean()),
      mcps: v.optional(v.boolean()),
      resources: v.optional(v.array(v.object({ label: v.string(), url: v.string() }))),
      teamSize: v.optional(v.number()),
      fixedTotal: v.optional(MoneyValidator),
      hasUsageComponent: v.boolean(),
      published: v.boolean(),
      toolSubscriptions: v.array(v.object({
        toolId: v.id('tools'),
        toolName: v.string(),
        toolSlug: v.string(),
        toolCategory: v.string(),
        toolIconUrl: v.optional(v.string()),
        tierId: v.optional(v.string()),
        kind: v.union(v.literal('main'), v.literal('misc')),
        primaryUsageLabel: v.string(),
        price: PriceValidator,
        priceKind: v.union(
          v.literal('regular'),
          v.literal('discounted'),
          v.literal('bundle'),
          v.literal('usage_based')
        ),
        bundleSlug: v.optional(v.string()),
        notes: v.optional(v.string()),
      })),
      bundleSubscriptions: v.array(v.object({
        bundleId: v.id('bundles'),
        bundleName: v.string(),
        bundleSlug: v.string(),
        tierId: v.string(),
        tierName: v.string(),
        notes: v.optional(v.string()),
      })),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) return null
    const userId = user.tokenIdentifier.split('|')[1]

    const stack = await ctx.db
      .query('stacks')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
    if (!stack) return null

    const creator = await ctx.db.get(stack.creatorId)
    if (!creator || creator.userId !== userId) return null

    const toolSubs = []
    for (const sub of stack.toolSubscriptions) {
      const tool = await ctx.db.get(sub.toolId)
      if (!tool) continue
      toolSubs.push({
        toolId: sub.toolId,
        toolName: tool.name,
        toolSlug: tool.slug,
        toolCategory: tool.category,
        toolIconUrl: tool.iconUrl,
        tierId: sub.tierId,
        kind: sub.kind,
        primaryUsageLabel: sub.primaryUsageLabel,
        price: sub.price,
        priceKind: sub.priceKind,
        bundleSlug: sub.bundleSlug,
        notes: sub.notes,
      })
    }

    const bundleSubs = []
    for (const bs of stack.bundleSubscriptions ?? []) {
      const bundle = await ctx.db.get(bs.bundleId)
      if (!bundle) continue
      const tier = bundle.tiers.find((t) => t.tierId === bs.tierId)
      bundleSubs.push({
        bundleId: bs.bundleId,
        bundleName: bundle.name,
        bundleSlug: bundle.slug,
        tierId: bs.tierId,
        tierName: tier?.name ?? bs.tierId,
        notes: bs.notes,
      })
    }

    return {
      _id: stack._id,
      slug: stack.slug,
      oneLiner: stack.oneLiner,
      description: stack.description,
      stackUrl: stack.stackUrl,
      prompts: stack.prompts,
      rules: stack.rules,
      skills: stack.skills,
      mcps: stack.mcps,
      resources: stack.resources,
      teamSize: stack.teamSize,
      fixedTotal: stack.fixedTotal,
      hasUsageComponent: stack.hasUsageComponent,
      published: stack.published,
      toolSubscriptions: toolSubs,
      bundleSubscriptions: bundleSubs,
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
      slug: stack.slug,
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

    for (const stack of stacks) {
      if (stack.fixedTotal?.amount) {
        totalCost += stack.fixedTotal.amount
        stacksWithCost++
      }
      for (const sub of stack.toolSubscriptions) {
        toolIds.add(sub.toolId)
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

    return { upvoted, count: upvotes.length }
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      _id: v.id('stacks'),
      _creationTime: v.number(),
      slug: v.string(),
      oneLiner: v.string(),
      description: v.optional(v.string()),
      stackUrl: v.optional(v.string()),
      prompts: v.optional(v.boolean()),
      rules: v.optional(v.boolean()),
      skills: v.optional(v.boolean()),
      mcps: v.optional(v.boolean()),
      resources: v.optional(v.array(v.object({ label: v.string(), url: v.string() }))),
      teamSize: v.optional(v.number()),
      fixedTotal: v.optional(MoneyValidator),
      hasUsageComponent: v.boolean(),
      usageTotalNotes: v.optional(v.string()),
      creator: CreatorValidator,
      tools: v.array(ToolValidator),
      bundles: v.array(BundleValidator),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const stack = await ctx.db
      .query('stacks')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()

    if (!stack || !stack.published) return null

    const creator = await ctx.db.get(stack.creatorId)
    if (!creator) return null

    const tools = []
    for (const sub of stack.toolSubscriptions) {
      const tool = await ctx.db.get(sub.toolId)
      if (!tool) continue
      tools.push({
        _id: tool._id,
        name: tool.name,
        slug: tool.slug,
        category: tool.category,
        iconUrl: tool.iconUrl,
        websiteUrl: tool.websiteUrl,
        price: sub.price,
        kind: sub.kind,
        primaryUsageLabel: sub.primaryUsageLabel,
        priceKind: sub.priceKind,
        bundleSlug: sub.bundleSlug,
        notes: sub.notes,
      })
    }

    const bundles = []
    for (const bs of stack.bundleSubscriptions ?? []) {
      const bundle = await ctx.db.get(bs.bundleId)
      if (!bundle) continue
      const tier = bundle.tiers.find((t) => t.tierId === bs.tierId)
      if (!tier) continue
      bundles.push({
        _id: bundle._id,
        name: bundle.name,
        slug: bundle.slug,
        description: bundle.description,
        iconUrl: bundle.iconUrl,
        websiteUrl: bundle.websiteUrl,
        tierId: bs.tierId,
        tierName: tier.name,
        price: tier.pricing,
        notes: bs.notes,
      })
    }

    return {
      _id: stack._id,
      _creationTime: stack._creationTime,
      slug: stack.slug,
      oneLiner: stack.oneLiner,
      description: stack.description,
      stackUrl: stack.stackUrl,
      prompts: stack.prompts,
      rules: stack.rules,
      skills: stack.skills,
      mcps: stack.mcps,
      resources: stack.resources,
      teamSize: stack.teamSize,
      fixedTotal: stack.fixedTotal,
      hasUsageComponent: stack.hasUsageComponent,
      usageTotalNotes: stack.usageTotalNotes,
      creator: {
        _id: creator._id,
        name: creator.name,
        xHandle: creator.xHandle,
        avatarUrl: creator.avatarUrl,
        verified: creator.verified,
        personalPages: creator.personalPages,
        projectPages: creator.projectPages,
      },
      tools,
      bundles,
    }
  },
})
