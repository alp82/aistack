import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import type { MutationCtx, QueryCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { type FixedPrice, orderToolsForDisplay, sumNormalizedMonthlyAmounts } from '../src/lib/pricing'
import { slugifyAscii } from '../src/lib/slug'
import { generateUniqueShortId, extractShortId } from './lib/ids'
import { Resource as ResourceValidator, ResourceInput } from './schema'
import { resolveLinkedResources, upsertResourcesForOwner } from './lib/resourceLinks'
import { normalizeProjectUrl } from './projects'
import { assertValidAccentPreset } from './lib/iconUrl'
import { resolveCreatorAvatarUrl } from './lib/avatar'
import { diffComposition, emitActivityEvent } from './activity'

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

export async function calculateStackPricing(
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
  handle: v.string(),
  xHandle: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  verified: v.boolean(),
  personalPages: v.array(v.object({ name: v.string(), url: v.string() })),
  projectPages: v.array(v.object({ name: v.string(), url: v.string() })),
})

/**
 * The signed-in creator's own stacks, published or not.
 *
 * Added for the CLI approval page's stack selector (#38): binding the sync
 * target at link time (#33 decision 7) requires the user to see and pick from
 * their stacks. Returns [] rather than throwing when signed out, so the page can
 * render its own auth redirect without a query error first.
 */
export const listMine = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('stacks'),
      name: v.string(),
      slug: v.string(),
      shortId: v.string(),
      published: v.boolean(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) return []
    const userId = user.tokenIdentifier.split('|')[1]

    const creator = await ctx.db
      .query('creators')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first()
    if (!creator) return []

    const stacks = await ctx.db
      .query('stacks')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creator._id))
      .collect()

    return stacks
      .map((s) => ({
        _id: s._id,
        name: s.name,
        slug: s.slug,
        shortId: s.shortId,
        published: s.published,
        updatedAt: s.updatedAt,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt)
  },
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

      creator: CreatorValidator,
      tools: v.array(ToolValidator),
      upvoteCount: v.number(),
      isLowQuality: v.optional(v.boolean()),
      // Newest activity of ANY kind: authored edits (stack.updatedAt) or a
      // measured sync (snapshot receivedAt - server clock, since capturedAt is
      // client-controlled). Syncs never bump stack.updatedAt, so the merge
      // happens here.
      updatedAt: v.number(),
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

        const resolvedAvatar = await resolveCreatorAvatarUrl(ctx, creator)

        const latestSnapshot = await ctx.db
          .query('measuredSnapshots')
          .withIndex('by_stack_capturedAt', (q) => q.eq('stackId', stack._id))
          .order('desc')
          .first()

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

          creator: {
            _id: creator._id,
            name: creator.name,
            handle: creator.slug,
            xHandle: creator.xHandle,
            avatarUrl: resolvedAvatar,
            verified: creator.verified,
            personalPages: creator.personalPages,
            projectPages: creator.projectPages,
          },
          tools,
          upvoteCount: upvotes.length,
          isLowQuality: stack.isLowQuality,
          updatedAt: Math.max(stack.updatedAt, latestSnapshot?.receivedAt ?? 0),
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

const ProjectInput = v.object({
  name: v.string(),
  description: v.optional(v.string()),
  url: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
})

/**
 * Insert staged (web-authored) project rows for a freshly created stack.
 * Mirrors projects.createProject's row shape; no `order` field so listByStack
 * falls back to createdAt ordering (parity with the view-page create path).
 */
async function insertProjectsForStack(
  ctx: MutationCtx,
  args: {
    creatorId: Id<'creators'>
    stackId: Id<'stacks'>
    items: Array<{
      name: string
      description?: string
      url?: string
      tags?: string[]
    }>
  },
) {
  const now = Date.now()
  const shortIds = await Promise.all(
    args.items.map(() => generateUniqueShortId(ctx, 'projects'))
  )
  for (let i = 0; i < args.items.length; i++) {
    const item = args.items[i]
    const slug = slugifyAscii(item.name, 'project')
    await ctx.db.insert('projects', {
      name: item.name,
      slug,
      shortId: shortIds[i],
      creatorId: args.creatorId,
      stackId: args.stackId,
      description: item.description,
      url: normalizeProjectUrl(item.url),
      tags: item.tags,
      createdAt: now,
      updatedAt: now,
    })
  }
}

export const create = mutation({
  args: {
    name: v.string(),
    oneLiner: v.string(),
    description: v.optional(v.string()),
    resources: v.optional(v.array(ResourceInput)),
    teamSize: v.optional(v.number()),
    toolSubscriptions: v.array(ToolSubscriptionInput),
    bundleSubscriptions: v.optional(v.array(BundleSubscriptionInput)),
    modelSubscriptions: v.optional(v.array(ModelSubscriptionInput)),
    accentPreset: v.optional(v.string()),
    projects: v.optional(v.array(ProjectInput)),
    published: v.boolean(),
  },
  returns: v.object({ _id: v.id('stacks'), slug: v.string() }),
  handler: async (ctx, args) => {
    if (args.accentPreset) assertValidAccentPreset(args.accentPreset)
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]

    const creator = await ctx.db
      .query('creators')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first()
    if (!creator) throw new Error('Creator profile not found. Create one first.')

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
      teamSize: args.teamSize,
      toolSubscriptions: args.toolSubscriptions,
      bundleSubscriptions: args.bundleSubscriptions,
      modelSubscriptions: args.modelSubscriptions,
      accentPreset: args.accentPreset,
      fixedTotal: pricing.fixedTotal,
      hasUsageComponent: pricing.hasUsageComponent,
      published: args.published,
      createdAt: now,
      updatedAt: now,
    })

    // `stack.published` fires from create as well as update: this mutation takes
    // `published` as an argument and writes it directly, so stacks are NOT
    // always created as drafts and a flip-only fire point would miss every
    // stack created public (#77).
    if (args.published) {
      await emitActivityEvent(
        ctx,
        id,
        { type: 'stack.published', toolCount: args.toolSubscriptions.length },
        now,
      )
    }

    if (args.resources !== undefined) {
      await upsertResourcesForOwner(ctx, {
        addedBy: creator._id,
        ownerKind: 'stack',
        ownerId: id,
        items: args.resources,
      })
    }

    if (args.projects !== undefined) {
      await insertProjectsForStack(ctx, {
        creatorId: creator._id,
        stackId: id,
        items: args.projects,
      })
    }

    return { _id: id, slug: `${slug}-${shortId}` }
  },
})

