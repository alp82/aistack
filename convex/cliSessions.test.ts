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
      tokenHash: 'hash_abc',
      userId: USER,
      createdAt: Date.now(),
      expiresAt: Date.now() + 90 * DAY,
      lastUsedAt: Date.now(),
    })
    expect(issued).toEqual({ issued: true })

    // By DIGEST - the plaintext column is gone (#52), so this is the only way
    // to find a token, here and in production alike.
    const tokenDoc = await t.query(internal.cliTokens.getByTokenHash, {
      tokenHash: 'hash_abc',
    })
    // The SECOND stack, not whichever the by_creatorId index happens to return
    // first - which is what the retired getFirstStackByCreator would have given.
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
      tokenHash: 'hash_nostack',
      userId: USER,
      createdAt: Date.now(),
      expiresAt: Date.now() + 90 * DAY,
      lastUsedAt: Date.now(),
    })

    const tokenDoc = await t.query(internal.cliTokens.getByTokenHash, {
      tokenHash: 'hash_nostack',
    })
    expect(tokenDoc?.stackId).toBeUndefined()

    const tokenId = await t.run(async (ctx) => {
      const row = await ctx.db
        .query('cliTokens')
        .withIndex('by_tokenHash', (q) => q.eq('tokenHash', 'hash_nostack'))
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
    // bound to a stranger's stack - where snapshots are immutable.
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

  test('a required relink rotates the old credential after a stack is chosen', async () => {
    const t = convexTest(schema, modules)
    const { stackIds } = await seedCreatorWithStacks(t, { count: 1 })
    const oldTokenId = await t.run((ctx) =>
      ctx.db.insert('cliTokens', {
        tokenHash: 'hash_old',
        userId: USER,
        scopes: ['collect', 'sync'],
        createdAt: 1,
        expiresAt: Date.now() + DAY,
        lastUsedAt: 1,
      }),
    )
    await t.mutation(internal.cliSessions.createSession, {
      userCode: 'RELINK',
      secretId: 'secret-relink',
      status: 'pending',
      replacesTokenId: oldTokenId,
      destinationRequired: true,
      createdAt: Date.now(),
      expiresAt: Date.now() + DAY,
    })

    const pending = await t
      .withIdentity(IDENTITY)
      .query(api.cliSessions.getPendingMachineName, { userCode: 'RELINK' })
    expect(pending).toMatchObject({ destinationRequired: true, replacingMachine: true })
    await expect(
      t.withIdentity(IDENTITY).mutation(api.cliSessions.approveSession, {
        userCode: 'RELINK',
      }),
    ).rejects.toThrow(/choose a destination stack/i)

    await t.withIdentity(IDENTITY).mutation(api.cliSessions.approveSession, {
      userCode: 'RELINK',
      stackId: stackIds[0],
    })
    const session = await t.query(internal.cliSessions.getBySecretId, {
      secretId: 'secret-relink',
    })
    expect(
      await t.mutation(internal.cliSessions.issueTokenAndDeleteSession, {
        sessionId: session!._id,
        tokenHash: 'hash_new',
        userId: USER,
        createdAt: 2,
        expiresAt: Date.now() + DAY,
        lastUsedAt: 2,
      }),
    ).toEqual({ issued: true })

    const rows = await t.run((ctx) => ctx.db.query('cliTokens').collect())
    expect(rows).toHaveLength(1)
    expect(rows[0].tokenHash).toBe('hash_new')
    expect(rows[0].stackId).toBe(stackIds[0])
    expect(await t.run((ctx) => ctx.db.get(oldTokenId))).toBeNull()
  })
})

describe('stacks.listMine - the selector source', () => {
  test('returns the signed-in creator’s stacks, newest-updated first', async () => {
    const t = convexTest(schema, modules)
    await seedCreatorWithStacks(t, { count: 2 })
    await seedCreatorWithStacks(t, { userId: OTHER_USER, count: 1 })

    const mine = await t.withIdentity(IDENTITY).query(api.stacks.listMine, {})
    expect(mine.map((s) => s.name)).toEqual(['Stack 2', 'Stack 1'])
  })

  test('includes legacy false rows without exposing the retired flag', async () => {
    const t = convexTest(schema, modules)
    const { stackIds } = await seedCreatorWithStacks(t, { count: 1 })
    await t.run((ctx) => ctx.db.patch(stackIds[0], { published: false }))
    const mine = await t.withIdentity(IDENTITY).query(api.stacks.listMine, {})
    expect(mine).toHaveLength(1)
    expect(mine[0]).not.toHaveProperty('published')
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

/**
 * The device-code cleanup cron (#52).
 *
 * `authStart` is unauthenticated and inserts one row per call, and nothing ever
 * collected them - so this table is the unbounded-growth half of the login
 * path. A rate limit does not close it: even at the cap, a 15-minute TTL is
 * long enough to accumulate a great many rows.
 */
describe('cleanupExpiredSessions', () => {
  const MINUTE = 60 * 1000

  async function seed(
    t: Awaited<ReturnType<typeof convexTest>>,
    userCode: string,
    expiresAt: number,
    over: Record<string, unknown> = {},
  ) {
    return await t.run(async (ctx) =>
      ctx.db.insert('cliSessions', {
        userCode,
        secretId: `secret-${userCode}`,
        status: 'pending' as const,
        createdAt: Date.now() - 20 * MINUTE,
        expiresAt,
        ...over,
      }),
    )
  }

  test('deletes an expired session and keeps a live one', async () => {
    const t = convexTest(schema, modules)
    await seed(t, 'DEAD01', Date.now() - MINUTE)
    await seed(t, 'LIVE01', Date.now() + 10 * MINUTE)

    const result = await t.mutation(internal.cliSessions.cleanupExpiredSessions, {})
    expect(result.deleted).toBe(1)

    const left = await t.run(async (ctx) => ctx.db.query('cliSessions').collect())
    expect(left.map((r) => r.userCode)).toEqual(['LIVE01'])
  })

  test('the abandoned machine name leaves with the row', async () => {
    // #49 stores the CLI's proposed hostname on the PENDING session, so a login
    // the user never approves parks that string on the server. This is the only
    // thing that collects it.
    const t = convexTest(schema, modules)
    await seed(t, 'DEAD02', Date.now() - MINUTE, { machineName: 'alp-desktop' })

    await t.mutation(internal.cliSessions.cleanupExpiredSessions, {})

    const left = await t.run(async (ctx) => ctx.db.query('cliSessions').collect())
    expect(left).toHaveLength(0)
  })

  test('an approved session that outlived its TTL is collected too', async () => {
    // `issueTokenAndDeleteSession` deletes an approved row on success, so an
    // approved row still here after its TTL is one the CLI stopped polling for.
    const t = convexTest(schema, modules)
    await seed(t, 'DEAD03', Date.now() - MINUTE, {
      status: 'approved' as const,
      userId: 'user_owner',
    })

    const result = await t.mutation(internal.cliSessions.cleanupExpiredSessions, {})
    expect(result.deleted).toBe(1)
  })

  test('a second run is a no-op', async () => {
    const t = convexTest(schema, modules)
    await seed(t, 'DEAD04', Date.now() - MINUTE)
    await t.mutation(internal.cliSessions.cleanupExpiredSessions, {})
    const second = await t.mutation(internal.cliSessions.cleanupExpiredSessions, {})
    expect(second.deleted).toBe(0)
  })
})
