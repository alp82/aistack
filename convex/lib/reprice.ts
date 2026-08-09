/**
 * Read-time repricing of a published measured snapshot. Wayfinder ticket #93
 * (map #76).
 *
 * WHY THIS EXISTS
 * A snapshot's cost is frozen at whatever price table the syncing CLI happened
 * to ship. One day of drift produced this on prod (2026-08-04): a stack with
 * 279B Codex tokens published $14,764 when the same tokens are worth at least
 * $167,331, and a second stack published nothing at all — because
 * `openai-list-2026-08-01` has no rate for the gpt-5.6 family. Snapshots are
 * immutable, so the repair happens where catalog resolution already happens: at
 * read time, against the shared table in `@aistack/pricing`.
 *
 * GAPS ONLY (#82). A model that carries `apiEquivalentUSD` keeps it. The CLI
 * priced each response at its own timestamp and split cache writes into 5-minute
 * and 1-hour tiers, so its figure is exact. Only a model with no dollars at all
 * gets an estimate. One reading can therefore be part exact and part estimated.
 *
 * EVERY ESTIMATE IS BIASED LOW, ON PURPOSE
 * Two facts are lost by the time a payload lands, and both are resolved
 * downward so the result stays a lower bound:
 *
 *   1. The wire carries ONE merged `cacheWrite`. The 5m tier costs 1.25x input
 *      and the 1h tier 2.0x, and the split is gone — so everything charges the
 *      5m rate. Measured against a stack the CLI priced exactly, this
 *      under-reports Claude Code by roughly 8%. Codex is exact, because every
 *      Codex row carries `cacheWrite: 0`.
 *   2. There are no per-response timestamps. When the window straddles a
 *      repricing (`claude-sonnet-5` on 2026-09-01), the share of tokens on each
 *      side is unknowable, so the CHEAPER rate prices the whole window.
 *
 * A one-directional bias is what makes the "at least" framing on the stack page
 * and the leaderboard sound. Do not add a heuristic that can overstate.
 *
 * CONSENT IS A FLAG, NOT AN ABSENCE. Cost publishes only when the owner has
 * `publishCost` on. This module takes that flag and strips every dollar when it
 * is off, including dollars already stored in the payload — an owner who turns
 * cost off after a sync has turned it off for the rows already sent.
 */

import {
  cacheMultipliersFor,
  pricePeriodsInWindow,
  pricingTableFor,
} from '@aistack/pricing'

/** The token block on the wire — one merged `cacheWrite`, no TTL split. */
export type WireTokens = {
  input: number
  output: number
  cacheWrite: number
  cacheRead: number
}

export type WireModel = {
  id: string
  tokens: WireTokens
  apiEquivalentUSD?: number
}

/** The reported window, as the two UTC date strings the payload carries. */
export type SnapshotWindow = { from: string; to: string }

export type RepricedModel<T> = T & {
  apiEquivalentUSD?: number
  /** True when the dollars above came from this module, not from the CLI. */
  costEstimated: boolean
}

/**
 * What a surface needs to print money honestly. Every figure is USD over the
 * snapshot's own window.
 */
export type CostReading = {
  /** `published + estimated`. Never an equality — always "at least this much". */
  lowerBoundUSD: number
  /** The part the CLI priced exactly. */
  publishedUSD: number
  /** The part priced here, from the shared table. */
  estimatedUSD: number
  /**
   * Share of measured tokens carrying a citable price, 0..1. Below 1 the
   * missing tokens are real spend that no table can name — `unknown` rows and
   * models no vendor list page covers. A surface that prints dollars must print
   * this too.
   */
  coverage: number
  /** The numerator of `coverage`. Carried so several readings can merge exactly. */
  pricedTokens: number
  /** The denominator of `coverage` — every token the snapshot's models report. */
  measuredTokens: number
  /** Every table cited by the dollars above, in payload-then-estimate order. */
  pricingTables: string[]
}

const M = 1_000_000
/** Cents. The CLI rounds its published dollars the same way. */
export const round2 = (n: number) => Math.round(n * 100) / 100

