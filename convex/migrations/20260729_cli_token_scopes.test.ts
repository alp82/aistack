/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { internal } from '../_generated/api'
import schema from '../schema'

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

const MIGRATION = internal.migrations['20260729_cli_token_scopes']

/**
 * THE SCOPES-BACKFILL TESTS LIVE IN THE PRE-NARROW REVISION, not here.
 *
 * Every one of them seeds a row with no `scopes`, and `scopes` is required in
 * this revision — convexTest refuses the insert. That is not a coverage gap
 * dressed up as a decision: it is the same fact that makes the widen and the
 * narrow two deploys. The backfill is tested against the schema it actually
 * runs against, which is the previous one.
 */
describe('apiRateLimits key rename', () => {
  test('a keyed row survives the purge', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      await ctx.db.insert('apiRateLimits', {
        key: 'ip:5.6.7.8',
        windowStart: Date.now(),
        count: 1,
      })
    })

    const result = await t.mutation(MIGRATION.purgeKeylessRateLimits, {})
    expect(result).toEqual({ deleted: 0, remaining: 0 })

    const left = await t.run(async (ctx) => ctx.db.query('apiRateLimits').collect())
    expect(left).toHaveLength(1)
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
