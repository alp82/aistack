import { describe, expect, test } from 'vitest'
import type { Doc, Id } from '../_generated/dataModel'
import { catalogFrom } from './modelCatalog'
import {
  type DatasetModel,
  datasetProviderOf,
  mergedRates,
  parseLiteLlm,
  parseModelsDev,
  periodInEffect,
  planImport,
  ratesDiffer,
} from './modelImport'

const NOW = Date.UTC(2026, 7, 29, 12)
const DAY = 24 * 60 * 60 * 1000

function model(over: Partial<Doc<'models'>> & { slug: string }): Doc<'models'> {
  return {
    _id: `m_${over.slug}` as Id<'models'>,
    _creationTime: 1,
    name: over.slug,
    shortId: over.slug.slice(0, 6),
    provider: 'Anthropic',
    category: 'coding',
    reviewStatus: 'approved',
    createdAt: 1,
    updatedAt: 1,
    ...over,
  }
}

function period(
  over: Partial<Doc<'modelPrices'>> & { modelSlug: string; input: number; output: number }
): Doc<'modelPrices'> {
  return {
    _id: `p_${over.modelSlug}_${over.from ?? 0}` as Id<'modelPrices'>,
    _creationTime: 1,
    from: 0,
    source: 'anthropic-list-2026-07-25',
    createdAt: 1,
    ...over,
  }
}

function dm(over: Partial<DatasetModel> & { id: string; providerId: string }): DatasetModel {
  return {
    name: over.id,
    input: 5,
    output: 25,
    textOnly: true,
    releaseDate: '2026-08-01',
    iconUrl: `https://models.dev/logos/${over.providerId}.svg`,
    ...over,
  }
}

function plan(args: {
  models?: Doc<'models'>[]
  prices?: Doc<'modelPrices'>[]
  dataset?: DatasetModel[]
  measuredIds?: string[]
}) {
  const models = args.models ?? []
  const prices = args.prices ?? []
  return planImport({
    catalog: catalogFrom(models, prices),
    models,
    prices,
    dataset: args.dataset ?? [],
    measuredIds: args.measuredIds ?? [],
    source: 'models.dev@2026-08-29',
    now: NOW,
  })
}

describe('parseModelsDev', () => {
  test('reads cost, limit, modalities and the provider logo', () => {
    const rows = parseModelsDev({
      anthropic: {
        id: 'anthropic',
        models: {
          'claude-opus-4-7': {
            id: 'claude-opus-4-7',
            name: 'Claude Opus 4.7',
            release_date: '2026-04-14',
            modalities: { input: ['text', 'image'], output: ['text'] },
            limit: { context: 1000000, output: 128000 },
            cost: { input: 5, output: 25, cache_read: 0.5, cache_write: 6.25 },
          },
          'claude-tts': {
            id: 'claude-tts',
            modalities: { input: ['text'], output: ['audio'] },
            cost: { input: 1, output: 2 },
          },
          'no-cost': { id: 'no-cost' },
        },
      },
    })
    expect(rows).toEqual([
      {
        id: 'claude-opus-4-7',
        providerId: 'anthropic',
        name: 'Claude Opus 4.7',
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite5m: 6.25,
        contextWindow: 1000000,
        releaseDate: '2026-04-14',
        textOnly: true,
        iconUrl: 'https://models.dev/logos/anthropic.svg',
      },
      {
        id: 'claude-tts',
        providerId: 'anthropic',
        name: 'claude-tts',
        input: 1,
        output: 2,
        textOnly: false,
        iconUrl: 'https://models.dev/logos/anthropic.svg',
      },
    ])
  })
})

describe('parseLiteLlm', () => {
  test('keeps bare chat keys, converts per-token to per-million, maps providers', () => {
    const rows = parseLiteLlm({
      sample_spec: { input_cost_per_token: 0 },
      'claude-opus-4-7': {
        litellm_provider: 'anthropic',
        mode: 'chat',
        input_cost_per_token: 0.000005,
        output_cost_per_token: 0.000025,
        cache_read_input_token_cost: 5e-7,
        cache_creation_input_token_cost: 0.00000625,
        cache_creation_input_token_cost_above_1hr: 0.00001,
        max_input_tokens: 1000000,
      },
      'vertex_ai/claude-opus-4-7': { litellm_provider: 'vertex_ai', input_cost_per_token: 1, output_cost_per_token: 1 },
      'gemini-3.6-flash': { litellm_provider: 'gemini', mode: 'chat', input_cost_per_token: 7.5e-7, output_cost_per_token: 0.00000375 },
      'text-embedding-3-large': { litellm_provider: 'openai', mode: 'embedding', input_cost_per_token: 1e-7, output_cost_per_token: 0 },
    })
    expect(rows).toEqual([
      {
        id: 'claude-opus-4-7',
        providerId: 'anthropic',
        name: 'claude-opus-4-7',
        input: 5,
        output: 25,
        cacheRead: 0.5,
        cacheWrite5m: 6.25,
        cacheWrite1h: 10,
        contextWindow: 1000000,
        textOnly: true,
      },
      { id: 'gemini-3.6-flash', providerId: 'google', name: 'gemini-3.6-flash', input: 0.75, output: 3.75, textOnly: true },
    ])
  })
})

