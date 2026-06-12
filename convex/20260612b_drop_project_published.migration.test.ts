/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'

// ---------------------------------------------------------------------------
// INLINE LEGACY SCHEMA
//
// The production schema will narrow after the implementation lands (projects
// loses the `published` field). The test seeds LEGACY-shaped rows with
// `published: v.optional(v.boolean())` so it can verify the migration
// transforms them. We must NOT import the production schema here.
// ---------------------------------------------------------------------------

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
    v.literal('one_time'),
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
    v.literal('mixed'),
  ),
  fixed: v.optional(Money),
  usage: v.optional(UsagePricing),
})

const legacySchema = defineSchema({
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

  stacks: defineTable({
    name: v.string(),
    slug: v.string(),
    shortId: v.string(),
    creatorId: v.id('creators'),
    teamSize: v.optional(v.number()),
    oneLiner: v.string(),
    description: v.optional(v.string()),
    stackImageUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id('_storage')),
    personalPageUrl: v.optional(v.string()),
    toolSubscriptions: v.array(
      v.object({
        toolSlug: v.string(),
        tierId: v.optional(v.string()),
        kind: v.union(v.literal('main'), v.literal('misc')),
        primaryUsageLabel: v.string(),
        price: TierPricing,
        priceKind: v.union(
          v.literal('regular'),
          v.literal('discounted'),
          v.literal('bundle'),
          v.literal('usage_based'),
          v.literal('sponsored'),
        ),
        bundleSlug: v.optional(v.string()),
        description: v.optional(v.string()),
      }),
    ),
    hasUsageComponent: v.boolean(),
    published: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_shortId', ['shortId'])
    .index('by_creatorId', ['creatorId'])
    .index('by_published', ['published']),

  // LEGACY projects table: published is OPTIONAL here — this models the
  // Deploy-A intermediate state where the schema has already made published
  // optional (so patch({ published: undefined }) is accepted) but the narrowed
  // Deploy-B schema (published removed entirely) has not yet been pushed.
  projects: defineTable({
    name: v.string(),
    slug: v.string(),
    shortId: v.string(),
    creatorId: v.id('creators'),
    stackId: v.id('stacks'),
    source: v.optional(v.string()),
    description: v.optional(v.string()),
    url: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    order: v.optional(v.number()),
    cloneCount: v.optional(v.number()),
    published: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_shortId', ['shortId'])
    .index('by_creatorId', ['creatorId'])
    .index('by_stackId', ['stackId']),

})

// Modules glob: from convex/ root use './**/*.{js,ts}'
const modules = import.meta.glob('./**/*.{js,ts}')

// ---------------------------------------------------------------------------
// TC-NEW-MIG2-01: mixed rows — first run returns correct counts, all cleared
// ---------------------------------------------------------------------------

test('TC-NEW-MIG2-01: mixed rows (published true/false/omitted) → { publishedCleared: 2, draftsRevealed: 1 }; all rows have published undefined after', async () => {
  const t = convexTest(legacySchema, modules)

  const { publishedId, draftId, omittedId } = await t.run(async (ctx) => {
    const now = Date.now()

    const creatorId = await ctx.db.insert('creators', {
      name: 'Test Creator MIG2-01',
      slug: 'test-creator-mig2-01',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: now,
    })

    const stackId = await ctx.db.insert('stacks', {
      name: 'Test Stack MIG2-01',
      slug: 'test-stack-mig2-01',
      shortId: 'MG201',
      creatorId,
      oneLiner: 'test',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: false,
      createdAt: now,
      updatedAt: now,
    })

    // Row 1: published:true — should be patched, draftsRevealed NOT incremented
    const publishedId = await ctx.db.insert('projects', {
      name: 'Published Project',
      slug: 'published-project-mig2-01',
      shortId: 'PP201',
      creatorId,
      stackId,
      published: true,
      createdAt: now,
      updatedAt: now,
    })

    // Row 2: published:false — should be patched, draftsRevealed incremented
    const draftId = await ctx.db.insert('projects', {
      name: 'Draft Project',
      slug: 'draft-project-mig2-01',
      shortId: 'DP201',
      creatorId,
      stackId,
      published: false,
      createdAt: now,
      updatedAt: now,
    })

    // Row 3: published omitted — should be SKIPPED (already undefined)
    const omittedId = await ctx.db.insert('projects', {
      name: 'No Published Field',
      slug: 'no-published-field-mig2-01',
      shortId: 'NP201',
      creatorId,
      stackId,
      createdAt: now,
      updatedAt: now,
    })

    return { publishedId, draftId, omittedId }
  })

  const result = await t.mutation(
    internal.migrations['20260612b_drop_project_published'].run,
    {},
  )

  expect(result.publishedCleared).toBe(2)
  expect(result.draftsRevealed).toBe(1)

  // All three rows must have published === undefined after the migration
  const publishedRow = await t.run(async (ctx) => ctx.db.get(publishedId))
  const draftRow = await t.run(async (ctx) => ctx.db.get(draftId))
  const omittedRow = await t.run(async (ctx) => ctx.db.get(omittedId))

  expect((publishedRow as Record<string, unknown> | null)?.published).toBeUndefined()
  expect((draftRow as Record<string, unknown> | null)?.published).toBeUndefined()
  expect((omittedRow as Record<string, unknown> | null)?.published).toBeUndefined()
})

// ---------------------------------------------------------------------------
// TC-NEW-MIG2-02: idempotency — second run returns { publishedCleared: 0, draftsRevealed: 0 }
// ---------------------------------------------------------------------------

test('TC-NEW-MIG2-02: idempotency — second run returns { publishedCleared: 0, draftsRevealed: 0 }', async () => {
  const t = convexTest(legacySchema, modules)

  await t.run(async (ctx) => {
    const now = Date.now()

    const creatorId = await ctx.db.insert('creators', {
      name: 'Test Creator MIG2-02',
      slug: 'test-creator-mig2-02',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: now,
    })

    const stackId = await ctx.db.insert('stacks', {
      name: 'Test Stack MIG2-02',
      slug: 'test-stack-mig2-02',
      shortId: 'MG202',
      creatorId,
      oneLiner: 'test',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: false,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.insert('projects', {
      name: 'Published',
      slug: 'published-mig2-02',
      shortId: 'PB202',
      creatorId,
      stackId,
      published: true,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.insert('projects', {
      name: 'Draft',
      slug: 'draft-mig2-02',
      shortId: 'DR202',
      creatorId,
      stackId,
      published: false,
      createdAt: now,
      updatedAt: now,
    })
  })

  // First run
  await t.mutation(
    internal.migrations['20260612b_drop_project_published'].run,
    {},
  )

  // Second run must return zeroes
  const second = await t.mutation(
    internal.migrations['20260612b_drop_project_published'].run,
    {},
  )

  expect(second.publishedCleared).toBe(0)
  expect(second.draftsRevealed).toBe(0)
})

// ---------------------------------------------------------------------------
// TC-NEW-MIG2-03: all-drafts — 3 rows published:false → { publishedCleared: 3, draftsRevealed: 3 }
// ---------------------------------------------------------------------------

test('TC-NEW-MIG2-03: all-drafts (3 rows published:false) → { publishedCleared: 3, draftsRevealed: 3 }; all undefined after', async () => {
  const t = convexTest(legacySchema, modules)

  const { id1, id2, id3 } = await t.run(async (ctx) => {
    const now = Date.now()

    const creatorId = await ctx.db.insert('creators', {
      name: 'Test Creator MIG2-03',
      slug: 'test-creator-mig2-03',
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: now,
    })

    const stackId = await ctx.db.insert('stacks', {
      name: 'Test Stack MIG2-03',
      slug: 'test-stack-mig2-03',
      shortId: 'MG203',
      creatorId,
      oneLiner: 'test',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: false,
      createdAt: now,
      updatedAt: now,
    })

    const id1 = await ctx.db.insert('projects', {
      name: 'Draft One',
      slug: 'draft-one-mig2-03',
      shortId: 'D1203',
      creatorId,
      stackId,
      published: false,
      createdAt: now,
      updatedAt: now,
    })

    const id2 = await ctx.db.insert('projects', {
      name: 'Draft Two',
      slug: 'draft-two-mig2-03',
      shortId: 'D2203',
      creatorId,
      stackId,
      published: false,
      createdAt: now,
      updatedAt: now,
    })

    const id3 = await ctx.db.insert('projects', {
      name: 'Draft Three',
      slug: 'draft-three-mig2-03',
      shortId: 'D3203',
      creatorId,
      stackId,
      published: false,
      createdAt: now,
      updatedAt: now,
    })

    return { id1, id2, id3 }
  })

  const result = await t.mutation(
    internal.migrations['20260612b_drop_project_published'].run,
    {},
  )

  expect(result.publishedCleared).toBe(3)
  expect(result.draftsRevealed).toBe(3)

  // All rows must have published === undefined
  const row1 = await t.run(async (ctx) => ctx.db.get(id1))
  const row2 = await t.run(async (ctx) => ctx.db.get(id2))
  const row3 = await t.run(async (ctx) => ctx.db.get(id3))

  expect((row1 as Record<string, unknown> | null)?.published).toBeUndefined()
  expect((row2 as Record<string, unknown> | null)?.published).toBeUndefined()
  expect((row3 as Record<string, unknown> | null)?.published).toBeUndefined()
})
