import { v } from 'convex/values'
import { internalMutation, mutation } from './_generated/server'
import type { MutationCtx } from './_generated/server'

const WINDOW_MS = 60_000
const CLEANUP_BATCH = 500

/** The public cap, and the one every IP-keyed caller gets. */
export const DEFAULT_MAX_REQUESTS = 60

/**
 * The cap used when the caller cannot be told apart from every other caller.
 *
 * `/api/cli/auth/start` reaches Convex through the TanStack proxy, so without a
 * trusted client-address header EVERY proxied login on earth shares one bucket.
 * Keyed at 60 there, one busy minute locks out login for everybody at once - a
 * missing env var must degrade, not lock out. This number still bounds a
 * runaway loop, which is the growth this limiter exists to stop.
 */
export const SHARED_BUCKET_MAX_REQUESTS = 600

const RESULT = v.object({
  allowed: v.boolean(),
  limit: v.number(),
  remaining: v.number(),
  resetAt: v.number(),
  retryAfterSeconds: v.number(),
})

type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}

/**
 * The ONE limiter. Everything that limits anything calls this.
 *
 * `key` is opaque and namespaced by its caller (`ip:1.2.3.4`,
 * `cli-token:<id>`), so two kinds of caller can never collide in one bucket.
 */
export async function consume(
  ctx: MutationCtx,
  key: string,
  maxRequests: number,
): Promise<RateLimitResult> {
  const now = Date.now()
  const row = await ctx.db
    .query('apiRateLimits')
    .withIndex('by_key', (q) => q.eq('key', key))
    .first()

  // FRESH - no row, or the existing window has elapsed.
  if (!row || now - row.windowStart >= WINDOW_MS) {
    if (row) {
      await ctx.db.patch(row._id, { windowStart: now, count: 1 })
    } else {
      await ctx.db.insert('apiRateLimits', { key, windowStart: now, count: 1 })
    }
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetAt: now + WINDOW_MS,
      retryAfterSeconds: Math.ceil(WINDOW_MS / 1000),
    }
  }

  const resetAt = row.windowStart + WINDOW_MS
  const retryAfterSeconds = Math.max(0, Math.ceil((resetAt - now) / 1000))

  // LIVE UNDER LIMIT - window active, still has headroom.
  if (row.count < maxRequests) {
    const newCount = row.count + 1
    await ctx.db.patch(row._id, { count: newCount })
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - newCount,
      resetAt,
      retryAfterSeconds,
    }
  }

  // LIVE SATURATED - window active and at/over the cap; do not increment.
  return { allowed: false, limit: maxRequests, remaining: 0, resetAt, retryAfterSeconds }
}

/**
 * The PUBLIC entry point, called from the TanStack server routes through
 * `ConvexHttpClient` - which can only reach public functions, which is the only
 * reason this one is not internal.
 *
 * IT TAKES NO CAP. A caller-supplied limit on a public mutation is a
 * caller-supplied bypass: pass a large enough number and the bucket never
 * saturates. Callers that need a different cap are inside Convex and use
 * `checkRateLimit` below.
 */
export const checkApiRateLimit = mutation({
  args: { key: v.string() },
  returns: RESULT,
  handler: async (ctx, args) => consume(ctx, args.key, DEFAULT_MAX_REQUESTS),
})

/**
 * The INTERNAL entry point, for `httpAction`s that resolve their own key (#52).
 *
 * `limit` is safe here in a way it is not on the public function: an internal
 * mutation is unreachable from outside Convex, so the number always comes from
 * our own code.
 */
export const checkRateLimit = internalMutation({
  args: { key: v.string(), limit: v.optional(v.number()) },
  returns: RESULT,
  handler: async (ctx, args) => consume(ctx, args.key, args.limit ?? DEFAULT_MAX_REQUESTS),
})

/**
 * Hourly cleanup that deletes up to CLEANUP_BATCH expired apiRateLimits rows
 * per run via the by_windowStart index.
 *
 * A row is expired when its window has elapsed: windowStart <= now - WINDOW_MS.
 * The hourly cadence keeps pace with trailing-hour distinct-caller volume
 * without ever scanning the full table.
 *
 * This is also what drains the pre-rename rows: `windowStart` is on every row
 * regardless of whether it is keyed by `key` or the old `ip`, so a row the new
 * reader can no longer see is still collected here within the hour.
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