export const update = mutation({
  args: {
    stackId: v.id('stacks'),
    name: v.optional(v.string()),
    oneLiner: v.optional(v.string()),
    description: v.optional(v.string()),
    resources: v.optional(v.array(ResourceInput)),
    teamSize: v.optional(v.union(v.number(), v.null())),
    toolSubscriptions: v.optional(v.array(ToolSubscriptionInput)),
    bundleSubscriptions: v.optional(v.array(BundleSubscriptionInput)),
    modelSubscriptions: v.optional(v.array(ModelSubscriptionInput)),
    accentPreset: v.optional(v.string()),
    published: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.accentPreset) assertValidAccentPreset(args.accentPreset)
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
    if (args.accentPreset !== undefined) patch.accentPreset = args.accentPreset || undefined
    if (args.published !== undefined) patch.published = args.published

    const subs = args.toolSubscriptions ?? stack.toolSubscriptions
    const bSubs = args.bundleSubscriptions ?? stack.bundleSubscriptions ?? []
    const pricing = await calculateStackPricing(ctx, subs, bSubs)
    patch.fixedTotal = pricing.fixedTotal
    patch.hasUsageComponent = pricing.hasUsageComponent

    await ctx.db.patch(args.stackId, patch)

    // THE DRAFT GATE READS RESULTING STATE, not the pre-mutation value (#77).
    // Reading the old value has a live bug: one update that changes composition
    // and sets `published: false` would write an event the reader hides, and a
    // republish months later would surface that stale event as current public
    // activity.
    const willBePublished = args.published ?? stack.published
    if (willBePublished) {
      if (!stack.published) {
        // Publishing a draft emits ONLY this, even when the same call also
        // changed composition. The publish already tells the reader everything.
        await emitActivityEvent(ctx, args.stackId, {
          type: 'stack.published',
          toolCount: subs.length,
        })
      } else {
        // Composition only - a tool, model or bundle added or removed. Prose
        // edits are excluded, which keeps authoring noise out of a feed that
        // will be thin at launch.
        const { added, removed } = await diffComposition(
          ctx,
          stack,
          {
            toolSubscriptions: subs,
            modelSubscriptions: args.modelSubscriptions ?? stack.modelSubscriptions,
            bundleSubscriptions: bSubs,
          },
        )
        if (added.length > 0 || removed.length > 0) {
          await emitActivityEvent(ctx, args.stackId, {
            type: 'stack.composition_changed',
            added,
            removed,
          })
        }
      }
    }

    if (args.resources !== undefined) {
      await upsertResourcesForOwner(ctx, {
        addedBy: stack.creatorId,
        ownerKind: 'stack',
        ownerId: args.stackId,
        items: args.resources,
      })
    }

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
      resources: v.optional(v.array(ResourceValidator)),
      teamSize: v.optional(v.number()),
      fixedTotal: v.optional(MoneyValidator),
      hasUsageComponent: v.boolean(),
      published: v.boolean(),
      publishCost: v.optional(v.boolean()),
      accentPreset: v.optional(v.string()),

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
    const resources = await resolveLinkedResources(ctx, 'stack', stack._id)

    return {
      _id: stack._id,
      name: stack.name,
      slug: `${stack.slug}-${stack.shortId}`,
      oneLiner: stack.oneLiner,
      description: stack.description,
      resources,
      teamSize: stack.teamSize,
      fixedTotal: pricing.fixedTotal,
      hasUsageComponent: pricing.hasUsageComponent,
      published: stack.published,
      // Carried so `stack_published` can report it (#77). Absent reads as opted
      // IN - the field only ever records a refusal.
      publishCost: stack.publishCost,
      accentPreset: stack.accentPreset,
      toolSubscriptions: toolSubs,
      bundleSubscriptions: bundleSubs,
      modelSubscriptions: modelSubs,
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

    let upvoted: boolean
    if (existing) {
      await ctx.db.delete(existing._id)
      upvoted = false
    } else {
      await ctx.db.insert('stackUpvotes', {
        stackId: args.stackId,
        userId,
        createdAt: Date.now(),
      })
      upvoted = true
    }

    const remaining = await ctx.db
      .query('stackUpvotes')
      .withIndex('by_stackId', (q) => q.eq('stackId', args.stackId))
      .collect()
    return { upvoted, count: remaining.length }
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
    currentUserId: v.union(v.string(), v.null()),
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

    return { upvoted, count: upvotes.length, isOwner, currentUserId: userId }
  },
})

