import { PRICED_LANES, vendorModelId } from '@aistack/pricing'
import type { Doc } from '../_generated/dataModel'
import { type ModelCatalog, resolveModelId } from './modelCatalog'

/**
 * The price and model import, as pure rules (#337). `planImport` takes what
 * the database holds and what the dataset says and returns the writes; the
 * Convex action fetches, and the mutation applies. Nothing in here touches IO,
 * so this is where a rule gets tested.
 *
 * Two datasets are understood. models.dev `api.json` is primary; LiteLLM's
 * `model_prices_and_context_window.json` is the fallback when models.dev does
 * not answer. Neither carries dated history, so the import dates a change to
 * the run that saw it (ADR-0012, #333).
 */

export const MODELS_DEV_URL = 'https://models.dev/api.json'
export const LITELLM_URL =
  'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'

/** One dataset model in the shape the planner compares. USD per million tokens. */
export type DatasetModel = {
  /** The vendor's bare API id as the dataset spells it. */
  id: string
  /** The dataset's provider id (`anthropic`, `moonshotai`, ...). */
  providerId: string
  name: string
  input: number
  output: number
  cacheRead?: number
  cacheWrite5m?: number
  cacheWrite1h?: number
  contextWindow?: number
  /** `YYYY-MM-DD` where the dataset has one. */
  releaseDate?: string
  /** True when the model reads text and writes only text. */
  textOnly: boolean
  /** An https icon the dataset offers, if any. */
  iconUrl?: string
}

/**
 * The vendors whose unknown models become pending rows. Keys are the dataset
 * provider ids; values are the catalog's `models.provider` spelling. A vendor
 * outside this list still gets price updates for rows the catalog already
 * holds, but the import never creates a row for it.
 */
export const VENDOR_ALLOWLIST: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  xai: 'xAI',
  moonshotai: 'Moonshot AI',
  deepseek: 'DeepSeek',
  zai: 'Zhipu AI',
  minimax: 'MiniMax',
}

/** A dataset model older than this is not created. Rate updates ignore it. */
export const CREATE_WINDOW_DAYS = 180

const DAY_MS = 24 * 60 * 60 * 1000

/** The catalog's provider name as a dataset provider id, or null. */
export function datasetProviderOf(provider: string | undefined): string | null {
  const p = (provider ?? '').trim().toLowerCase()
  if (!p) return null
  for (const [id, name] of Object.entries(VENDOR_ALLOWLIST)) {
    if (p === id || p === name.toLowerCase()) return id
  }
  if (p === 'google deepmind') return 'google'
  if (p === 'moonshot' || p === 'moonshotai') return 'moonshotai'
  if (p === 'z.ai' || p === 'zhipu') return 'zai'
  return null
}

function num(x: unknown): number | undefined {
  return typeof x === 'number' && Number.isFinite(x) ? x : undefined
}

/** Parse models.dev `api.json`: `{ [providerId]: { models: { [id]: {...} } } }`. */
export function parseModelsDev(json: unknown): DatasetModel[] {
  const out: DatasetModel[] = []
  if (!json || typeof json !== 'object') return out
  for (const [providerId, provider] of Object.entries(json as Record<string, any>)) {
    const models = provider?.models
    if (!models || typeof models !== 'object') continue
    for (const [id, m] of Object.entries(models as Record<string, any>)) {
      const input = num(m?.cost?.input)
      const output = num(m?.cost?.output)
      if (input === undefined || output === undefined) continue
      const inputs: string[] = Array.isArray(m?.modalities?.input) ? m.modalities.input : []
      const outputs: string[] = Array.isArray(m?.modalities?.output) ? m.modalities.output : []
      const cacheRead = num(m.cost.cache_read)
      const cacheWrite5m = num(m.cost.cache_write)
      out.push({
        id,
        providerId,
        name: typeof m?.name === 'string' && m.name.trim() ? m.name.trim() : id,
        input,
        output,
        ...(cacheRead !== undefined ? { cacheRead } : {}),
        ...(cacheWrite5m !== undefined ? { cacheWrite5m } : {}),
        ...(num(m?.limit?.context) !== undefined ? { contextWindow: m.limit.context } : {}),
        ...(typeof m?.release_date === 'string' ? { releaseDate: m.release_date } : {}),
        textOnly: inputs.includes('text') && outputs.length === 1 && outputs[0] === 'text',
        iconUrl: `https://models.dev/logos/${providerId}.svg`,
      })
    }
  }
  return out
}