describe('rates', () => {
  test('a field the dataset is silent on is not a difference', () => {
    expect(ratesDiffer({ input: 5, output: 25, cacheWrite1h: 10 }, { input: 5, output: 25 })).toBe(false)
    expect(ratesDiffer({ input: 5, output: 25 }, { input: 5, output: 25, cacheRead: 0.5 })).toBe(false)
    expect(ratesDiffer({ input: 5, output: 25 }, { input: 4, output: 25 })).toBe(true)
    expect(ratesDiffer({ input: 5, output: 25, cacheRead: 0.5 }, { input: 5, output: 25, cacheRead: 0.6 })).toBe(true)
  })

  test('mergedRates carries the previous period into what the dataset omits', () => {
    expect(mergedRates({ input: 5, output: 25, cacheWrite1h: 10 }, { input: 4, output: 20, cacheRead: 0.4 })).toEqual({
      input: 4,
      output: 20,
      cacheRead: 0.4,
      cacheWrite1h: 10,
    })
  })

  test('periodInEffect picks the latest period at or before now, ignoring gateway rows', () => {
    const prices = [
      period({ modelSlug: 'a', from: 0, input: 2, output: 10 }),
      period({ modelSlug: 'a', from: NOW + DAY, input: 3, output: 15 }),
      period({ modelSlug: 'a', from: 0, input: 9, output: 9, provider: 'openrouter' }),
    ]
    expect(periodInEffect(prices, 'a', NOW)?.input).toBe(2)
    expect(periodInEffect(prices, 'a', NOW + 2 * DAY)?.input).toBe(3)
    expect(periodInEffect(prices, 'b', NOW)).toBeNull()
  })

  test('datasetProviderOf maps the catalog spellings', () => {
    expect(datasetProviderOf('Anthropic')).toBe('anthropic')
    expect(datasetProviderOf('Google DeepMind')).toBe('google')
    expect(datasetProviderOf('Moonshot AI')).toBe('moonshotai')
    expect(datasetProviderOf('Zhipu AI')).toBe('zai')
    expect(datasetProviderOf('ElevenLabs')).toBeNull()
  })
})

