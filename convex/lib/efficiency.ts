/**
 * The owner's token-efficiency scorecard over the fixed 30-day window.
 *
 * Reads the v4 efficiency atoms beside the context, routing and effort
 * blocks of every machine's days, folds them per harness across machines
 * (the same all-machine session fold web Stats uses, ADR-0009), and hands
 * each harness to the pure rules in `@aistack/workflow-rules`. Dollars enter
 * only under `publishCost`, at the harness's top model rate from the catalog,
 * and every figure that prints says so.
 *
 * OWNER ONLY. The query that calls this checks the viewer is the stack's
 * creator; nothing here reaches the public page, the HTTP API or Discord.
 */
import {
  EFFICIENCY_RULES_V1,
  type EfficiencyHarness,
  type EfficiencyInsight,
  type EfficiencyRates,
  efficiencyInsights,
  efficiencyScorecard,
  foldHarnessDays,
  type HarnessDay,
} from '@aistack/workflow-rules'
import type { ModelCatalog } from './modelCatalog'
import { sessionRows } from './stats'
import { topModelOf, utcDayOf, type WorkflowDayRow } from './workflow'

const DAY = 86_400_000

export type EfficiencyView = {
  window: { from: string; to: string }
  rulesVersion: string
  /** One tile per lever, the worst harness's, ranked. Passing rules last. */
  tiles: EfficiencyInsight[]
  /** The sum of every bounded dollar figure, or null when cost is not published. */
  recoverableUsd: number | null
  /** The price tables the dollar figures cite. */
  pricingTables: string[]
}

/** The harness's top model rate at `now`, per token, or null when unpriced. */
function ratesFor(
  harness: Pick<HarnessDay, 'harness' | 'routing'>,
  rows: readonly WorkflowDayRow[],
  catalog: ModelCatalog,
  now: number,
): EfficiencyRates | null {
  const model = topModelOf(harness, rows)
  if (model === null) return null
  const period = catalog.pricer.priceAt(model, now)
  if (!period) return null
  return {
    model,
    input: period.input / 1e6,
    cacheWrite: period.cacheWrite5m / 1e6,
    source: period.source,
  }
}

export function readEfficiency(
  all: readonly WorkflowDayRow[],
  now: number,
  catalog: ModelCatalog,
  publishCost: boolean,
): EfficiencyView | null {
  const to = utcDayOf(now)
  const from = utcDayOf(now - 29 * DAY)
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
  const pricingTables = new Set<string>()
  for (const days of byHarness.values()) {
    const folded = foldHarnessDays(days)
    if (!folded.efficiency) continue
    // The usage half's sums for this harness, when the window carries them.
    const tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
    let hasUsage = false
    for (const row of rows) {
      for (const h of row.usage?.harnesses ?? []) {
        if (h.harness !== folded.harness) continue
        hasUsage = true
        for (const m of h.models) {
          tokens.input += m.tokens.input
          tokens.output += m.tokens.output
          tokens.cacheRead += m.tokens.cacheRead
          tokens.cacheWrite += m.tokens.cacheWrite
        }
      }
    }
    const rates = publishCost ? ratesFor(folded, rows, catalog, now) : null
    if (rates) pricingTables.add(rates.source)
    const input: EfficiencyHarness = {
      harness: folded.harness,
      sessions: folded.sessions,
      efficiency: folded.efficiency,
      ...(folded.context ? { context: folded.context } : {}),
      ...(folded.routing ? { routing: folded.routing } : {}),
      ...(folded.effort ? { effort: folded.effort } : {}),
      ...(hasUsage ? { tokens } : {}),
      rates,
    }
    insights.push(...efficiencyInsights(input))
  }
  if (insights.length === 0) return null
  const tiles = efficiencyScorecard(insights)
  const bounded = tiles.filter((tile) => tile.usd !== null)
  return {
    window: { from, to },
    rulesVersion: EFFICIENCY_RULES_V1,
    tiles,
    recoverableUsd: publishCost
      ? bounded.reduce((sum, tile) => sum + (tile.usd ?? 0), 0)
      : null,
    pricingTables: [...pricingTables].sort(),
  }
}
