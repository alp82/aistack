import { v } from 'convex/values'
import { internalMutation, mutation } from './_generated/server'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 60
const CLEANUP_BATCH = 500

export const checkApiRateLimit = mutation({
  args: { ip: v.string() },
  returns: v.object({
    allowed: v.boolean(),
    limit: v.number(),
    remaining: v.number(),
    resetAt: v.number(),
    retryAfterSeconds: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now()
    const row = await ctx.db
      .query('apiRateLimits')
      .withIndex('by_ip', (q) => q.eq('ip', args.ip))
      .first()

    // FRESH — no row, or the existing window has elapsed.
    if (!row || now - row.windowStart >= WINDOW_MS) {
      if (row) {
        await ctx.db.patch(row._id, { windowStart: now, count: 1 })
      } else {
        await ctx.db.insert('apiRateLimits', { ip: args.ip, windowStart: now, count: 1 })
      }
      return {
        allowed: true,
        limit: MAX_REQUESTS,
        remaining: MAX_REQUESTS - 1,
        resetAt: now + WINDOW_MS,
        retryAfterSeconds: Math.ceil(WINDOW_MS / 1000),
      }
    }

    const resetAt = row.windowStart + WINDOW_MS
    const retryAfterSeconds = Math.max(0, Math.ceil((resetAt - now) / 1000))

    // LIVE UNDER LIMIT — window active, still has headroom.
    if (row.count < MAX_REQUESTS) {
      const newCount = row.count + 1
      await ctx.db.patch(row._id, { count: newCount })
      return {
        allowed: true,
        limit: MAX_REQUESTS,
        remaining: MAX_REQUESTS - newCount,
        resetAt,
        retryAfterSeconds,
      }
    }

    // LIVE SATURATED — window active and at/over the cap; do not increment.
    return {
      allowed: false,
      limit: MAX_REQUESTS,
      remaining: 0,
      resetAt,
      retryAfterSeconds,
    }
  },
})

/**
 * Hourly internal mutation that deletes up to CLEANUP_BATCH expired
 * apiRateLimits rows per run via the by_windowStart index.
 * A row is expired when its window has elapsed: windowStart <= now - WINDOW_MS.
 * The hourly cadence keeps pace with trailing-hour distinct-IP volume without
 * ever scanning the full table.
 */
export const cleanupExpiredRateLimits = internalMutation({
  args: {},
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx) => {
    const now = Date.now()
    const cutoff = now - WINDOW_MS
    const expired = await ctx.db
      .query('apiRateLimits')
      .withIndex('by_windowStart', (q) => q.lte('windowStart', cutoff))
      .take(CLEANUP_BATCH)
    let deleted = 0
    for (const row of expired) {
      await ctx.db.delete(row._id)
      deleted++
    }
    return { deleted }
  },
})