/**
 * Parse LiteLLM's table: `{ [key]: { litellm_provider, input_cost_per_token,
 * ... } }`. Per-token costs become per-million. Only the bare keys are kept: a
 * `vertex_ai/...` or `us.anthropic....` key is a re-serving, and the planner
 * wants the vendor's own id. Provider ids are mapped onto the models.dev
 * spelling where the two differ.
 */
export function parseLiteLlm(json: unknown): DatasetModel[] {
  const out: DatasetModel[] = []
  if (!json || typeof json !== 'object') return out
  const providerMap: Record<string, string> = {
    gemini: 'google',
    vertex_ai: 'google',
    moonshot: 'moonshotai',
  }
  for (const [key, m] of Object.entries(json as Record<string, any>)) {
    if (key === 'sample_spec' || key.includes('/') || !m || typeof m !== 'object') continue
    const input = num(m.input_cost_per_token)
    const output = num(m.output_cost_per_token)
    if (input === undefined || output === undefined) continue
    if (m.mode !== undefined && m.mode !== 'chat' && m.mode !== 'responses') continue
    const providerRaw = typeof m.litellm_provider === 'string' ? m.litellm_provider : ''
    const providerId = providerMap[providerRaw] ?? providerRaw
    if (!providerId) continue
    const perMillion = (x: number | undefined) =>
      x === undefined ? undefined : Math.round(x * 1e6 * 1e6) / 1e6
    const cacheRead = perMillion(num(m.cache_read_input_token_cost))
    const cacheWrite5m = perMillion(num(m.cache_creation_input_token_cost))
    const cacheWrite1h = perMillion(num(m.cache_creation_input_token_cost_above_1hr))
    out.push({
      id: key,
      providerId,
      name: key,
      input: perMillion(input) as number,
      output: perMillion(output) as number,
      ...(cacheRead !== undefined ? { cacheRead } : {}),
      ...(cacheWrite5m !== undefined ? { cacheWrite5m } : {}),
      ...(cacheWrite1h !== undefined ? { cacheWrite1h } : {}),
      ...(num(m.max_input_tokens) !== undefined ? { contextWindow: m.max_input_tokens } : {}),
      textOnly: true,
    })
  }
  return out
}

/** The rates a period holds, for comparison and insertion. */
export type Rates = {
  input: number
  output: number
  cacheRead?: number
  cacheWrite5m?: number
  cacheWrite1h?: number
}

const RATE_KEYS = ['input', 'output', 'cacheRead', 'cacheWrite5m', 'cacheWrite1h'] as const

function same(a: number | undefined, b: number | undefined): boolean {
  if (a === undefined || b === undefined) return true
  return Math.abs(a - b) < 1e-9
}

/**
 * True when the dataset states a rate the period does not hold. A field the
 * dataset is silent on is never a difference: models.dev has no 1-hour
 * cache-write rate, and its silence must not open a new period.
 */
export function ratesDiffer(period: Rates, dataset: Rates): boolean {
  return RATE_KEYS.some((k) => !same(period[k], dataset[k]))
}

/** The dataset's rates, with the previous period filling what it is silent on. */
export function mergedRates(previous: Rates | null, dataset: Rates): Rates {
  const out: Rates = { input: dataset.input, output: dataset.output }
  for (const k of ['cacheRead', 'cacheWrite5m', 'cacheWrite1h'] as const) {
    const value = dataset[k] ?? previous?.[k]
    if (value !== undefined) out[k] = value
  }
  return out
}

