import { v } from 'convex/values'
import { validateHandle } from '../src/lib/handle'
import type { QueryCtx } from './_generated/server'
import { mutation, query } from './_generated/server'
import { assertValidPersonalPageUrl } from './lib/iconUrl'
import { resolveCreatorAvatarUrl } from './lib/avatar'
import { calculateStackPricing } from './stacks'
import type { Doc } from './_generated/dataModel'

async function getCallerCreator(ctx: QueryCtx): Promise<Doc<'creators'> | null> {
  const user = await ctx.auth.getUserIdentity()
  if (!user) return null
  const userId = user.tokenIdentifier.split('|')[1]
  return await ctx.db
    .query('creators')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .first()
}

const StackCardValidator = v.object({
  _id: v.id('stacks'),
  name: v.string(),
  slug: v.string(),
  oneLiner: v.string(),
  published: v.boolean(),
  updatedAt: v.number(),
  fixedTotal: v.object({
    currency: v.string(),
    amount: v.number(),
    period: v.union(v.literal('month'), v.literal('year'), v.literal('one_time')),
  }),
  hasUsageComponent: v.boolean(),
  toolCount: v.number(),
  modelCount: v.number(),
  upvoteCount: v.number(),
})

/** Shape a stack row into the profile-page card payload (live cost recompute). */
async function toStackCard(ctx: QueryCtx, stack: Doc<'stacks'>) {
  const pricing = await calculateStackPricing(
    ctx,
    stack.toolSubscriptions,
    stack.bundleSubscriptions ?? [],
  )
  const upvotes = await ctx.db
    .query('stackUpvotes')
    .withIndex('by_stackId', (q) => q.eq('stackId', stack._id))
    .collect()
  return {
    _id: stack._id,
    name: stack.name,
    slug: `${stack.slug}-${stack.shortId}`,
    oneLiner: stack.oneLiner,
    published: stack.published,
    updatedAt: stack.updatedAt,
    fixedTotal: pricing.fixedTotal,
    hasUsageComponent: pricing.hasUsageComponent,
    toolCount: stack.toolSubscriptions.length,
    modelCount: (stack.modelSubscriptions ?? []).length,
    upvoteCount: upvotes.length,
  }
}

export const getOrCreateForUser = mutation({
  args: {
    imageUrl: v.optional(v.string()),
  },
  returns: v.object({
    _id: v.id('creators'),
    name: v.string(),
    slug: v.string(),
    xHandle: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id('_storage')),
    verified: v.boolean(),
    personalPages: v.array(v.object({ name: v.string(), url: v.string() })),
    projectPages: v.array(v.object({ name: v.string(), url: v.string() })),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) throw new Error('Not authenticated')
    const userId = user.tokenIdentifier.split('|')[1]

    const existing = await ctx.db
      .query('creators')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first()

    if (existing) {
      // Backfill avatarUrl from Google profile pic if not yet set
      if (!existing.avatarUrl && args.imageUrl) {
        await ctx.db.patch(existing._id, { avatarUrl: args.imageUrl })
      }

      return {
        _id: existing._id,
        name: existing.name,
        slug: existing.slug,
        xHandle: existing.xHandle,
        avatarUrl: existing.avatarUrl || args.imageUrl,
        avatarStorageId: existing.avatarStorageId,
        verified: existing.verified,
        personalPages: existing.personalPages,
        projectPages: existing.projectPages,
      }
    }

    const name = user.name ?? 'Anonymous'
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    let slug = baseSlug
    let suffix = 2
    while (
      await ctx.db
        .query('creators')
        .withIndex('by_slug', (q) => q.eq('slug', slug))
        .first()
    ) {
      slug = `${baseSlug}-${suffix}`
      suffix++
    }

    const avatarUrl = args.imageUrl ?? undefined

    const id = await ctx.db.insert('creators', {
      name,
      slug,
      userId,
      avatarUrl,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    })

    return {
      _id: id,
      name,
      slug,
      xHandle: undefined,
      avatarUrl,
      avatarStorageId: undefined,
      verified: false,
      personalPages: [],
      projectPages: [],
    }
  },
})

/**
 * Single write path for the profile editor. Every arg is optional — only the
 * provided fields are patched. The handle is validated only when it actually
 * changes, so grandfathered legacy slugs (short, pre-format) never brick
 * unrelated profile edits.
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    handle: v.optional(v.string()),
    bio: v.optional(v.string()),
    xHandle: v.optional(v.string()),
    personalPages: v.optional(
      v.array(v.object({ name: v.string(), url: v.string() })),
    ),
    avatarStorageId: v.optional(v.union(v.id('_storage'), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const creator = await getCallerCreator(ctx)
    if (!creator) throw new Error('Creator not found')

    const patch: Record<string, unknown> = {}

    if (args.handle !== undefined && args.handle !== creator.slug) {
      const formatError = validateHandle(args.handle)
      if (formatError) throw new Error(formatError)
      const taken = await ctx.db
        .query('creators')
        .withIndex('by_slug', (q) => q.eq('slug', args.handle as string))
        .first()
      if (taken && taken._id !== creator._id) {
        throw new Error('Handle is already taken')
      }
      patch.slug = args.handle
    }

    if (args.personalPages !== undefined) {
      for (const page of args.personalPages) {
        assertValidPersonalPageUrl(page.url)
      }
      patch.personalPages = args.personalPages
    }

    if (args.name !== undefined) patch.name = args.name.trim() || creator.name
    if (args.bio !== undefined) patch.bio = args.bio.trim() || undefined
    if (args.xHandle !== undefined)
      patch.xHandle = args.xHandle.trim() || undefined
    if (args.avatarStorageId !== undefined)
      patch.avatarStorageId =
        args.avatarStorageId === null ? undefined : args.avatarStorageId

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(creator._id, patch)
    }
    return null
  },
})

/**
 * Land a guest-staged avatar on the creator after sign-in. Skip-if-set: a
 * returning user's deliberate profile avatar is never clobbered by an old
 * logged-out draft (mirrors the migration's rule).
 */
