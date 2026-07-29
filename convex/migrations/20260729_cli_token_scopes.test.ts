/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { internal } from '../_generated/api'
import schema from '../schema'
import { FULL_CLI_TOKEN_SCOPES } from '../lib/cliScopes'

/**
 * Phase B of the `cliTokens.scopes` migration — wayfinder #52 (map #29).
 *
 * The load-bearing test is `an EMPTY grant is left alone`. `scopes` is an
 * array, so `[]` is truthy in JavaScript while an empty grant is a perfectly
 * real value to store — a truthiness check would be wrong in both directions,
 * and a presence check that drifts back to truthiness is the exact failure that
 * blocked a schema push on this repo once already.
 */

// Vite keys same-directory files as './x.ts' while convex-test derives its
// module root ('../') from the _generated path — remap the sibling keys so
// 'migrations/20260729_cli_token_scopes' resolves. Same remap the sibling
// 20260729 hash test needed; it is a convex-test quirk, not a repo one.
const modules = Object.fromEntries(
  Object.entries(import.meta.glob('../**/*.{js,ts}')).map(([key, loader]) => [
    key.replace(/^\.\//, '../migrations/'),
    loader,
  ]),
)

const DAY = 24 * 60 * 60 * 1000
const MIGRATION = internal.migrations['20260729_cli_token_scopes']

type Ctx = Awaited<ReturnType<typeof convexTest>>

async function seedToken(t: Ctx, token: string, over: Record<string, unknown> = {}) {
  return await t.run(async (ctx) =>
    ctx.db.insert('cliTokens', {
      token,
      tokenHash: `hash-${token}`,
      userId: 'user_owner',
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      expiresAt: Date.now() + 90 * DAY,
      ...over,
    }),
  )
}

describe('cliTokens.scopes backfill', () => {
  test('an unscoped row gets the FULL set', async () => {
    // Those tokens were issued when there was nothing to restrict, so they hold
    // a full grant already. Writing anything narrower would revoke access the
    // user never asked to revoke, on a machine that was working a minute ago.
    const t = convexTest(schema, modules)
    const id = await seedToken(t, 'tok_old')

    const result = await t.mutation(MIGRATION.backfill, {})
    expect(result.patched).toBe(1)
    expect(result.remaining).toBe(0)

    const row = await t.run(async (ctx) => ctx.db.get(id))
    expect(row?.scopes).toEqual(FULL_CLI_TOKEN_SCOPES)
  })

  test('an EMPTY grant is left alone — the check tests presence, not truthiness', async () => {
    const t = convexTest(schema, modules)
    const id = await seedToken(t, 'tok_empty', { scopes: [] })

    const result = await t.mutation(MIGRATION.backfill, {})
    expect(result.patched).toBe(0)

    const row = await t.run(async (ctx) => ctx.db.get(id))
    expect(row?.scopes).toEqual([])
  })

  test('a narrower grant is not widened', async () => {
    const t = convexTest(schema, modules)
    const id = await seedToken(t, 'tok_narrow', { scopes: ['collect'] })

    await t.mutation(MIGRATION.backfill, {})

    const row = await t.run(async (ctx) => ctx.db.get(id))
    expect(row?.scopes).toEqual(['collect'])
  })

  test('a second run finds nothing to do', async () => {
    const t = convexTest(schema, modules)
    await seedToken(t, 'tok_a')
    await seedToken(t, 'tok_b')

    const first = await t.mutation(MIGRATION.backfill, {})
    const second = await t.mutation(MIGRATION.backfill, {})
    expect(first.patched).toBe(2)
    expect(second.patched).toBe(0)
  })

  test('report counts by PRESENCE', async () => {
    const t = convexTest(schema, modules)
    await seedToken(t, 'tok_none')
    await seedToken(t, 'tok_empty', { scopes: [] })
    await seedToken(t, 'tok_full', { scopes: FULL_CLI_TOKEN_SCOPES })

    const report = await t.query(MIGRATION.report, {})
    // The empty grant counts as SCOPED. It is a real answer, not a missing one.
    expect(report).toEqual({ total: 3, scoped: 2, unscoped: 1 })
  })
})

describe('apiRateLimits key rename', () => {
  test('a keyless row is deleted, a keyed row survives', async () => {
    // Deletes rather than backfills: a row still holding `ip` is by definition
    // expired, and resurrecting an expired window as a `key` row would hand its
    // caller a stale count instead of the fresh one they have earned.
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      await ctx.db.insert('apiRateLimits', {
        ip: '1.2.3.4',
        windowStart: Date.now() - 120_000,
        count: 60,
      })
      await ctx.db.insert('apiRateLimits', {
        key: 'ip:5.6.7.8',
        windowStart: Date.now(),
        count: 1,
      })
    })

    const result = await t.mutation(MIGRATION.purgeKeylessRateLimits, {})
    expect(result).toEqual({ deleted: 1, remaining: 0 })

    const left = await t.run(async (ctx) => ctx.db.query('apiRateLimits').collect())
    expect(left).toHaveLength(1)
    expect(left[0].key).toBe('ip:5.6.7.8')
  })

  test('an empty-string key is NOT treated as keyless', async () => {
    // Same presence-not-truthiness rule as the scopes half. An empty key is a
    // bucket like any other, and `!row.key` would delete it.
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      await ctx.db.insert('apiRateLimits', { key: '', windowStart: Date.now(), count: 1 })
    })

    const result = await t.mutation(MIGRATION.purgeKeylessRateLimits, {})
    expect(result.deleted).toBe(0)
  })
})
