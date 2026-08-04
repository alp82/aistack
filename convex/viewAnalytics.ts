// The read side of view counting (#86, map #76).
//
// STRICTLY PRIVATE, and the guard is structural. This query takes NO target
// argument: it derives the caller's creator row from the authenticated session
// and reads only the counters of that creator's own profile and stacks. There is
// nothing for a caller to substitute, which is the difference between this and
// the repo's earlier public functions that leaned on a client-side route guard.
//
// What the number means, in one sentence the page repeats: deduped daily
// visitors — approximate browser and network combinations per UTC day, per page,
// with authenticated owner views excluded. Never people, never impressions.

import { v } from 'convex/values'
import type { Infer } from 'convex/values'
import { query } from './_generated/server'
import type { QueryCtx } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import { ReferrerBucket } from './schema'
import { utcDayStart } from './views'

type ReferrerBucketValue = Infer<typeof ReferrerBucket>

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * The window every number on the page covers.
 *
 * Thirty days matches the rolling window the rest of the site already speaks in,
 * and it bounds the read at `targets x 30 x buckets` rows.
 */
const WINDOW_DAYS = 30

/** One day of one target, shaped as the chart module's point input. */
const DayPoint = v.object({ at: v.number(), value: v.number() })

const ViewTarget = v.object({
  kind: v.union(v.literal('profile'), v.literal('stack')),
  /** The document id the counter rows are filed under. */
  targetId: v.string(),
  label: v.string(),
  /** The path a visitor would open. */
  href: v.string(),
  /**
   * Whether anyone but the owner can reach the page. False for a draft stack,
   * whose counter is therefore always zero.
   */
  openable: v.boolean(),
  total: v.number(),
  /** Empty when nothing was ever counted. Otherwise one entry per day. */
  days: v.array(DayPoint),
})

async function callerCreator(ctx: QueryCtx): Promise<Doc<'creators'> | null> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) return null
  const userId = identity.tokenIdentifier.split('|')[1]
  return await ctx.db
    .query('creators')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .first()
}

/**
 * Fill every day from the first counted one through today.
 *
 * A quiet day is a real zero and has to be drawn as one — a line jumped straight
 * from Monday to Friday claims visits on Wednesday. The fill starts at the first
 * counted day and NOT at the window start, because counting began on a date and
 * "0 views" for a day nobody was counting is a claim rather than a gap.
 */
function fillDays(
  byDay: Map<number, number>,
  endDayMs: number
): { at: number; value: number }[] {
  if (byDay.size === 0) return []
  const first = Math.min(...byDay.keys())
  const days: { at: number; value: number }[] = []
  for (let at = first; at <= endDayMs; at += DAY_MS) {
    days.push({ at, value: byDay.get(at) ?? 0 })
  }
  return days
}

export const mine = query({
  args: {},
  returns: v.union(
    v.object({
      windowDays: v.number(),
      /** UTC midnight of the oldest day the window can hold. */
      windowStartMs: v.number(),
      /** UTC midnight of today, the last day in every series. */
      endDayMs: v.number(),
      /** The oldest day with a counted visit, or null when there are none. */
      firstCountedDayMs: v.union(v.number(), v.null()),
      total: v.number(),
      targets: v.array(ViewTarget),
      /** Non-empty buckets only, largest first. */
      referrers: v.array(v.object({ bucket: ReferrerBucket, count: v.number() })),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const creator = await callerCreator(ctx)
    if (!creator) return null

    const endDayMs = utcDayStart(Date.now())
    const windowStartMs = endDayMs - (WINDOW_DAYS - 1) * DAY_MS

    const stacks = await ctx.db
      .query('stacks')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', creator._id))
      .collect()

    // The profile leads, then each stack. The aggregate counter is deliberately
    // absent: it has no owner document, so it belongs to nobody.
    const wanted: {
      kind: 'profile' | 'stack'
      targetKind: 'creator' | 'stack'
      targetId: string
      label: string
      href: string
      openable: boolean
    }[] = [
      {
        kind: 'profile',
        targetKind: 'creator',
        targetId: creator._id,
        label: 'Your profile',
        href: `/${creator.slug}`,
        openable: true,
      },
      ...stacks.map((s) => ({
        kind: 'stack' as const,
        targetKind: 'stack' as const,
        targetId: s._id as string,
        label: s.name,
        href: `/stacks/${s.slug}`,
        openable: s.published,
      })),
    ]

    const referrers = new Map<ReferrerBucketValue, number>()
    const targets = []
    let total = 0
    let firstCountedDayMs: number | null = null

    for (const t of wanted) {
      const rows = await ctx.db
        .query('viewCounters')
        .withIndex('by_target_day', (q) =>
          q
            .eq('targetKind', t.targetKind)
            .eq('targetId', t.targetId)
            .gte('dayStartMs', windowStartMs)
        )
        .collect()

      const byDay = new Map<number, number>()
      let targetTotal = 0
      for (const row of rows) {
        byDay.set(row.dayStartMs, (byDay.get(row.dayStartMs) ?? 0) + row.count)
        referrers.set(
          row.referrerBucket,
          (referrers.get(row.referrerBucket) ?? 0) + row.count
        )
        targetTotal += row.count
        if (firstCountedDayMs === null || row.dayStartMs < firstCountedDayMs) {
          firstCountedDayMs = row.dayStartMs
        }
      }

      total += targetTotal
      targets.push({
        kind: t.kind,
        targetId: t.targetId,
        label: t.label,
        href: t.href,
        openable: t.openable,
        total: targetTotal,
        days: fillDays(byDay, endDayMs),
      })
    }

    return {
      windowDays: WINDOW_DAYS,
      windowStartMs,
      endDayMs,
      firstCountedDayMs,
      total,
      targets,
      referrers: [...referrers.entries()]
        .map(([bucket, count]) => ({ bucket, count }))
        .sort((a, b) => b.count - a.count || a.bucket.localeCompare(b.bucket)),
    }
  },
})