/** The period in effect at `now` for a slug's vendor rate, else the earliest. */
export function periodInEffect(
  prices: readonly Doc<'modelPrices'>[],
  slug: string,
  now: number
): Doc<'modelPrices'> | null {
  const own = prices
    .filter((p) => p.modelSlug === slug && p.provider === undefined)
    .sort((a, b) => a.from - b.from)
  if (own.length === 0) return null
  const current = own.filter((p) => p.from <= now)
  return current.length > 0 ? current[current.length - 1] : own[0]
}

export type PeriodInsert = {
  modelSlug: string
  from: number
  rates: Rates
  source: string
  /** For the log line. */
  before: Rates | null
}

export type ModelInsert = {
  name: string
  slug: string
  provider: string
  aliases: string[]
  iconUrl?: string
  contextWindow?: number
  /** Why the row exists, for the log line. */
  reason: 'dataset' | 'measured'
  /** The first period, when the dataset priced it. */
  rates: Rates | null
}

export type ImportPlan = {
  periods: PeriodInsert[]
  models: ModelInsert[]
  /** Dataset models the allowlist and the window kept out, for the run line. */
  skipped: number
}

/**
 * A dataset id that is a variant or a non-chat product, never a row of its
 * own: `#fast`, a dated snapshot, a priced lane, a `-latest` pointer, an
 * embedding or a robotics model.
 */
function isVariantId(id: string): boolean {
  const lower = id.toLowerCase()
  return (
    id.includes('#') ||
    /-\d{8}$/.test(id) ||
    PRICED_LANES.has(id) ||
    lower.endsWith('-latest') ||
    lower.includes('embedding') ||
    lower.includes('robotics')
  )
}

function withinWindow(releaseDate: string | undefined, now: number): boolean {
  if (!releaseDate) return false
  const at = Date.parse(`${releaseDate}T00:00:00Z`)
  return Number.isFinite(at) && now - at <= CREATE_WINDOW_DAYS * DAY_MS
}

function ratesOf(m: DatasetModel): Rates {
  return {
    input: m.input,
    output: m.output,
    ...(m.cacheRead !== undefined ? { cacheRead: m.cacheRead } : {}),
    ...(m.cacheWrite5m !== undefined ? { cacheWrite5m: m.cacheWrite5m } : {}),
    ...(m.cacheWrite1h !== undefined ? { cacheWrite1h: m.cacheWrite1h } : {}),
  }
}

/**
 * Find the dataset model a catalog row stands for: the row's slug, then its
 * aliases, case-insensitively, and ONLY under the row's own vendor. models.dev
 * lists a model under every gateway that re-serves it, at the gateway's rate;
 * a vendor row's price must never come from one of those. A row whose
 * provider maps to no dataset vendor is matched against the allowlisted
 * vendors only.
 */
export function datasetModelFor(
  dataset: readonly DatasetModel[],
  row: Pick<Doc<'models'>, 'slug' | 'aliases' | 'provider'>
): DatasetModel | null {
  const keys = [row.slug, ...(row.aliases ?? [])].map((k) => k.toLowerCase())
  const own = datasetProviderOf(row.provider)
  return (
    dataset.find(
      (m) =>
        keys.includes(m.id.toLowerCase()) &&
        (own ? m.providerId === own : m.providerId in VENDOR_ALLOWLIST)
    ) ?? null
  )
}

/**
 * The writes one run makes. `measuredIds` are the ids with tokens > 0 on the
 * days (never inventory, ADR-0012 decision 8). `source` is the dataset
 * citation the new periods carry, e.g. `models.dev@2026-08-29`.
 */
