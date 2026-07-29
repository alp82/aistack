/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import schema from './schema'

/**
 * CLI token hardening — wayfinder #49, narrowed in #52 (map #29).
 *
 * The test that guards a decision rather than behaviour: THE LIST NEVER ECHOES
 * A CREDENTIAL. `/settings/machines` renders rows for every linked machine, so
 * a `token` or `tokenHash` key leaking into that payload would hand any XSS a
 * live bearer.
 *
 * The phase-A fallback tests are gone with the plaintext column. `getByToken`
 * no longer exists and a row cannot hold a raw bearer, so there is nothing left
 * to fall back to — which is the outcome, not an omission.
 */

const modules = import.meta.glob('./**/*.{js,ts}')

const USER = 'user_owner'
const OTHER_USER = 'user_stranger'
const IDENTITY = { tokenIdentifier: `convex|${USER}`, subject: USER }
const OTHER_IDENTITY = { tokenIdentifier: `convex|${OTHER_USER}`, subject: OTHER_USER }
const DAY = 24 * 60 * 60 * 1000

type Ctx = Awaited<ReturnType<typeof convexTest>>

async function seedStack(t: Ctx, userId = USER) {
  return await t.run(async (ctx) => {
    const creatorId = await ctx.db.insert('creators', {
      name: 'Owner',
      slug: `owner-${userId}`,
      userId,
      verified: false,
      personalPages: [],
      projectPages: [],
      createdAt: Date.now(),
    })
    return await ctx.db.insert('stacks', {
      name: 'Main Stack',
      slug: 'main-stack',
      shortId: `sid-${userId}`,
      creatorId,
      oneLiner: 'A stack',
      toolSubscriptions: [],
      hasUsageComponent: false,
      published: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  })
}

async function seedToken(
  t: Ctx,
  opts: {
    tokenHash: string
    userId?: string
    name?: string
    stackId?: Id<'stacks'>
    lastUsedAt?: number
    expiresAt?: number
  },
) {
  return await t.run(async (ctx) =>
    ctx.db.insert('cliTokens', {
      tokenHash: opts.tokenHash,
      scopes: ['collect', 'sync'],
      userId: opts.userId ?? USER,
      name: opts.name,
      stackId: opts.stackId,
      createdAt: Date.now() - 10 * DAY,
      lastUsedAt: opts.lastUsedAt ?? Date.now(),
      expiresAt: opts.expiresAt ?? Date.now() + 90 * DAY,
    }),
  )
}

describe('getByTokenHash', () => {
  test('resolves a hashed token and never sees the plaintext', async () => {
    const t = convexTest(schema, modules)
    const id = await seedToken(t, { tokenHash: 'digest' })

    const doc = await t.query(internal.cliTokens.getByTokenHash, { tokenHash: 'digest' })
    expect(doc?._id).toBe(id)

    // The digest is the key. The plaintext is not a valid argument to this
    // function, which is the entire point of hashing in the httpAction.
    expect(
      await t.query(internal.cliTokens.getByTokenHash, { tokenHash: 'plain' }),
    ).toBeNull()
  })

  test('an expired token does not resolve', async () => {
    const t = convexTest(schema, modules)
    await seedToken(t, { tokenHash: 'digest', expiresAt: Date.now() - 1000 })
    expect(
      await t.query(internal.cliTokens.getByTokenHash, { tokenHash: 'digest' }),
    ).toBeNull()
  })

})

describe('listByUser', () => {
  test('never returns the token or its digest', async () => {
    const t = convexTest(schema, modules)
    await seedToken(t, { tokenHash: 'digest', name: 'work laptop' })

    const rows = await t.withIdentity(IDENTITY).query(api.cliTokens.listByUser, {})
    expect(rows).toHaveLength(1)
    const keys = Object.keys(rows[0])
    expect(keys).not.toContain('token')
    expect(keys).not.toContain('tokenHash')
    expect(JSON.stringify(rows)).not.toContain('plain')
    expect(JSON.stringify(rows)).not.toContain('digest')
  })

  test('resolves the bound stack, and reports its absence as null', async () => {
    const t = convexTest(schema, modules)
    const stackId = await seedStack(t)
    await seedToken(t, { tokenHash: 'ha', stackId, lastUsedAt: 2000 })
    await seedToken(t, { tokenHash: 'hb', lastUsedAt: 1000 })

    const rows = await t.withIdentity(IDENTITY).query(api.cliTokens.listByUser, {})
    expect(rows[0].stack).toEqual({ name: 'Main Stack', slug: 'main-stack' })
    // The stack-less token is exactly the class that has no page under a
    // per-stack revoke surface, which is why this one is account-scoped.
    expect(rows[1].stack).toBeNull()
  })

  test('most recently used first', async () => {
    const t = convexTest(schema, modules)
    await seedToken(t, { tokenHash: 'h1', name: 'old', lastUsedAt: 1000 })
    await seedToken(t, { tokenHash: 'h2', name: 'new', lastUsedAt: 9000 })

    const rows = await t.withIdentity(IDENTITY).query(api.cliTokens.listByUser, {})
    expect(rows.map((r) => r.name)).toEqual(['new', 'old'])
  })

  test('shows only the caller machines, and nothing when signed out', async () => {
    const t = convexTest(schema, modules)
    await seedToken(t, { tokenHash: 'h1', name: 'mine' })
    await seedToken(t, { tokenHash: 'h2', userId: OTHER_USER })

    const mine = await t.withIdentity(IDENTITY).query(api.cliTokens.listByUser, {})
    expect(mine.map((r) => r.name)).toEqual(['mine'])
    expect(await t.query(api.cliTokens.listByUser, {})).toEqual([])
  })
})

describe('revokeToken', () => {
  test('deletes the row, so the machine stops authenticating', async () => {
    const t = convexTest(schema, modules)
    const id = await seedToken(t, { tokenHash: 'digest' })

    await t.withIdentity(IDENTITY).mutation(api.cliTokens.revokeToken, { id })

    expect(
      await t.query(internal.cliTokens.getByTokenHash, { tokenHash: 'digest' }),
    ).toBeNull()
    // Deleted, not flagged — there is no revoked state to leave behind.
    expect(await t.run(async (ctx) => ctx.db.get(id))).toBeNull()
  })

  test('a stranger cannot revoke someone else machine', async () => {
    const t = convexTest(schema, modules)
    const id = await seedToken(t, { tokenHash: 'digest' })

    await expect(
      t.withIdentity(OTHER_IDENTITY).mutation(api.cliTokens.revokeToken, { id }),
    ).rejects.toThrow(/Not authorized/)
    expect(await t.run(async (ctx) => ctx.db.get(id))).not.toBeNull()
  })

  test('revoking twice is not an error', async () => {
    // A double-click must not raise a dialog. The machine is gone either way,
    // which is what the user asked for.
    const t = convexTest(schema, modules)
    const id = await seedToken(t, { tokenHash: 'digest' })

    await t.withIdentity(IDENTITY).mutation(api.cliTokens.revokeToken, { id })
    await expect(
      t.withIdentity(IDENTITY).mutation(api.cliTokens.revokeToken, { id }),
    ).resolves.toBeNull()
  })

  test('signed out cannot revoke', async () => {
    const t = convexTest(schema, modules)
    const id = await seedToken(t, { tokenHash: 'digest' })
    await expect(t.mutation(api.cliTokens.revokeToken, { id })).rejects.toThrow(
      /Not authenticated/,
    )
  })
})

describe('refreshToken', () => {
  test('a revoked machine with a request in flight does not resurrect itself', async () => {
    // The sliding TTL runs AFTER the request is served, so a revoke landing
    // mid-request would otherwise patch a deleted row and throw a 500 — or
    // worse, recreate it.
    const t = convexTest(schema, modules)
    const id = await seedToken(t, { tokenHash: 'digest' })
    await t.withIdentity(IDENTITY).mutation(api.cliTokens.revokeToken, { id })

    await expect(
      t.mutation(internal.cliTokens.refreshToken, {
        id,
        lastUsedAt: Date.now(),
        expiresAt: Date.now() + 90 * DAY,
      }),
    ).resolves.toBeNull()
    expect(await t.run(async (ctx) => ctx.db.get(id))).toBeNull()
  })
})
