/// <reference types="vite/client" />
/**
 * The read side of view counting (#86, map #76).
 *
 * The tests that matter here are the ownership ones. This query is the only
 * reader of a table the map locked as strictly private, and the repo already
 * shipped one public function that trusted a client-side route guard. So the
 * guard is asserted from three sides: a stranger, a signed-out caller, and an
 * owner who must see their own rows and nobody else's.
 */
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'
import { api } from './_generated/api'
import type { MutationCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'

const modules = import.meta.glob('./**/*.{js,ts}')

const DAY_MS = 24 * 60 * 60 * 1000

function today(): number {
  return Math.floor(Date.now() / DAY_MS) * DAY_MS
}

type Seeded = { creatorId: Id<'creators'>; stackId: Id<'stacks'> }

async function seedCreator(
  t: ReturnType<typeof convexTest>,
  opts: { userId: string; slug: string; stackName?: string; published?: boolean },
): Promise<Seeded> {
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
      name: opts.stackName ?? 'Main Stack',
      slug: `${opts.slug}-stack`,
      shortId: opts.slug.slice(0, 6),
      creatorId,
      oneLiner: 'one',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: opts.published ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return { creatorId, stackId }
  })
}

async function seedCounter(
  t: ReturnType<typeof convexTest>,
  row: {
    targetKind: 'stack' | 'creator' | 'aggregate'
    targetId: string
    dayStartMs: number
    referrerBucket: 'direct' | 'search' | 'ai' | 'social' | 'internal' | 'other'
    count: number
  },
): Promise<void> {
  await t.run(async (ctx: MutationCtx) => {
    await ctx.db.insert('viewCounters', row)
  })
}

// ---------------------------------------------------------------------------
// The guard
// ---------------------------------------------------------------------------

test('a signed-out caller gets nothing', async () => {
  const t = convexTest(schema, modules)
  await seedCreator(t, { userId: 'owner-1', slug: 'owner-one' })
  expect(await t.query(api.viewAnalytics.mine, {})).toBeNull()
})

test('a signed-in user with no creator profile gets nothing', async () => {
  const t = convexTest(schema, modules)
  const asStranger = t.withIdentity({ tokenIdentifier: 'convex|stranger' })
  expect(await asStranger.query(api.viewAnalytics.mine, {})).toBeNull()
})

test('the query takes no target argument, so it cannot be pointed at anyone', async () => {
  // The guard is structural, not a check that could be forgotten: there is no
  // argument naming a target, so a caller has nothing to substitute.
  const t = convexTest(schema, modules)
  const { stackId } = await seedCreator(t, { userId: 'victim', slug: 'victim' })
  const asStranger = t.withIdentity({ tokenIdentifier: 'convex|stranger' })
  await expect(
    // @ts-expect-error — proving the argument does not exist
    asStranger.query(api.viewAnalytics.mine, { targetId: stackId }),
  ).rejects.toThrow()
})

test("one owner never sees another owner's views", async () => {
  const t = convexTest(schema, modules)
  const mine = await seedCreator(t, { userId: 'owner-a', slug: 'owner-a' })
  const theirs = await seedCreator(t, { userId: 'owner-b', slug: 'owner-b' })
  const day = today()

  await seedCounter(t, {
    targetKind: 'stack',
    targetId: mine.stackId,
    dayStartMs: day,
    referrerBucket: 'search',
    count: 3,
  })
  await seedCounter(t, {
    targetKind: 'stack',
    targetId: theirs.stackId,
    dayStartMs: day,
    referrerBucket: 'search',
    count: 900,
  })

  const asA = t.withIdentity({ tokenIdentifier: 'convex|owner-a' })
  const result = await asA.query(api.viewAnalytics.mine, {})
  expect(result?.total).toBe(3)
  expect(result?.targets.map((x) => x.targetId)).not.toContain(theirs.stackId)
})

test('the aggregate counter is nobody’s, so it never lands in an owner’s numbers', async () => {
  // `views.record` counts an `aggregate` target with the sentinel id `global`.
  // It has no owner document, and this page is per-owner.
  const t = convexTest(schema, modules)
  await seedCreator(t, { userId: 'owner-c', slug: 'owner-c' })
  await seedCounter(t, {
    targetKind: 'aggregate',
    targetId: 'global',
    dayStartMs: today(),
    referrerBucket: 'direct',
    count: 500,
  })

  const asC = t.withIdentity({ tokenIdentifier: 'convex|owner-c' })
  const result = await asC.query(api.viewAnalytics.mine, {})
  expect(result?.total).toBe(0)
})