export const getUpvoters = query({
  args: { stackId: v.id('stacks') },
  returns: v.object({
    totalCount: v.number(),
    upvoters: v.array(v.object({
      userId: v.string(),
      name: v.string(),
      avatarUrl: v.union(v.string(), v.null()),
    })),
  }),
  handler: async (ctx, args) => {
    const allUpvotes = await ctx.db
      .query('stackUpvotes')
      .withIndex('by_stackId', (q) => q.eq('stackId', args.stackId))
      .collect()
    const totalCount = allUpvotes.length
    if (totalCount === 0) return { totalCount: 0, upvoters: [] }
    const top = await ctx.db
      .query('stackUpvotes')
      .withIndex('by_stackId_createdAt', (q) => q.eq('stackId', args.stackId))
      .order('desc')
      .take(30)
    const resolved = await Promise.all(
      top.map(async (u) => {
        const creator = await ctx.db
          .query('creators')
          .withIndex('by_userId', (q) => q.eq('userId', u.userId))
          .first()
        if (!creator) return null
        return {
          userId: u.userId,
          name: creator.name,
          avatarUrl: creator.avatarUrl ?? null,
        }
      }),
    )
    const upvoters = resolved.filter((x): x is NonNullable<typeof x> => x !== null).slice(0, 10)
    return { totalCount, upvoters }
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
      resources: v.optional(v.array(ResourceValidator)),
      teamSize: v.optional(v.number()),
      fixedTotal: v.optional(MoneyValidator),
      hasUsageComponent: v.boolean(),
      usageTotalNotes: v.optional(v.string()),
      accentPreset: v.optional(v.string()),

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
    const resources = await resolveLinkedResources(ctx, 'stack', stack._id)
    const resolvedAvatar = await resolveCreatorAvatarUrl(ctx, creator)

    return {
      _id: stack._id,
      _creationTime: stack._creationTime,
      updatedAt: stack.updatedAt ?? stack._creationTime,
      name: stack.name,
      slug: `${stack.slug}-${stack.shortId}`,
      oneLiner: stack.oneLiner,
      description: stack.description,
      resources,
      teamSize: stack.teamSize,
      fixedTotal: pricing.fixedTotal,
      hasUsageComponent: pricing.hasUsageComponent,
      usageTotalNotes: stack.usageTotalNotes,
      accentPreset: stack.accentPreset,
      creator: {
        _id: creator._id,
        name: creator.name,
        handle: creator.slug,
        xHandle: creator.xHandle,
        avatarUrl: resolvedAvatar,
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

export const getPublicSummary = query({
  args: { slug: v.string() },
  returns: v.union(
    v.object({
      slug: v.string(),
      name: v.string(),
      monthlyCost: MoneyValidator,
      toolCount: v.number(),
      bundleCount: v.number(),
      modelCount: v.number(),
      upvoteCount: v.number(),
      tools: v.array(v.string()),
      models: v.array(v.string()),
      bundles: v.array(v.string()),
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

    const pricing = await calculateStackPricing(ctx, stack.toolSubscriptions, stack.bundleSubscriptions ?? [])

    async function resolveNames<T>(
      items: T[],
      fetchName: (item: T) => Promise<string | null>,
    ): Promise<string[]> {
      const names = await Promise.all(items.map(fetchName))
      return names.filter((name): name is string => name !== null)
    }

    const toolEntries = await Promise.all(
      stack.toolSubscriptions.map(async (sub) => {
        const tool = await ctx.db
          .query('tools')
          .withIndex('by_slug', (q) => q.eq('slug', sub.toolSlug))
          .first()
        if (!tool) return null
        const tier = sub.tierId ? tool.tiers.find((t) => t.tierId === sub.tierId) : undefined
        return {
          name: tool.name,
          kind: sub.kind,
          priceKind: sub.priceKind,
          price: sub.price,
          originalTierPrice: tier?.pricing.fixed,
        }
      })
    )
    const tools = orderToolsForDisplay(
      toolEntries.filter((t): t is NonNullable<typeof t> => t !== null),
    ).map((t) => t.name)

    const models = await resolveNames(stack.modelSubscriptions ?? [], async (ms) => {
      const model = await ctx.db
        .query('models')
        .withIndex('by_slug', (q) => q.eq('slug', ms.modelSlug))
        .first()
      return model?.name ?? null
    })

    const bundles = await resolveNames(stack.bundleSubscriptions ?? [], async (bs) => {
      const bundle = await ctx.db
        .query('bundles')
        .withIndex('by_slug', (q) => q.eq('slug', bs.bundleSlug))
        .first()
      return bundle?.name ?? null
    })

    const upvotes = await ctx.db
      .query('stackUpvotes')
      .withIndex('by_stackId', (q) => q.eq('stackId', stack._id))
      .collect()

    return {
      slug: `${stack.slug}-${stack.shortId}`,
      name: stack.name,
      monthlyCost: pricing.fixedTotal,
      toolCount: tools.length,
      bundleCount: bundles.length,
      modelCount: models.length,
      upvoteCount: upvotes.length,
      tools,
      models,
      bundles,
    }
  },
})
