// The view-counting write side (#77, map #76).
//
// What the number means: `IP + User-Agent` merges people behind one NAT and
// splits one person across networks. Every surface calls this **deduped daily
// visitors** — approximate browser and network combinations per UTC day. It is
// never presented as people, and never as impressions.

import { v } from 'convex/values'
import { internalMutation, mutation } from './_generated/server'
import type { MutationCtx } from './_generated/server'
import { ReferrerBucket, ViewTargetKind } from './schema'
import { consume } from './rateLimit'
import { isAdmin } from './lib/admin'
import type { Infer } from 'convex/values'

type ViewTargetKindValue = Infer<typeof ViewTargetKind>

const DAY_MS = 24 * 60 * 60 * 1000

/** UTC midnight of the day `ms` falls in. */
export function utcDayStart(ms: number): number {
  return Math.floor(ms / DAY_MS) * DAY_MS
}

/** The one target id the aggregate page uses. It has no document. */
export const AGGREGATE_TARGET_ID = 'global'

/**
 * Views one address may file per minute.
 *
 * Set well above real reading speed and well below what a loop can do. It does
 * not stop a determined inflater — they can vary `visitorHash` freely within
 * the cap — it stops one from filling the table.
 */
const VIEWS_PER_MINUTE = 120

/**
 * The user who owns this target, or `null` when nobody does.
 *
 * The aggregate counter has no owner, so it is admin-only on the read side.
 * "Owner-private" is a per-target rule here, not a global one.
 */
async function ownerOf(
  ctx: MutationCtx,
  targetKind: ViewTargetKindValue,
  targetId: string
): Promise<{ exists: boolean; userId: string | null }> {
  if (targetKind === 'aggregate') {
    return { exists: targetId === AGGREGATE_TARGET_ID, userId: null }
  }
  if (targetKind === 'creator') {
    const creatorId = ctx.db.normalizeId('creators', targetId)
    if (!creatorId) return { exists: false, userId: null }
    const creator = await ctx.db.get(creatorId)
    return { exists: creator !== null, userId: creator?.userId ?? null }
  }
  const stackId = ctx.db.normalizeId('stacks', targetId)
  if (!stackId) return { exists: false, userId: null }
  const stack = await ctx.db.get(stackId)
  if (!stack) return { exists: false, userId: null }
  const creator = await ctx.db.get(stack.creatorId)
  return { exists: true, userId: creator?.userId ?? null }
}

/**
 * Count one view.
 *
 * THE VIEWER IDENTITY IS NEVER AN ARGUMENT. A public mutation taking a
 * `viewerUserId` would let any caller suppress a competitor's views or
 * attribute their own — the same shape as this repo's existing
 * public-function auth gap. The identity is read from the authenticated
 * session the web server forwards, and from nowhere else.
 *
 * `dayStartMs` is likewise derived here rather than accepted, so a caller
 * cannot backdate a view into a closed day. The web server's own notion of the
 * day still rides inside `visitorHash`, which is what rotates the hash daily.
 *
 * `visitorHash` IS an argument, because computing it needs the raw IP and the
 * raw IP must not reach Convex. A caller who invents hashes can inflate their
 * own target's counter. That is accepted: the number is private to the owner
 * and ranks nothing, and the alternative is shipping IP addresses into the
 * database to defend a dashboard against its own owner.
 */
export const record = mutation({
  args: {
    targetKind: ViewTargetKind,
    targetId: v.string(),
    visitorHash: v.string(),
    /**
     * A per-address pseudonym — HMAC over the client IP alone, with no target
     * and no day in it, so one caller shares one bucket across every page.
     * Bounds row growth from a loop that varies `visitorHash` on every call.
     */
    rateKey: v.string(),
    referrerBucket: ReferrerBucket,
  },
  returns: v.object({ counted: v.boolean() }),
  handler: async (ctx, args) => {
    const rl = await consume(ctx, `view:${args.rateKey}`, VIEWS_PER_MINUTE)
    if (!rl.allowed) return { counted: false }

    const target = await ownerOf(ctx, args.targetKind, args.targetId)
    if (!target.exists) return { counted: false }

    // A signed-out owner cannot be recognized, which is why every surface says
    // "authenticated owner views excluded" and not "your own views excluded".
    const identity = await ctx.auth.getUserIdentity()
    const viewerId = identity?.tokenIdentifier.split('|')[1] ?? null
    if (viewerId !== null && viewerId === target.userId) {
      return { counted: false }
    }

    // The aggregate counter's owner is the site's admin (#132). It exists so
    // the admin can read a campaign, and their own browsing must not be in it.
    // Per-target counters are untouched — there the admin is an ordinary
    // visitor.
    if (args.targetKind === 'aggregate' && (await isAdmin(ctx))) {
      return { counted: false }
    }

    const dayStartMs = utcDayStart(Date.now())

    const seen = await ctx.db
      .query('viewDedupe')
      .withIndex('by_target_day_hash', (q) =>
        q
          .eq('targetKind', args.targetKind)
          .eq('targetId', args.targetId)
          .eq('dayStartMs', dayStartMs)
          .eq('visitorHash', args.visitorHash)
      )
      .first()
    if (seen) return { counted: false }

    await ctx.db.insert('viewDedupe', {
      targetKind: args.targetKind,
      targetId: args.targetId,
      dayStartMs,
      visitorHash: args.visitorHash,
    })

    const bucketRow = await ctx.db
      .query('viewCounters')
      .withIndex('by_target_day', (q) =>
        q
          .eq('targetKind', args.targetKind)
          .eq('targetId', args.targetId)
          .eq('dayStartMs', dayStartMs)
      )
      .filter((q) => q.eq(q.field('referrerBucket'), args.referrerBucket))
      .first()

    if (bucketRow) {
      await ctx.db.patch(bucketRow._id, { count: bucketRow.count + 1 })
    } else {
      await ctx.db.insert('viewCounters', {
        targetKind: args.targetKind,
        targetId: args.targetId,
        dayStartMs,
        referrerBucket: args.referrerBucket,
        count: 1,
      })
    }

    return { counted: true }
  },
})

/** One sweep's ceiling, so a backlog drains over several runs instead of
 * blowing one transaction. */
const GC_BATCH = 1000

/**
 * Delete spent dedupe markers.
 *
 * TODAY AND YESTERDAY SURVIVE. A marker only has to outlive the day it guards,
 * but keeping one extra day means a delayed retry crossing UTC midnight cannot
 * double-count. `viewCounters` is permanent and never downsampled — it grows
 * with `targets x active days x buckets used`, not with traffic.
 */
export const gcDedupe = internalMutation({
  args: {},
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx) => {
    const cutoff = utcDayStart(Date.now()) - DAY_MS
    const stale = await ctx.db
      .query('viewDedupe')
      .withIndex('by_day', (q) => q.lt('dayStartMs', cutoff))
      .take(GC_BATCH)

    for (const row of stale) {
      await ctx.db.delete(row._id)
    }
    return { deleted: stale.length }
  },
})