// ---------------------------------------------------------------------------
// What it returns
// ---------------------------------------------------------------------------

test('the profile and every owned stack are listed, in that order', async () => {
  const t = convexTest(schema, modules)
  const { creatorId } = await seedCreator(t, {
    userId: 'owner-d',
    slug: 'owner-d',
    stackName: 'First Stack',
  })
  const asD = t.withIdentity({ tokenIdentifier: 'convex|owner-d' })
  const result = await asD.query(api.viewAnalytics.mine, {})

  expect(result?.targets).toHaveLength(2)
  expect(result?.targets[0]).toMatchObject({
    kind: 'profile',
    targetId: creatorId,
    label: 'Your profile',
  })
  expect(result?.targets[1]).toMatchObject({
    kind: 'stack',
    label: 'First Stack',
  })
})

test('a target nobody visited is still listed, with a zero total', async () => {
  // A stack published yesterday has no rows at all. Dropping it would read as
  // "this page does not know about your stack" rather than "nobody came yet".
  const t = convexTest(schema, modules)
  await seedCreator(t, { userId: 'owner-e', slug: 'owner-e' })
  const asE = t.withIdentity({ tokenIdentifier: 'convex|owner-e' })
  const result = await asE.query(api.viewAnalytics.mine, {})

  expect(result?.targets.every((x) => x.total === 0)).toBe(true)
  expect(result?.targets.every((x) => x.days.length === 0)).toBe(true)
  expect(result?.total).toBe(0)
})

test('a draft stack is marked as not openable, because nobody can reach its page', async () => {
  // `stacks.getBySlug` returns null for an unpublished stack, so a draft's
  // counter can only ever be zero. The row says why.
  const t = convexTest(schema, modules)
  await seedCreator(t, { userId: 'owner-f', slug: 'owner-f', published: false })
  const asF = t.withIdentity({ tokenIdentifier: 'convex|owner-f' })
  const result = await asF.query(api.viewAnalytics.mine, {})

  const stack = result?.targets.find((x) => x.kind === 'stack')
  expect(stack?.openable).toBe(false)
})

test('a day sums every referrer bucket that counted on it', async () => {
  const t = convexTest(schema, modules)
  const { stackId } = await seedCreator(t, { userId: 'owner-g', slug: 'owner-g' })
  const day = today()
  await seedCounter(t, {
    targetKind: 'stack',
    targetId: stackId,
    dayStartMs: day,
    referrerBucket: 'search',
    count: 2,
  })
  await seedCounter(t, {
    targetKind: 'stack',
    targetId: stackId,
    dayStartMs: day,
    referrerBucket: 'ai',
    count: 5,
  })

  const asG = t.withIdentity({ tokenIdentifier: 'convex|owner-g' })
  const result = await asG.query(api.viewAnalytics.mine, {})
  const stack = result?.targets.find((x) => x.kind === 'stack')
  expect(stack?.days).toEqual([{ at: day, value: 7 }])
  expect(stack?.total).toBe(7)
})

test('quiet days inside a target’s history read as zero, not as a gap', async () => {
  // A line drawn straight from Monday to Friday claims visits on Wednesday. The
  // series is filled from the first counted day so the quiet days are visible.
  const t = convexTest(schema, modules)
  const { stackId } = await seedCreator(t, { userId: 'owner-h', slug: 'owner-h' })
  const day = today()
  await seedCounter(t, {
    targetKind: 'stack',
    targetId: stackId,
    dayStartMs: day - 3 * DAY_MS,
    referrerBucket: 'direct',
    count: 4,
  })
  await seedCounter(t, {
    targetKind: 'stack',
    targetId: stackId,
    dayStartMs: day,
    referrerBucket: 'direct',
    count: 1,
  })

  const asH = t.withIdentity({ tokenIdentifier: 'convex|owner-h' })
  const result = await asH.query(api.viewAnalytics.mine, {})
  const stack = result?.targets.find((x) => x.kind === 'stack')
  expect(stack?.days).toEqual([
    { at: day - 3 * DAY_MS, value: 4 },
    { at: day - 2 * DAY_MS, value: 0 },
    { at: day - 1 * DAY_MS, value: 0 },
    { at: day, value: 1 },
  ])
})

