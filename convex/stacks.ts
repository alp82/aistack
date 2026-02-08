import { query } from './_generated/server'
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
