/**
 * PROTOTYPE - throwaway. Runs the token-efficiency rules over whatever the
 * LOCAL database holds for a stack, with no owner gate, so a mirrored prod
 * export can be read on /prototype/token-efficiency-live without a sync.
 *
 * Prod has published no `workflow-aggregates/v4` day yet, so a harness with
 * no efficiency block gets an EMPTY one: the rules that read only context,
 * routing and effort atoms still fire, and the rest say what they wait for.
 * Never deploy this file; delete it with the prototype route.
 */
import {
  EFFICIENCY_RULES_V1,
  type EfficiencyDay,
  type EfficiencyHarness,
  type EfficiencyInsight,
  efficiencyInsights,
  efficiencyScorecard,
  foldHarnessDays,
  type HarnessDay,
  LOG_BUCKETS_V1,
  LOG_BUCKETS_V2,
} from '@aistack/workflow-rules'
import { v } from 'convex/values'
import { query } from './_generated/server'
import { loadModelCatalog } from './lib/modelCatalog'
import { measuredDaysForStack } from './lib/measuredDays'
import { sessionRows } from './lib/stats'
import { topModelOf, utcDayOf, type WorkflowDayRow } from './lib/workflow'

const DAY = 86_400_000

const emptyEfficiency = (): EfficiencyDay => ({
  countBucketRuleVersion: LOG_BUCKETS_V1,
  sizeBucketRuleVersion: LOG_BUCKETS_V2,
  callGaps: [],
  callsAfterGap: 0,
  cacheWriteAfterGap: 0,
  inputAfterGap: 0,
  orphanCacheWrites: 0,
  orphanCacheWriteTokens: 0,
  sessionMaxContext: [],
  sessionCalls: [],
  shortSessions: 0,
  shortSessionFirstCallTokens: 0,
  sessionsCompacted: 0,
  toolResults: [],
})

/** Stacks with stored days, most days first, so the page can find yours. */
export const stacks = query({
  args: {},
  handler: async (ctx) => {
    const stacks = await ctx.db.query('stacks').collect()
    const out: { slug: string; name: string; days: number; withWorkflow: number }[] = []
    for (const stack of stacks) {
      const rows = await measuredDaysForStack(ctx, stack._id)
      if (rows.length === 0) continue
      out.push({
        slug: `${stack.slug}-${stack.shortId}`,
        name: stack.name,
        days: rows.length,
        withWorkflow: rows.filter((r) => r.workflow).length,
      })
    }
    return out.sort((a, b) => b.days - a.days)
  },
})

export const live = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const parts = slug.split('-')
    const shortId = parts[parts.length - 1] ?? ''
    const stack = await ctx.db
      .query('stacks')
      .withIndex('by_shortId', (q) => q.eq('shortId', shortId))
      .first()
    if (!stack) return null
    const catalog = await loadModelCatalog(ctx)
    const now = Date.now()
    const to = utcDayOf(now)
    const from = utcDayOf(now - 29 * DAY)
    const all = (await measuredDaysForStack(ctx, stack._id)).filter(
      (row): row is WorkflowDayRow => row.workflow !== undefined,
    )
    const rows = sessionRows(all.filter((row) => row.date >= from && row.date <= to))
    const byHarness = new Map<string, HarnessDay[]>()
    for (const row of rows) {
      for (const harness of row.workflow.harnesses) {
        const held = byHarness.get(harness.harness) ?? []
        held.push(harness)
        byHarness.set(harness.harness, held)
      }
    }
    const insights: EfficiencyInsight[] = []
    const harnesses: {
      harness: string
      days: number
      sessions: number
      hasEfficiency: boolean
      hasContext: boolean
      hasRouting: boolean
      hasEffort: boolean
      topModel: string | null
      rates: { input: number; cacheWrite: number; source: string } | null
    }[] = []
    for (const [name, days] of byHarness) {
      const folded = foldHarnessDays(days)
      const tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
      let hasUsage = false
      for (const row of rows) {
        for (const h of row.usage?.harnesses ?? []) {
          if (h.harness !== name) continue
          hasUsage = true
          for (const m of h.models) {
            tokens.input += m.tokens.input
            tokens.output += m.tokens.output
            tokens.cacheRead += m.tokens.cacheRead
            tokens.cacheWrite += m.tokens.cacheWrite
          }
        }
      }
      const topModel = topModelOf(folded, rows)
      const period = topModel ? catalog.pricer.priceAt(topModel, now) : null
      const rates =
        topModel && period
          ? {
              model: topModel,
              input: period.input / 1e6,
              cacheWrite: period.cacheWrite5m / 1e6,
              source: period.source,
            }
          : null
      const input: EfficiencyHarness = {
        harness: name,
        sessions: folded.sessions,
        efficiency: folded.efficiency ?? emptyEfficiency(),
        ...(folded.context ? { context: folded.context } : {}),
        ...(folded.routing ? { routing: folded.routing } : {}),
        ...(folded.effort ? { effort: folded.effort } : {}),
        ...(hasUsage ? { tokens } : {}),
        rates: stack.publishCost === false ? null : rates,
      }
      insights.push(...efficiencyInsights(input))
      harnesses.push({
        harness: name,
        days: days.length,
        sessions: folded.sessions,
        hasEfficiency: folded.efficiency !== undefined,
        hasContext: folded.context !== undefined,
        hasRouting: folded.routing !== undefined,
        hasEffort: folded.effort !== undefined,
        topModel,
        rates: rates ? { input: rates.input, cacheWrite: rates.cacheWrite, source: rates.source } : null,
      })
    }
    const tiles = efficiencyScorecard(insights)
    return {
      stack: { name: stack.name, slug, publishCost: stack.publishCost !== false },
      window: { from, to, days: rows.length },
      rulesVersion: EFFICIENCY_RULES_V1,
      harnesses,
      insights,
      tiles,
      recoverableUsd: tiles.reduce((n, t) => n + (t.usd ?? 0), 0),
      pricingTables: [...new Set(harnesses.flatMap((h) => (h.rates ? [h.rates.source] : [])))],
    }
  },
})