const tokensOf = (t: WireTokens) =>
  t.input + t.output + t.cacheWrite + t.cacheRead

/**
 * The window as an epoch-ms range. `null` when either end is unreadable — an
 * undated window cannot pick a rate, and substituting "now" would attribute
 * today's price to a record that may predate it.
 */
function windowRange(w: SnapshotWindow): { from: number; to: number } | null {
  const from = Date.parse(`${w.from}T00:00:00.000Z`)
  const to = Date.parse(`${w.to}T23:59:59.999Z`)
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return null
  return { from, to }
}

/**
 * The cheapest dollars this model's tokens can have cost over the window, or
 * `null` when no citable rate covers it.
 *
 * "Cheapest" is the whole policy: when more than one rate applies, each is
 * costed and the smallest wins.
 */
export function estimateModelUSD(
  id: string,
  t: WireTokens,
  window: SnapshotWindow
): number | null {
  const range = windowRange(window)
  if (!range) return null
  const periods = pricePeriodsInWindow(id, range.from, range.to)
  if (periods.length === 0) return null
  // The multipliers are the model's vendor's, not Anthropic's — a Google cache
  // write is charged as plain input, and 1.25x there would overstate.
  const c = cacheMultipliersFor(id)
  const costs = periods.map(
    (p) =>
      (t.input * p.input +
        t.output * p.output +
        t.cacheWrite * p.input * c.write5m +
        t.cacheRead * p.input * c.read) /
      M
  )
  return round2(Math.min(...costs))
}

export function repriceSnapshot<T extends WireModel>(input: {
  models: readonly T[]
  window: SnapshotWindow
  /** `payload.pricingTable` — the citation for the dollars already on the wire. */
  publishedTable: string | null
  /** `stacks.publishCost`, absent reading as ON. */
  publishCost: boolean
}): {
  models: RepricedModel<T>[]
  /** `null` when cost is off, and when nothing in the snapshot can be priced. */
  cost: CostReading | null
  /** Tokens that moved from unpriced to priced, so the caller can shrink
   *  `excludedTokens.unpriced` by the same amount. */
  repricedTokens: number
} {
  const { models, window, publishedTable, publishCost } = input

  if (!publishCost) {
    return {
      models: models.map((m) => {
        const { apiEquivalentUSD: _dropped, ...rest } = m
        return { ...(rest as T), costEstimated: false }
      }),
      cost: null,
      repricedTokens: 0,
    }
  }

  let publishedUSD = 0
  let estimatedUSD = 0
  let pricedTokens = 0
  let repricedTokens = 0
  let totalTokens = 0
  const estimateTables = new Set<string>()

  const out = models.map((m): RepricedModel<T> => {
    const size = tokensOf(m.tokens)
    totalTokens += size

    if (m.apiEquivalentUSD !== undefined) {
      publishedUSD += m.apiEquivalentUSD
      pricedTokens += size
      return { ...m, costEstimated: false }
    }

    const usd = estimateModelUSD(m.id, m.tokens, window)
    if (usd === null) return { ...m, costEstimated: false }

    estimatedUSD += usd
    pricedTokens += size
    repricedTokens += size
    const table = pricingTableFor(m.id)
    if (table) estimateTables.add(table)
    return { ...m, apiEquivalentUSD: usd, costEstimated: true }
  })

  if (pricedTokens === 0) return { models: out, cost: null, repricedTokens: 0 }

  // The payload's own table leads: it cites the exact dollars, and the estimate
  // is the addition. A table already named by the payload is not repeated.
  const pricingTables = [
    ...(publishedUSD > 0 && publishedTable ? [publishedTable] : []),
    ...[...estimateTables].filter(
      (t) => !(publishedUSD > 0 && t === publishedTable)
    ),
  ]

  return {
    models: out,
    cost: {
      lowerBoundUSD: round2(publishedUSD + estimatedUSD),
      publishedUSD: round2(publishedUSD),
      estimatedUSD: round2(estimatedUSD),
      coverage: totalTokens > 0 ? pricedTokens / totalTokens : 0,
      pricedTokens,
      measuredTokens: totalTokens,
      pricingTables,
    },
    repricedTokens,
  }
}
