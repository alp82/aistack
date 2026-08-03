/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'
import { api, internal } from './_generated/api'
import type { MutationCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'

const modules = import.meta.glob('./**/*.{js,ts}')

const DAY_MS = 24 * 60 * 60 * 1000

function today(): number {
  return Math.floor(Date.now() / DAY_MS) * DAY_MS
}

async function seedStack(
  t: ReturnType<typeof convexTest>,
  opts: { userId: string; slug: string; published?: boolean },
): Promise<{ stackId: Id<'stacks'>; creatorId: Id<'creators'> }> {
  return await t.run(async (ctx: MutationCtx) => {
    const creatorId = await ctx.db.insert('creators', {
      name: `Creator ${opts.userId}`,
      slug: opts.slug,
      userId: opts.userId,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    })
    const stackId = await ctx.db.insert('stacks', {
      name: 'Stack',
      slug: opts.slug,
      shortId: opts.slug.slice(0, 6),
      creatorId,
      oneLiner: 'one',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: opts.published ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return { stackId, creatorId }
  })
}

const baseArgs = {
  targetKind: 'stack' as const,
  visitorHash: 'hash-a',
  rateKey: 'rate-a',
  referrerBucket: 'search' as const,
}

// ---------------------------------------------------------------------------
// Counting and dedupe
// ---------------------------------------------------------------------------

test('a first view counts and files one counter row in its referrer bucket', async () => {
  const t = convexTest(schema, modules)
  const { stackId } = await seedStack(t, { userId: 'u1', slug: 'creator-one' })

  const result = await t.mutation(api.views.record, {
    ...baseArgs,
    targetId: stackId,
  })

  expect(result.counted).toBe(true)
  const counters = await t.run((ctx: MutationCtx) =>
    ctx.db.query('viewCounters').collect(),
  )
  expect(counters).toHaveLength(1)
  expect(counters[0]).toMatchObject({
    targetKind: 'stack',
    targetId: stackId,
    dayStartMs: today(),
    referrerBucket: 'search',
    count: 1,
  })
})

test('the same visitor hash on the same day counts once', async () => {
  const t = convexTest(schema, modules)
  const { stackId } = await seedStack(t, { userId: 'u2', slug: 'creator-two' })

  const first = await t.mutation(api.views.record, { ...baseArgs, targetId: stackId })
  const second = await t.mutation(api.views.record, { ...baseArgs, targetId: stackId })

  expect(first.counted).toBe(true)
  expect(second.counted).toBe(false)
  const counters = await t.run((ctx: MutationCtx) =>
    ctx.db.query('viewCounters').collect(),
  )
  expect(counters).toHaveLength(1)
  expect(counters[0].count).toBe(1)
})

test('a different visitor hash counts again in the same bucket', async () => {
  const t = convexTest(schema, modules)
  const { stackId } = await seedStack(t, { userId: 'u3', slug: 'creator-three' })

  await t.mutation(api.views.record, { ...baseArgs, targetId: stackId })
  await t.mutation(api.views.record, {
    ...baseArgs,
    targetId: stackId,
    visitorHash: 'hash-b',
  })

  const counters = await t.run((ctx: MutationCtx) =>
    ctx.db.query('viewCounters').collect(),
  )
  expect(counters).toHaveLength(1)
  expect(counters[0].count).toBe(2)
})

test('two referrer buckets on one target-day are two counter rows', async () => {
  const t = convexTest(schema, modules)
  const { stackId } = await seedStack(t, { userId: 'u4', slug: 'creator-four' })

  await t.mutation(api.views.record, { ...baseArgs, targetId: stackId })
  await t.mutation(api.views.record, {
    ...baseArgs,
    targetId: stackId,
    visitorHash: 'hash-b',
    referrerBucket: 'ai',
  })

  const counters = await t.run((ctx: MutationCtx) =>
    ctx.db.query('viewCounters').collect(),
  )
  expect(counters).toHaveLength(2)
  expect(counters.map((c) => c.referrerBucket).sort()).toEqual(['ai', 'search'])
})

// ---------------------------------------------------------------------------
// Owner exclusion — the identity is derived, never an argument
// ---------------------------------------------------------------------------

test('the authenticated owner of a stack does not count as a view', async () => {
  const t = convexTest(schema, modules)
  const { stackId } = await seedStack(t, { userId: 'owner-1', slug: 'creator-own' })
  const asOwner = t.withIdentity({ tokenIdentifier: 'convex|owner-1' })

  const result = await asOwner.mutation(api.views.record, {
    ...baseArgs,
    targetId: stackId,
  })

  expect(result.counted).toBe(false)
  const counters = await t.run((ctx: MutationCtx) =>
    ctx.db.query('viewCounters').collect(),
  )
  expect(counters).toHaveLength(0)
})

test('a different authenticated user counts normally', async () => {
  const t = convexTest(schema, modules)
  const { stackId } = await seedStack(t, { userId: 'owner-2', slug: 'creator-own2' })
  const asStranger = t.withIdentity({ tokenIdentifier: 'convex|stranger' })

  const result = await asStranger.mutation(api.views.record, {
    ...baseArgs,
    targetId: stackId,
  })

  expect(result.counted).toBe(true)
})

test('the owner of a creator profile does not count as a view of it', async () => {
  const t = convexTest(schema, modules)
  const { creatorId } = await seedStack(t, { userId: 'owner-3', slug: 'creator-own3' })
  const asOwner = t.withIdentity({ tokenIdentifier: 'convex|owner-3' })

  const result = await asOwner.mutation(api.views.record, {
    ...baseArgs,
    targetKind: 'creator',
    targetId: creatorId,
  })

  expect(result.counted).toBe(false)
})

// ---------------------------------------------------------------------------
// Targets
// ---------------------------------------------------------------------------

test('a target id that resolves to nothing is not counted', async () => {
  const t = convexTest(schema, modules)
  await seedStack(t, { userId: 'u5', slug: 'creator-five' })

  const result = await t.mutation(api.views.record, {
    ...baseArgs,
    targetId: 'not-an-id',
  })

  expect(result.counted).toBe(false)
})

test("the aggregate page counts under the 'global' sentinel and nothing else", async () => {
  const t = convexTest(schema, modules)

  const good = await t.mutation(api.views.record, {
    ...baseArgs,
    targetKind: 'aggregate',
    targetId: 'global',
  })
  const bad = await t.mutation(api.views.record, {
    ...baseArgs,
    targetKind: 'aggregate',
    targetId: 'something-else',
    visitorHash: 'hash-b',
  })

  expect(good.counted).toBe(true)
  expect(bad.counted).toBe(false)
})

test('a signed-in user counts on the aggregate page — it has no owner', async () => {
  const t = convexTest(schema, modules)
  const asSomeone = t.withIdentity({ tokenIdentifier: 'convex|anyone' })

  const result = await asSomeone.mutation(api.views.record, {
    ...baseArgs,
    targetKind: 'aggregate',
    targetId: 'global',
  })

  expect(result.counted).toBe(true)
})

// ---------------------------------------------------------------------------
// Rate limit
// ---------------------------------------------------------------------------

test('one address is capped per minute, and the cap does not spill onto another address', async () => {
  const t = convexTest(schema, modules)
  const { stackId } = await seedStack(t, { userId: 'u6', slug: 'creator-six' })

  let refused = 0
  for (let i = 0; i < 130; i++) {
    const r = await t.mutation(api.views.record, {
      ...baseArgs,
      targetId: stackId,
      visitorHash: `hash-${i}`,
    })
    if (!r.counted) refused++
  }
  expect(refused).toBe(10)

  const other = await t.mutation(api.views.record, {
    ...baseArgs,
    targetId: stackId,
    visitorHash: 'hash-other',
    rateKey: 'rate-b',
  })
  expect(other.counted).toBe(true)
})

// ---------------------------------------------------------------------------
// Retention
// ---------------------------------------------------------------------------

test('the GC drops markers older than yesterday and keeps today and yesterday', async () => {
  const t = convexTest(schema, modules)
  const dayStart = today()
  await t.run(async (ctx: MutationCtx) => {
    for (const [offset, hash] of [
      [0, 'today'],
      [-DAY_MS, 'yesterday'],
      [-2 * DAY_MS, 'older'],
      [-9 * DAY_MS, 'oldest'],
    ] as const) {
      await ctx.db.insert('viewDedupe', {
        targetKind: 'stack',
        targetId: 'x',
        dayStartMs: dayStart + offset,
        visitorHash: hash,
      })
    }
  })

  const result = await t.mutation(internal.views.gcDedupe, {})

  expect(result.deleted).toBe(2)
  const left = await t.run((ctx: MutationCtx) =>
    ctx.db.query('viewDedupe').collect(),
  )
  expect(left.map((r) => r.visitorHash).sort()).toEqual(['today', 'yesterday'])
})

test('the GC never touches viewCounters', async () => {
  const t = convexTest(schema, modules)
  await t.run(async (ctx: MutationCtx) => {
    await ctx.db.insert('viewCounters', {
      targetKind: 'stack',
      targetId: 'x',
      dayStartMs: today() - 30 * DAY_MS,
      referrerBucket: 'direct',
      count: 7,
    })
  })

  await t.mutation(internal.views.gcDedupe, {})

  const counters = await t.run((ctx: MutationCtx) =>
    ctx.db.query('viewCounters').collect(),
  )
  expect(counters).toHaveLength(1)
  expect(counters[0].count).toBe(7)
})