describe('planImport', () => {
  test('an unchanged rate plans nothing', () => {
    const p = plan({
      models: [model({ slug: 'claude-opus-4-7' })],
      prices: [period({ modelSlug: 'claude-opus-4-7', input: 5, output: 25, cacheRead: 0.5, cacheWrite5m: 6.25, cacheWrite1h: 10 })],
      dataset: [dm({ id: 'claude-opus-4-7', providerId: 'anthropic', cacheRead: 0.5, cacheWrite5m: 6.25 })],
    })
    expect(p.periods).toEqual([])
    expect(p.models).toEqual([])
  })

  test('a changed rate plans one period dated now, cited to the dataset, keeping the 1h tier', () => {
    const p = plan({
      models: [model({ slug: 'gpt-5.6-sol', provider: 'OpenAI' })],
      prices: [period({ modelSlug: 'gpt-5.6-sol', input: 5, output: 30, cacheWrite1h: 10, source: 'openai-list-2026-08-02' })],
      dataset: [dm({ id: 'gpt-5.6-sol', providerId: 'openai', input: 4, output: 20, cacheRead: 0.4 })],
    })
    expect(p.periods).toEqual([
      {
        modelSlug: 'gpt-5.6-sol',
        from: NOW,
        rates: { input: 4, output: 20, cacheRead: 0.4, cacheWrite1h: 10 },
        source: 'models.dev@2026-08-29',
        before: { input: 5, output: 30, cacheWrite1h: 10 },
      },
    ])
  })

  test('matches by alias under the row vendor only; a gateway listing never prices a vendor row', () => {
    const p = plan({
      models: [
        model({ slug: 'glm-5.2', aliases: ['GLM-5.2'], provider: 'Zhipu AI' }),
        model({ slug: 'gemini-3-pro-preview', provider: 'Google' }),
      ],
      dataset: [
        dm({ id: 'GLM-5.2', providerId: 'alibaba', input: 9, output: 9 }),
        dm({ id: 'glm-5.2', providerId: 'zai', input: 1, output: 3 }),
        dm({ id: 'gemini-3-pro-preview', providerId: 'jiekou', input: 1.8, output: 10.8 }),
      ],
    })
    expect(p.periods.map((x) => [x.modelSlug, x.rates.input])).toEqual([['glm-5.2', 1]])
    expect(p.periods[0].before).toBeNull()
  })

  test('creates a pending row for an allowlisted, recent, text-only dataset model with no row', () => {
    const p = plan({
      models: [model({ slug: 'claude-opus-4-7' })],
      dataset: [
        dm({ id: 'claude-opus-4-7', providerId: 'anthropic' }),
        dm({ id: 'MiniMax-M2.7', providerId: 'minimax', name: 'MiniMax M2.7', input: 0.3, output: 1.2, contextWindow: 200000 }),
        // Kept out, each by one rule:
        dm({ id: 'claude-opus-4-7-20260416', providerId: 'anthropic' }),
        dm({ id: 'claude-haiku-4-5-20251001', providerId: 'anthropic' }),
        dm({ id: 'gpt-4o', providerId: 'openai', releaseDate: '2024-05-13' }),
        dm({ id: 'gemini-live', providerId: 'google', textOnly: false }),
        dm({ id: 'mistral-large', providerId: 'mistral' }),
        dm({ id: 'codex-auto-review', providerId: 'openai' }),
        dm({ id: 'claude-opus-5#fast', providerId: 'anthropic' }),
        dm({ id: 'undated', providerId: 'openai', releaseDate: undefined }),
        dm({ id: 'gemini-flash-latest', providerId: 'google' }),
        dm({ id: 'gemini-embedding-2', providerId: 'google' }),
      ],
    })
    expect(p.models).toEqual([
      {
        name: 'MiniMax M2.7',
        slug: 'minimax-m2.7',
        provider: 'MiniMax',
        aliases: ['MiniMax-M2.7'],
        iconUrl: 'https://models.dev/logos/minimax.svg',
        contextWindow: 200000,
        reason: 'dataset',
        rates: { input: 0.3, output: 1.2 },
      },
    ])
    // Provider outside the allowlist is not counted as skipped; the rule-outs are.
    expect(p.skipped).toBe(9)
  })

  test('a dated variant that strips to an existing slug creates no row and repices nothing twice', () => {
    const p = plan({
      models: [model({ slug: 'claude-haiku-4-5' })],
      prices: [period({ modelSlug: 'claude-haiku-4-5', input: 1, output: 5 })],
      dataset: [dm({ id: 'claude-haiku-4-5-20251001', providerId: 'anthropic', input: 1, output: 5 })],
    })
    expect(p.models).toEqual([])
    expect(p.periods).toEqual([])
  })

  test('a measured id with tokens and no row becomes a pending row, from dataset metadata when it has some', () => {
    const p = plan({
      models: [model({ slug: 'claude-opus-4-7' })],
      dataset: [dm({ id: 'kimi-k2.7-code', providerId: 'moonshotai', name: 'Kimi K2.7 Code', input: 0.6, output: 2.5, releaseDate: '2025-01-01' })],
      measuredIds: [
        'claude-opus-4-7',
        'opencode-go:kimi-k2.7-code',
        'gpt-daybreak-blue',
        'codex-auto-review',
        'claude-opus-5#fast',
        'anthropic:claude-opus-4-7-20260416',
      ],
    })
    expect(p.models).toEqual([
      {
        name: 'Kimi K2.7 Code',
        slug: 'kimi-k2.7-code',
        provider: 'Moonshot AI',
        aliases: [],
        iconUrl: 'https://models.dev/logos/moonshotai.svg',
        reason: 'measured',
        rates: { input: 0.6, output: 2.5 },
      },
      {
        name: 'gpt-daybreak-blue',
        slug: 'gpt-daybreak-blue',
        provider: 'unknown',
        aliases: [],
        reason: 'measured',
        rates: null,
      },
    ])
  })

  test('one slug is created once even when the dataset and the days both name it', () => {
    const p = plan({
      dataset: [dm({ id: 'deepseek-v4-pro', providerId: 'deepseek' })],
      measuredIds: ['deepseek-v4-pro', 'opencode-go:deepseek-v4-pro'],
    })
    expect(p.models.map((m) => m.slug)).toEqual(['deepseek-v4-pro'])
  })

  test('a rejected row is left alone', () => {
    const p = plan({
      models: [model({ slug: 'claude-opus-4-7', reviewStatus: 'rejected' })],
      dataset: [dm({ id: 'claude-opus-4-7', providerId: 'anthropic', input: 1, output: 1 })],
    })
    expect(p.periods).toEqual([])
  })
})