test('the series starts at the first counted day, never before it', async () => {
  // Counting started on a date. Padding the window back to 30 days would print
  // "0 views" for days that were never counted, which is a claim, not a gap.
  const t = convexTest(schema, modules)
  const { stackId } = await seedCreator(t, { userId: 'owner-i', slug: 'owner-i' })
  const day = today()
  await seedCounter(t, {
    targetKind: 'stack',
    targetId: stackId,
    dayStartMs: day - DAY_MS,
    referrerBucket: 'direct',
    count: 2,
  })

  const asI = t.withIdentity({ tokenIdentifier: 'convex|owner-i' })
  const result = await asI.query(api.viewAnalytics.mine, {})
  const stack = result?.targets.find((x) => x.kind === 'stack')
  expect(stack?.days).toHaveLength(2)
  expect(stack?.days[0]?.at).toBe(day - DAY_MS)
})

test('days older than the window are left out of every number', async () => {
  const t = convexTest(schema, modules)
  const { stackId } = await seedCreator(t, { userId: 'owner-j', slug: 'owner-j' })
  const day = today()
  await seedCounter(t, {
    targetKind: 'stack',
    targetId: stackId,
    dayStartMs: day - 40 * DAY_MS,
    referrerBucket: 'direct',
    count: 99,
  })
  await seedCounter(t, {
    targetKind: 'stack',
    targetId: stackId,
    dayStartMs: day,
    referrerBucket: 'direct',
    count: 1,
  })

  const asJ = t.withIdentity({ tokenIdentifier: 'convex|owner-j' })
  const result = await asJ.query(api.viewAnalytics.mine, {})
  expect(result?.total).toBe(1)
  expect(result?.windowDays).toBe(30)
})

test('referrer buckets sum across every target, and empty buckets are dropped', async () => {
  const t = convexTest(schema, modules)
  const { creatorId, stackId } = await seedCreator(t, {
    userId: 'owner-k',
    slug: 'owner-k',
  })
  const day = today()
  await seedCounter(t, {
    targetKind: 'creator',
    targetId: creatorId,
    dayStartMs: day,
    referrerBucket: 'ai',
    count: 2,
  })
  await seedCounter(t, {
    targetKind: 'stack',
    targetId: stackId,
    dayStartMs: day,
    referrerBucket: 'ai',
    count: 3,
  })
  await seedCounter(t, {
    targetKind: 'stack',
    targetId: stackId,
    dayStartMs: day,
    referrerBucket: 'direct',
    count: 1,
  })

  const asK = t.withIdentity({ tokenIdentifier: 'convex|owner-k' })
  const result = await asK.query(api.viewAnalytics.mine, {})
  expect(result?.referrers).toEqual([
    { bucket: 'ai', count: 5 },
    { bucket: 'direct', count: 1 },
  ])
  expect(result?.total).toBe(6)
})

test('the first counted day is reported, so the page can label the real range', async () => {
  const t = convexTest(schema, modules)
  const { stackId } = await seedCreator(t, { userId: 'owner-l', slug: 'owner-l' })
  const day = today()
  await seedCounter(t, {
    targetKind: 'stack',
    targetId: stackId,
    dayStartMs: day - 2 * DAY_MS,
    referrerBucket: 'direct',
    count: 1,
  })

  const asL = t.withIdentity({ tokenIdentifier: 'convex|owner-l' })
  const result = await asL.query(api.viewAnalytics.mine, {})
  expect(result?.firstCountedDayMs).toBe(day - 2 * DAY_MS)
})

test('an owner with nothing counted reports no first day at all', async () => {
  const t = convexTest(schema, modules)
  await seedCreator(t, { userId: 'owner-m', slug: 'owner-m' })
  const asM = t.withIdentity({ tokenIdentifier: 'convex|owner-m' })
  const result = await asM.query(api.viewAnalytics.mine, {})
  expect(result?.firstCountedDayMs).toBeNull()
})
