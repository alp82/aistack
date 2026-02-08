import { query } from './_generated/server'
import { v } from 'convex/values'

export const listPublished = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('stacks'),
      _creationTime: v.number(),
      slug: v.string(),
      title: v.string(),
      summary: v.string(),
      teamSize: v.optional(v.number()),
      fixedTotal: v.optional(
        v.object({
          currency: v.string(),
          amount: v.number(),
          period: v.union(v.literal('month'), v.literal('year'), v.literal('one_time')),
        })
      ),
      hasUsageComponent: v.boolean(),
      usageTotalNotes: v.optional(v.string()),
      creator: v.object({
        _id: v.id('creators'),
        name: v.string(),
        xHandle: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        personalPages: v.array(v.object({ name: v.string(), url: v.string() })),
        projectPages: v.array(v.object({ name: v.string(), url: v.string() })),
      }),
      tools: v.array(
        v.object({
          _id: v.id('tools'),
          name: v.string(),
          slug: v.string(),
          category: v.string(),
          iconUrl: v.optional(v.string()),
          price: v.object({
            pricingType: v.union(v.literal('fixed'), v.literal('usage'), v.literal('mixed')),
            fixed: v.optional(
              v.object({
                currency: v.string(),
                amount: v.number(),
                period: v.union(v.literal('month'), v.literal('year'), v.literal('one_time')),
              })
            ),
          }),
          primaryUsageLabel: v.string(),
        })
      ),
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
          price: sub.price,
          primaryUsageLabel: sub.primaryUsageLabel,
        })
      }

      results.push({
        _id: stack._id,
        _creationTime: stack._creationTime,
        slug: stack.slug,
        title: stack.title,
        summary: stack.summary,
        teamSize: stack.teamSize,
        fixedTotal: stack.fixedTotal,
        hasUsageComponent: stack.hasUsageComponent,
        usageTotalNotes: stack.usageTotalNotes,
        creator: {
          _id: creator._id,
          name: creator.name,
          xHandle: creator.xHandle,
          avatarUrl: creator.avatarUrl,
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
      title: v.string(),
      summary: v.string(),
      teamSize: v.optional(v.number()),
      fixedTotal: v.optional(
        v.object({
          currency: v.string(),
          amount: v.number(),
          period: v.union(v.literal('month'), v.literal('year'), v.literal('one_time')),
        })
      ),
      hasUsageComponent: v.boolean(),
      usageTotalNotes: v.optional(v.string()),
      creator: v.object({
        _id: v.id('creators'),
        name: v.string(),
        xHandle: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        verified: v.boolean(),
        bio: v.optional(v.string()),
        personalPages: v.array(v.object({ name: v.string(), url: v.string() })),
        projectPages: v.array(v.object({ name: v.string(), url: v.string() })),
      }),
      tools: v.array(
        v.object({
          _id: v.id('tools'),
          name: v.string(),
          slug: v.string(),
          category: v.string(),
          iconUrl: v.optional(v.string()),
          websiteUrl: v.optional(v.string()),
          price: v.object({
            pricingType: v.union(v.literal('fixed'), v.literal('usage'), v.literal('mixed')),
            fixed: v.optional(
              v.object({
                currency: v.string(),
                amount: v.number(),
                period: v.union(v.literal('month'), v.literal('year'), v.literal('one_time')),
              })
            ),
          }),
          primaryUsageLabel: v.string(),
          priceKind: v.union(
            v.literal('regular'),
            v.literal('discounted'),
            v.literal('bundle'),
            v.literal('usage_based')
          ),
          notes: v.optional(v.string()),
        })
      ),
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
        primaryUsageLabel: sub.primaryUsageLabel,
        priceKind: sub.priceKind,
        notes: sub.notes,
      })
    }


    return {
      _id: stack._id,
      _creationTime: stack._creationTime,
      slug: stack.slug,
      title: stack.title,
      summary: stack.summary,
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
        bio: creator.bio,
        personalPages: creator.personalPages,
        projectPages: creator.projectPages,
      },
      tools,
    }
  },
})
