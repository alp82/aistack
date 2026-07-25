/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import schema from './schema'

const modules = import.meta.glob('./**/*.{js,ts}')

const USER = 'user_owner'
const OTHER_USER = 'user_stranger'
const IDENTITY = { tokenIdentifier: `convex|${USER}`, subject: USER }
const DAY = 24 * 60 * 60 * 1000

type Ctx = Awaited<ReturnType<typeof convexTest>>

async function seedCreatorWithStacks(
  t: Ctx,
  opts: { userId?: string; count?: number } = {},
) {
  return await t.run(async (ctx) => {
    const userId = opts.userId ?? USER
    const creatorId = await ctx.db.insert('creators', {
      name: 'Owner',
      slug: `owner-${userId}`,
      userId,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    })
    const stackIds: Id<'stacks'>[] = []
    for (let i = 0; i < (opts.count ?? 1); i++) {
      stackIds.push(
        await ctx.db.insert('stacks', {
          name: `Stack ${i + 1}`,
          slug: `stack-${i + 1}`,
          shortId: `sid${userId}${i}`,
          creatorId,
          oneLiner: 'A stack',
          toolSubscriptions: [],
          hasUsageComponent: false,
          published: true,
          createdAt: Date.now(),
          updatedAt: Date.now() + i,
        }),
      )
    }
    return { creatorId, stackIds }
  })
}

async function seedPendingSession(t: Ctx, userCode = 'ABC123') {
  const secretId = `secret-${userCode}`
  await t.mutation(internal.cliSessions.createSession, {
    userCode,
    secretId,
    status: 'pending',
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60_000,
  })
  return { userCode, secretId }
}

describe('link-time stack binding (#33 decision 7)', () => {
  test('the approved stack is carried onto the issued token', async () => {
    const t = convexTest(schema, modules)
    const { stackIds } = await seedCreatorWithStacks(t, { count: 2 })
    const { userCode, secretId } = await seedPendingSession(t)

    await t
      .withIdentity(IDENTITY)
      .mutation(api.cliSessions.approveSession, { userCode, stackId: stackIds[1] })

    const session = await t.query(internal.cliSessions.getBySecretId, { secretId })
    const issued = await t.mutation(internal.cliSessions.issueTokenAndDeleteSession, {
      sessionId: session!._id,
      token: 'tok_abc',
      userId: USER,
      createdAt: Date.now(),
      expiresAt: Date.now() + 90 * DAY,
      lastUsedAt: Date.now(),
    })
    expect(issued).toEqual({ token: 'tok_abc' })

    const tokenDoc = await t.query(internal.cliTokens.getByToken, { token: 'tok_abc' })
    // The SECOND stack, not whichever the by_creatorId index happens to return
    // first — which is what the retired getFirstStackByCreator would have given.
    expect(tokenDoc?.stackId).toBe(stackIds[1])
  })

  test('approving without a stack issues a token that cannot publish', async () => {
    // A profile with no stack can still authorize the CLI for its other
    // commands; the token simply carries no sync target.
    const t = convexTest(schema, modules)
    await seedCreatorWithStacks(t, { count: 0 })
    const { userCode, secretId } = await seedPendingSession(t)

    await t.withIdentity(IDENTITY).mutation(api.cliSessions.approveSession, { userCode })

    const session = await t.query(internal.cliSessions.getBySecretId, { secretId })
    await t.mutation(internal.cliSessions.issueTokenAndDeleteSession, {
      sessionId: session!._id,
      token: 'tok_nostack',
      userId: USER,
      createdAt: Date.now(),
      expiresAt: Date.now() + 90 * DAY,
      lastUsedAt: Date.now(),
    })

    const tokenDoc = await t.query(internal.cliTokens.getByToken, {
      token: 'tok_nostack',
    })
    expect(tokenDoc?.stackId).toBeUndefined()

    const tokenId = await t.run(async (ctx) => {
      const row = await ctx.db
        .query('cliTokens')
        .withIndex('by_token', (q) => q.eq('token', 'tok_nostack'))
        .first()
      return row!._id
    })
    await expect(
      t.mutation(internal.measured.publishForToken, {
        tokenId,
        payload: { schemaVersion: 1 } as never,
      }),
    ).rejects.toThrow()
  })

  test('refuses to bind a stack the approving user does not own', async () => {
    // Without this the selector's value is caller-supplied, and a token could be
    // bound to a stranger's stack — where snapshots are immutable.
    const t = convexTest(schema, modules)
    const mine = await seedCreatorWithStacks(t, { count: 1 })
    const theirs = await seedCreatorWithStacks(t, {
      userId: OTHER_USER,
      count: 1,
    })
    expect(mine.stackIds[0]).not.toBe(theirs.stackIds[0])
    const { userCode } = await seedPendingSession(t)

    await expect(
      t.withIdentity(IDENTITY).mutation(api.cliSessions.approveSession, {
        userCode,
        stackId: theirs.stackIds[0],
      }),
    ).rejects.toThrow(/not authorized to link/i)
  })

  test('refuses a stackId that does not exist', async () => {
    const t = convexTest(schema, modules)
    const { stackIds } = await seedCreatorWithStacks(t, { count: 1 })
    const { userCode } = await seedPendingSession(t)
    await t.run((ctx) => ctx.db.delete(stackIds[0]))

    await expect(
      t.withIdentity(IDENTITY).mutation(api.cliSessions.approveSession, {
        userCode,
        stackId: stackIds[0],
      }),
    ).rejects.toThrow(/stack not found/i)
  })

  test('still refuses an unauthenticated approval', async () => {
    const t = convexTest(schema, modules)
    const { userCode } = await seedPendingSession(t)
    await expect(
      t.mutation(api.cliSessions.approveSession, { userCode }),
    ).rejects.toThrow(/not authenticated/i)
  })
})

describe('stacks.listMine — the selector source', () => {
  test('returns the signed-in creator’s stacks, newest-updated first', async () => {
    const t = convexTest(schema, modules)
    await seedCreatorWithStacks(t, { count: 2 })
    await seedCreatorWithStacks(t, { userId: OTHER_USER, count: 1 })

    const mine = await t.withIdentity(IDENTITY).query(api.stacks.listMine, {})
    expect(mine.map((s) => s.name)).toEqual(['Stack 2', 'Stack 1'])
  })

  test('includes drafts, because a draft is a legitimate sync target', async () => {
    const t = convexTest(schema, modules)
    const { stackIds } = await seedCreatorWithStacks(t, { count: 1 })
    await t.run((ctx) => ctx.db.patch(stackIds[0], { published: false }))
    const mine = await t.withIdentity(IDENTITY).query(api.stacks.listMine, {})
    expect(mine).toHaveLength(1)
    expect(mine[0].published).toBe(false)
  })

  test('returns [] when signed out or without a creator profile', async () => {
    const t = convexTest(schema, modules)
    await seedCreatorWithStacks(t, { count: 1 })
    expect(await t.query(api.stacks.listMine, {})).toEqual([])
    expect(
      await t
        .withIdentity({ tokenIdentifier: 'convex|nobody', subject: 'nobody' })
        .query(api.stacks.listMine, {}),
    ).toEqual([])
  })
})