export function planImport(args: {
  catalog: ModelCatalog
  models: readonly Doc<'models'>[]
  prices: readonly Doc<'modelPrices'>[]
  dataset: readonly DatasetModel[]
  measuredIds: readonly string[]
  source: string
  now: number
}): ImportPlan {
  const { catalog, models, prices, dataset, measuredIds, source, now } = args
  const periods: PeriodInsert[] = []
  const modelInserts: ModelInsert[] = []
  const claimed = new Set<string>()
  let skipped = 0

  const claim = (slug: string) => {
    if (claimed.has(slug) || catalog.bySlug.has(slug) || catalog.byAlias.has(slug)) return false
    claimed.add(slug)
    return true
  }

  // 1. Rate changes on rows the catalog holds.
  for (const row of models) {
    if (row.reviewStatus === 'rejected') continue
    const m = datasetModelFor(dataset, row)
    if (!m) continue
    const current = periodInEffect(prices, row.slug, now)
    const rates = ratesOf(m)
    if (current && !ratesDiffer(current, rates)) continue
    periods.push({
      modelSlug: row.slug,
      from: now,
      rates: mergedRates(current, rates),
      source,
      before: current
        ? {
            input: current.input,
            output: current.output,
            ...(current.cacheRead !== undefined ? { cacheRead: current.cacheRead } : {}),
            ...(current.cacheWrite5m !== undefined ? { cacheWrite5m: current.cacheWrite5m } : {}),
            ...(current.cacheWrite1h !== undefined ? { cacheWrite1h: current.cacheWrite1h } : {}),
          }
        : null,
    })
  }

  // 2. Dataset models with no row: allowlisted vendor, text-only, recent,
  // not a variant, and not resolvable to an existing row by the alias rules.
  for (const m of dataset) {
    const vendor = VENDOR_ALLOWLIST[m.providerId]
    if (!vendor) continue
    if (isVariantId(m.id) || !m.textOnly || !withinWindow(m.releaseDate, now)) {
      skipped++
      continue
    }
    if (resolveModelId(catalog, m.id).catalogSlug !== null) continue
    const slug = m.id.toLowerCase()
    if (!claim(slug)) continue
    modelInserts.push({
      name: m.name,
      slug,
      provider: vendor,
      aliases: slug === m.id ? [] : [m.id],
      ...(m.iconUrl ? { iconUrl: m.iconUrl } : {}),
      ...(m.contextWindow !== undefined ? { contextWindow: m.contextWindow } : {}),
      reason: 'dataset',
      rates: ratesOf(m),
    })
  }

  // 3. Measured ids with tokens that reach no row.
  for (const id of measuredIds) {
    if (id.includes('#')) continue
    const bare = vendorModelId(id)
    if (!bare || PRICED_LANES.has(bare)) continue
    if (resolveModelId(catalog, id).catalogSlug !== null) continue
    const meta =
      dataset.find((m) => m.id.toLowerCase() === bare.toLowerCase() && VENDOR_ALLOWLIST[m.providerId]) ??
      dataset.find((m) => m.id.toLowerCase() === bare.toLowerCase()) ??
      null
    const slug = meta ? meta.id.toLowerCase() : bare
    if (!claim(slug)) continue
    modelInserts.push({
      name: meta?.name ?? bare,
      slug,
      provider: meta ? (VENDOR_ALLOWLIST[meta.providerId] ?? meta.providerId) : 'unknown',
      aliases: [...new Set([bare, meta?.id ?? bare].filter((a) => a !== slug))],
      ...(meta?.iconUrl && VENDOR_ALLOWLIST[meta.providerId] ? { iconUrl: meta.iconUrl } : {}),
      ...(meta?.contextWindow !== undefined ? { contextWindow: meta.contextWindow } : {}),
      reason: 'measured',
      rates: meta ? ratesOf(meta) : null,
    })
  }

  return { periods, models: modelInserts, skipped }
}

/** `$5/$25 in/out` style, for the log. */
export function formatRates(r: Rates): string {
  const parts = [`$${r.input}/$${r.output}`]
  if (r.cacheRead !== undefined) parts.push(`read $${r.cacheRead}`)
  if (r.cacheWrite5m !== undefined) parts.push(`write5m $${r.cacheWrite5m}`)
  if (r.cacheWrite1h !== undefined) parts.push(`write1h $${r.cacheWrite1h}`)
  return parts.join(', ')
}
