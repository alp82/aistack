import { v } from 'convex/values'
import { internal } from './_generated/api'
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from './_generated/server'
import { isAdmin } from './lib/admin'
import { generateUniqueShortId } from './lib/ids'
import { catalogFrom } from './lib/modelCatalog'
import {
  type DatasetModel,
  LITELLM_URL,
  MODELS_DEV_URL,
  formatRates,
  parseLiteLlm,
  parseModelsDev,
  planImport,
} from './lib/modelImport'

/**
 * The price and model import (#337). Daily by cron, or by hand from the admin
 * page. The rules are in `convex/lib/modelImport.ts`; this file is the IO
 * around them: one query reads the state, one action fetches the dataset and
 * plans, one mutation applies the plan and writes the log.
 *
 * A run that finds nothing changed writes nothing to `modelPrices` and
 * `models`, and one `run` line to the log. That is the contract the tests pin.
 */

const RatesV = v.object({
  input: v.number(),
  output: v.number(),
  cacheRead: v.optional(v.number()),
  cacheWrite5m: v.optional(v.number()),
  cacheWrite1h: v.optional(v.number()),
})

const PeriodInsertV = v.object({
  modelSlug: v.string(),
  from: v.number(),
  rates: RatesV,
  source: v.string(),
  before: v.union(RatesV, v.null()),
})

const ModelInsertV = v.object({
  name: v.string(),
  slug: v.string(),
  provider: v.string(),
  aliases: v.array(v.string()),
  iconUrl: v.optional(v.string()),
  contextWindow: v.optional(v.number()),
  reason: v.union(v.literal('dataset'), v.literal('measured')),
  rates: v.union(RatesV, v.null()),
})

const LOG_KEEP = 500

type RunResult = { periods: number; models: number; source: string }

/** Every measured id with tokens > 0 on a day (never inventory). */
export function measuredIdsWithTokens(
  days: ReadonlyArray<{
    usage?: { harnesses: Array<{ models: Array<{ model: string; tokens: Record<string, unknown> }> }> }
  }>
): string[] {
  const ids = new Set<string>()
  for (const day of days) {
    for (const h of day.usage?.harnesses ?? []) {
      for (const m of h.models) {
        const t = m.tokens as { input: number; output: number; cacheWrite: number; cacheRead: number }
        if (t.input + t.output + t.cacheWrite + t.cacheRead > 0) ids.add(m.model)
      }
    }
  }
  return [...ids].sort()
}

/**
 * The catalog, the periods and the measured ids, in one read. The days are
 * collected whole: the table is a few hundred rows a day of one machine, and
 * the ids are the only thing wanted from them.
 */
export const readState = internalQuery({
  args: {},
  handler: async (ctx) => {
    const [models, prices, days] = await Promise.all([
      ctx.db.query('models').collect(),
      ctx.db.query('modelPrices').collect(),
      ctx.db.query('measuredDays').collect(),
    ])
    return { models, prices, measuredIds: measuredIdsWithTokens(days) }
  },
})

/**
 * Apply a plan. Re-checks the slug against the table before inserting a row
 * (the plan was made from a snapshot) and skips a period that already exists
 * at the same `from`. Writes one log line per write and the run line last.
 */