export const landStagedAvatar = mutation({
  args: { storageId: v.id('_storage') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const creator = await getCallerCreator(ctx)
    if (!creator) throw new Error('Creator not found')
    if (!creator.avatarStorageId) {
      await ctx.db.patch(creator._id, { avatarStorageId: args.storageId })
    }
    return null
  },
})

/**
 * Public profile payload for `/@handle`. Auth-independent — the SSR prefetch
 * runs unauthenticated, so this never varies by viewer (owner state lives in
 * the client-only `getOwnProfileView`, mirroring the stacks.$slug precedent).
 * Published stacks only, most-recent first.
 */
export const getByHandle = query({
  args: { handle: v.string() },
  returns: v.union(
    v.object({
      profile: v.object({
        _id: v.id('creators'),
        name: v.string(),
        handle: v.string(),
        bio: v.optional(v.string()),
        xHandle: v.optional(v.string()),
        verified: v.boolean(),
        personalPages: v.array(v.object({ name: v.string(), url: v.string() })),
        avatarUrl: v.optional(v.string()),
        joinedAt: v.number(),
      }),
      stacks: v.array(StackCardValidator),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const creator = await ctx.db
      .query('creators')
      .withIndex('by_slug', (q) => q.eq('slug', args.handle))
      .first()
    if (!creator) return null

    const allStacks = await ctx.db
      .query('stacks')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creator._id))
      .collect()
    const published = allStacks
      .filter((s) => s.published)
      .sort((a, b) => b.updatedAt - a.updatedAt)
    const stacks = await Promise.all(published.map((s) => toStackCard(ctx, s)))

    return {
      profile: {
        _id: creator._id,
        name: creator.name,
        handle: creator.slug,
        bio: creator.bio,
        xHandle: creator.xHandle,
        verified: creator.verified,
        personalPages: creator.personalPages,
        avatarUrl: await resolveCreatorAvatarUrl(ctx, creator),
        joinedAt: creator.createdAt,
      },
      stacks,
    }
  },
})

/**
 * Owner-only companion to `getByHandle` (client-only query): returns the
 * caller's draft stacks for their own profile, null for everyone else.
 */
export const getOwnProfileView = query({
  args: { handle: v.string() },
  returns: v.union(
    v.object({
      isOwner: v.literal(true),
      draftStacks: v.array(StackCardValidator),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const caller = await getCallerCreator(ctx)
    if (!caller || caller.slug !== args.handle) return null

    const allStacks = await ctx.db
      .query('stacks')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', caller._id))
      .collect()
    const drafts = allStacks
      .filter((s) => !s.published)
      .sort((a, b) => b.updatedAt - a.updatedAt)
    const draftStacks = await Promise.all(drafts.map((s) => toStackCard(ctx, s)))

    return { isOwner: true as const, draftStacks }
  },
})

/**
 * Live availability feedback for the profile editor's handle input. Excludes
 * the caller's own creator row, so your current handle always reads available
 * — even a grandfathered one that would fail today's format rules.
 */
export const checkHandle = query({
  args: { handle: v.string() },
  returns: v.object({
    available: v.boolean(),
    reason: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const caller = await getCallerCreator(ctx)
    if (caller && caller.slug === args.handle) {
      return { available: true, reason: null }
    }

    const formatError = validateHandle(args.handle)
    if (formatError) return { available: false, reason: formatError }

    const existing = await ctx.db
      .query('creators')
      .withIndex('by_slug', (q) => q.eq('slug', args.handle))
      .first()
    if (existing && existing._id !== caller?._id) {
      return { available: false, reason: 'Handle is already taken' }
    }
    return { available: true, reason: null }
  },
})

/**
 * The caller's own lightweight identity — the single replacement for the
 * retired one-stack-per-creator lookup in every "your stack" affordance.
 */
export const getMe = query({
  args: {},
  returns: v.union(
    v.object({
      handle: v.string(),
      name: v.string(),
      avatarUrl: v.optional(v.string()),
      hasStack: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const creator = await getCallerCreator(ctx)
    if (!creator) return null

    const anyStack = await ctx.db
      .query('stacks')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creator._id))
      .first()

    return {
      handle: creator.slug,
      name: creator.name,
      avatarUrl: await resolveCreatorAvatarUrl(ctx, creator),
      hasStack: anyStack !== null,
    }
  },
})
