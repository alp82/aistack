/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { expect, test } from 'vitest'
import schema from './schema'
import { api, internal } from './_generated/api'
import type { MutationCtx } from './_generated/server'

const modules = import.meta.glob('./**/*.{js,ts}')

const WINDOW_MS = 60_000
const MAX_REQUESTS = 60

// ---------------------------------------------------------------------------
// Group RL — checkApiRateLimit mutation
// ---------------------------------------------------------------------------

test('TC-RL-01: first call for a fresh IP returns allowed:true, remaining:59', async () => {
  const t = convexTest(schema, modules)

  const result = await t.mutation(api.rateLimit.checkApiRateLimit, { ip: '10.0.0.1' })

  expect(result.allowed).toBe(true)
  expect(result.remaining).toBe(MAX_REQUESTS - 1) // 59
  expect(result.limit).toBe(MAX_REQUESTS)
  expect(typeof result.resetAt).toBe('number')
  expect(typeof result.retryAfterSeconds).toBe('number')
})

test('TC-RL-02: 60 calls for one IP are all allowed:true, remaining descends 59→0, 60th has remaining:0', async () => {
  const t = convexTest(schema, modules)
  const ip = '10.0.0.2'

  let lastResult: { allowed: boolean; remaining: number; limit: number; resetAt: number; retryAfterSeconds: number } | null = null
  for (let i = 0; i < MAX_REQUESTS; i++) {
    lastResult = await t.mutation(api.rateLimit.checkApiRateLimit, { ip })
    expect(lastResult.allowed).toBe(true)
    expect(lastResult.remaining).toBe(MAX_REQUESTS - 1 - i)
  }

  // The 60th call (i=59) must have remaining:0
  expect(lastResult!.remaining).toBe(0)
})

test('TC-RL-03: 61st call same IP within window returns allowed:false, remaining:0, retryAfterSeconds>0', async () => {
  const t = convexTest(schema, modules)
  const ip = '10.0.0.3'

  for (let i = 0; i < MAX_REQUESTS; i++) {
    await t.mutation(api.rateLimit.checkApiRateLimit, { ip })
  }

  // 61st call must be rejected
  const result = await t.mutation(api.rateLimit.checkApiRateLimit, { ip })

  expect(result.allowed).toBe(false)
  expect(result.remaining).toBe(0)
  expect(result.retryAfterSeconds).toBeGreaterThan(0)
})

test('TC-RL-04: two distinct IPs are independent — exhausting one does not affect the other', async () => {
  const t = convexTest(schema, modules)
  const ipA = '1.2.3.4'
  const ipB = '5.6.7.8'

  // Exhaust ipA
  for (let i = 0; i < MAX_REQUESTS; i++) {
    await t.mutation(api.rateLimit.checkApiRateLimit, { ip: ipA })
  }
  // ipA is now saturated
  const saturated = await t.mutation(api.rateLimit.checkApiRateLimit, { ip: ipA })
  expect(saturated.allowed).toBe(false)

  // First call for ipB must still be allowed
  const fresh = await t.mutation(api.rateLimit.checkApiRateLimit, { ip: ipB })
  expect(fresh.allowed).toBe(true)
  expect(fresh.remaining).toBe(MAX_REQUESTS - 1)
})

test('TC-RL-05: same ip string is a shared bucket that saturates and rejects (generic key test)', async () => {
  const t = convexTest(schema, modules)
  const ip = 'shared-bucket-key'

  for (let i = 0; i < MAX_REQUESTS; i++) {
    await t.mutation(api.rateLimit.checkApiRateLimit, { ip })
  }

  const result = await t.mutation(api.rateLimit.checkApiRateLimit, { ip })
  expect(result.allowed).toBe(false)
})

test('TC-RL-06: expired window row resets — allowed:true, remaining:59 (lazy reset)', async () => {
  const t = convexTest(schema, modules)
  const ip = '10.0.0.6'

  // Seed a row that looks fully saturated but whose window started >60s ago
  await t.run(async (ctx: MutationCtx) => {
    await ctx.db.insert('apiRateLimits', {
      ip,
      windowStart: Date.now() - (WINDOW_MS + 1_000), // 61 seconds ago
      count: MAX_REQUESTS,
    })
  })

  // The window should have expired → treated as a fresh request
  const result = await t.mutation(api.rateLimit.checkApiRateLimit, { ip })

  expect(result.allowed).toBe(true)
  expect(result.remaining).toBe(MAX_REQUESTS - 1) // count reset to 1
})

test('TC-RL-07: cleanupExpiredRateLimits deletes expired rows and leaves live rows intact', async () => {
  const t = convexTest(schema, modules)

  // Seed one expired row and one live row
  await t.run(async (ctx: MutationCtx) => {
    await ctx.db.insert('apiRateLimits', {
      ip: 'expired-ip',
      windowStart: Date.now() - (WINDOW_MS + 1_000), // 61 seconds ago — expired
      count: 5,
    })
    await ctx.db.insert('apiRateLimits', {
      ip: 'live-ip',
      windowStart: Date.now(), // just started — live
      count: 3,
    })
  })

  await t.mutation(internal.rateLimit.cleanupExpiredRateLimits, {})

  // Verify state after cleanup
  await t.run(async (ctx: MutationCtx) => {
    const expired = await ctx.db
      .query('apiRateLimits')
      .withIndex('by_ip', (q) => q.eq('ip', 'expired-ip'))
      .first()
    expect(expired).toBeNull()

    const live = await ctx.db
      .query('apiRateLimits')
      .withIndex('by_ip', (q) => q.eq('ip', 'live-ip'))
      .first()
    expect(live).not.toBeNull()
    expect(live!.count).toBe(3)
  })
})