export const apply = internalMutation({
  args: {
    periods: v.array(PeriodInsertV),
    models: v.array(ModelInsertV),
    source: v.string(),
    skipped: v.number(),
    now: v.number(),
  },
  returns: v.object({ periods: v.number(), models: v.number() }),
  handler: async (ctx, args) => {
    const { now, source } = args
    let periodsWritten = 0
    let modelsWritten = 0
    for (const p of args.periods) {
      const existing = await ctx.db
        .query('modelPrices')
        .withIndex('by_model', (q) =>
          q.eq('modelSlug', p.modelSlug).eq('provider', undefined).eq('from', p.from)
        )
        .first()
      if (existing) continue
      await ctx.db.insert('modelPrices', {
        modelSlug: p.modelSlug,
        from: p.from,
        ...p.rates,
        source,
        createdAt: now,
      })
      periodsWritten++
      await ctx.db.insert('importLog', {
        at: now,
        kind: 'price',
        modelSlug: p.modelSlug,
        detail: p.before
          ? `${formatRates(p.before)} -> ${formatRates(p.rates)} (${source})`
          : `first period ${formatRates(p.rates)} (${source})`,
      })
    }
    for (const m of args.models) {
      const taken = await ctx.db
        .query('models')
        .withIndex('by_slug', (q) => q.eq('slug', m.slug))
        .first()
      if (taken) continue
      const shortId = await generateUniqueShortId(ctx, 'models')
      await ctx.db.insert('models', {
        name: m.name,
        slug: m.slug,
        shortId,
        ...(m.aliases.length > 0 ? { aliases: m.aliases } : {}),
        provider: m.provider,
        category: 'coding',
        ...(m.iconUrl ? { iconUrl: m.iconUrl } : {}),
        ...(m.contextWindow !== undefined ? { contextWindow: m.contextWindow } : {}),
        reviewStatus: 'pending',
        createdBy: 'import',
        createdAt: now,
        updatedAt: now,
      })
      modelsWritten++
      if (m.rates) {
        await ctx.db.insert('modelPrices', {
          modelSlug: m.slug,
          from: now,
          ...m.rates,
          source,
          createdAt: now,
        })
      }
      await ctx.db.insert('importLog', {
        at: now,
        kind: 'model',
        modelSlug: m.slug,
        detail:
          m.reason === 'measured'
            ? `pending row for a measured id (${m.provider})${m.rates ? `, ${formatRates(m.rates)}` : ', unpriced'}`
            : `pending row from ${source} (${m.provider}), ${m.rates ? formatRates(m.rates) : 'unpriced'}`,
      })
    }
    await ctx.db.insert('importLog', {
      at: now,
      kind: 'run',
      detail: `${source}: ${periodsWritten} price ${periodsWritten === 1 ? 'change' : 'changes'}, ${modelsWritten} new pending ${modelsWritten === 1 ? 'row' : 'rows'}, ${args.skipped} dataset models outside the rule`,
    })
    // Keep the log bounded.
    const all = await ctx.db.query('importLog').withIndex('by_at').order('desc').collect()
    for (const old of all.slice(LOG_KEEP)) await ctx.db.delete(old._id)
    return { periods: periodsWritten, models: modelsWritten }
  },
})

export const logError = internalMutation({
  args: { detail: v.string(), now: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.insert('importLog', { at: args.now, kind: 'error', detail: args.detail })
  },
})

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  return res.json()
}

/** models.dev first; LiteLLM when it does not answer. */
export async function fetchDataset(): Promise<{ dataset: DatasetModel[]; source: string }> {
  const date = new Date().toISOString().slice(0, 10)
  try {
    const dataset = parseModelsDev(await fetchJson(MODELS_DEV_URL))
    if (dataset.length === 0) throw new Error('models.dev: empty dataset')
    return { dataset, source: `models.dev@${date}` }
  } catch (primary) {
    const dataset = parseLiteLlm(await fetchJson(LITELLM_URL))
    if (dataset.length === 0) {
      throw new Error(
        `both datasets failed: ${primary instanceof Error ? primary.message : String(primary)}; litellm: empty`
      )
    }
    return { dataset, source: `litellm@${date}` }
  }
}

/** The whole run. Errors land in the log, never in the cron's stderr only. */
export const run = internalAction({
  args: {},
  returns: v.object({ periods: v.number(), models: v.number(), source: v.string() }),
  handler: async (ctx): Promise<RunResult> => {
    const now = Date.now()
    try {
      const { dataset, source } = await fetchDataset()
      const state = await ctx.runQuery(internal.modelImport.readState, {})
      const plan = planImport({
        catalog: catalogFrom(state.models, state.prices),
        models: state.models,
        prices: state.prices,
        dataset,
        measuredIds: state.measuredIds,
        source,
        now,
      })
      const written: { periods: number; models: number } = await ctx.runMutation(internal.modelImport.apply, {
        periods: plan.periods,
        models: plan.models,
        source,
        skipped: plan.skipped,
        now,
      })
      return { ...written, source }
    } catch (e) {
      await ctx.runMutation(internal.modelImport.logError, {
        detail: e instanceof Error ? e.message : String(e),
        now,
      })
      throw e
    }
  },
})

/** The admin's "Run import now". Guarded server-side; the route gate is not protection. */
export const runNow = action({
  args: {},
  returns: v.object({ periods: v.number(), models: v.number(), source: v.string() }),
  handler: async (ctx): Promise<RunResult> => {
    if (!(await isAdmin(ctx))) throw new Error('Unauthorized')
    return await ctx.runAction(internal.modelImport.run, {})
  },
})

/** The log, newest first. Null for anyone but an admin. */
export const readLog = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) return null
    const rows = await ctx.db
      .query('importLog')
      .withIndex('by_at')
      .order('desc')
      .take(Math.min(args.limit ?? 100, LOG_KEEP))
    return rows.map((r) => ({
      _id: r._id,
      at: r.at,
      kind: r.kind,
      modelSlug: r.modelSlug ?? null,
      detail: r.detail,
    }))
  },
})
