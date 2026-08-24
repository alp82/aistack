import {
  GOOGLE_PRICING_TABLE_VERSION,
  LOCAL_PRICING_TABLE_VERSION,
  OPENAI_PRICING_TABLE_VERSION,
  PRICING_TABLE_VERSION,
} from '@aistack/pricing'
import { describe, expect, it } from 'vitest'
import { repriceSnapshot, type WireModel } from './reprice'

const MTOK = 1_000_000

const tokens = (t: Partial<WireModel['tokens']> = {}) => ({
  input: 0,
  output: 0,
  cacheWrite: 0,
  cacheRead: 0,
  ...t,
})

/** A window entirely inside one price period for every model used here. */
const JULY = { from: '2026-07-01', to: '2026-07-31' }

describe('repriceSnapshot - the gap filler (#93)', () => {
  it('returns a fully-priced snapshot unchanged', () => {
    // The regression that matters most: repricing must be invisible where the
    // CLI already did the job. Its dollars are per-response and cache-TTL
    // aware, so they are exact and ours are not.
    const models: WireModel[] = [
      {
        id: 'claude-opus-5',
        tokens: tokens({ input: MTOK, output: MTOK }),
        apiEquivalentUSD: 30,
      },
      {
        id: 'claude-haiku-4-5',
        tokens: tokens({ input: MTOK }),
        apiEquivalentUSD: 1,
      },
    ]
    const out = repriceSnapshot({
      models,
      window: JULY,
      publishedTable: PRICING_TABLE_VERSION,
      publishCost: true,
    })

    expect(out.models.map((m) => m.apiEquivalentUSD)).toEqual([30, 1])
    expect(out.models.every((m) => m.costEstimated === false)).toBe(true)
    expect(out.repricedTokens).toBe(0)
    expect(out.cost).toEqual({
      lowerBoundUSD: 31,
      publishedUSD: 31,
      estimatedUSD: 0,
      coverage: 1,
      pricedTokens: 3 * MTOK,
      measuredTokens: 3 * MTOK,
      pricingTables: [PRICING_TABLE_VERSION],
    })
  })

  it('prices a model the syncing CLI had no rate for', () => {
    // The prod defect: `openai-list-2026-08-01` does not price the gpt-5.6
    // family, so three of four stacks published a fraction of their real cost.
    const out = repriceSnapshot({
      models: [
        { id: 'gpt-5.6-sol', tokens: tokens({ input: MTOK, output: MTOK }) },
      ],
      window: JULY,
      publishedTable: 'openai-list-2026-08-01',
      publishCost: true,
    })

    expect(out.models[0].apiEquivalentUSD).toBeCloseTo(35, 9) // $5 in + $30 out
    expect(out.models[0].costEstimated).toBe(true)
    expect(out.repricedTokens).toBe(2 * MTOK)
    expect(out.cost).toMatchObject({
      lowerBoundUSD: 35,
      publishedUSD: 0,
      estimatedUSD: 35,
      coverage: 1,
    })
    // The estimate is cited by OUR table. The payload's table priced nothing
    // here, so naming it would date a figure it did not produce.
    expect(out.cost?.pricingTables).toEqual([OPENAI_PRICING_TABLE_VERSION])
  })

  it('mixes an exact row and an estimated row in one reading', () => {
    const out = repriceSnapshot({
      models: [
        {
          id: 'claude-opus-5',
          tokens: tokens({ output: MTOK }),
          apiEquivalentUSD: 25,
        },
        { id: 'gpt-5.6-luna', tokens: tokens({ output: MTOK }) },
      ],
      window: JULY,
      publishedTable: PRICING_TABLE_VERSION,
      publishCost: true,
    })

    expect(out.cost).toMatchObject({
      publishedUSD: 25,
      estimatedUSD: 1.2,
      lowerBoundUSD: 26.2,
      coverage: 1,
    })
    expect(out.cost?.pricingTables).toEqual([
      PRICING_TABLE_VERSION,
      OPENAI_PRICING_TABLE_VERSION,
    ])
  })

  it('leaves `unknown` unpriced forever, and says so in the coverage', () => {
    // `unknown` is not a model, so no rate can ever apply. OrcDev's coverage
    // caps at 85.2% for exactly this reason, and the number has to show it.
    const out = repriceSnapshot({
      models: [
        { id: 'gpt-5.6-sol', tokens: tokens({ input: 8 * MTOK }) },
        { id: 'unknown', tokens: tokens({ input: 2 * MTOK }) },
      ],
      window: JULY,
      publishedTable: 'openai-list-2026-08-01',
      publishCost: true,
    })

    expect(out.models[1].apiEquivalentUSD).toBeUndefined()
    expect(out.models[1].costEstimated).toBe(false)
    expect(out.cost?.coverage).toBeCloseTo(0.8, 9)
  })

  it('publishes no cost at all when the owner turned cost off', () => {
    // The flag is the gate, not the presence of dollars. A stack that switched
    // `publishCost` off still has dollars in its stored payloads.
    const out = repriceSnapshot({
      models: [
        {
          id: 'claude-opus-5',
          tokens: tokens({ output: MTOK }),
          apiEquivalentUSD: 25,
        },
        { id: 'gpt-5.6-sol', tokens: tokens({ output: MTOK }) },
      ],
      window: JULY,
      publishedTable: PRICING_TABLE_VERSION,
      publishCost: false,
    })

    expect(out.cost).toBeNull()
    expect(out.models.every((m) => m.apiEquivalentUSD === undefined)).toBe(true)
    expect(out.repricedTokens).toBe(0)
  })

  it('reports no cost when nothing in the window can be priced', () => {
    const out = repriceSnapshot({
      models: [{ id: 'unknown', tokens: tokens({ input: MTOK }) }],
      window: JULY,
      publishedTable: null,
      publishCost: true,
    })
    expect(out.cost).toBeNull()
  })

  it('charges a merged cache write at the CHEAP tier', () => {
    // A pre-#213 payload carries one `cacheWrite`, so the 5m/1h split the CLI
    // priced from is gone. Assuming the 1.25x tier under-reports Claude Code by
    // ~8%, which is what keeps every server-side figure a lower bound.
    const out = repriceSnapshot({
      models: [{ id: 'claude-opus-5', tokens: tokens({ cacheWrite: MTOK }) }],
      window: JULY,
      publishedTable: 'anthropic-list-2026-01-01',
      publishCost: true,
    })
    expect(out.models[0].apiEquivalentUSD).toBeCloseTo(6.25, 9) // $5 x 1.25
  })

  it('charges each TTL tier its own rate when the split is on the wire (#213)', () => {
    // The whole point of the split. Half the writes are 1-hour, and the 1h tier
    // costs 2.0x input against the 5m tier's 1.25x - so this reads $8.125 where
    // the merged form reads $6.25, and the 30% gap is the bias #213 removes.
    const out = repriceSnapshot({
      models: [
        {
          id: 'claude-opus-5',
          tokens: tokens({
            cacheWrite: MTOK,
            cacheWriteTtl: {
              fiveMinute: MTOK / 2,
              oneHour: MTOK / 2,
              unsplit: 0,
            },
          }),
        },
      ],
      window: JULY,
      publishedTable: 'anthropic-list-2026-01-01',
      publishCost: true,
    })
    // $5 x (0.5 x 1.25 + 0.5 x 2.0), rounded to cents like every figure here.
    expect(out.models[0].apiEquivalentUSD).toBe(8.13)
  })

  it('prices an unsplit remainder at the cheap tier (#213)', () => {
    // `unsplit` is what the harness reported with no TTL attached. Charging it
    // at 2.0x would let an estimate overstate, and this module has exactly one
    // direction it may resolve an unknown in.
    const out = repriceSnapshot({
      models: [
        {
          id: 'claude-opus-5',
          tokens: tokens({
            cacheWrite: MTOK,
            cacheWriteTtl: { fiveMinute: 0, oneHour: 0, unsplit: MTOK },
          }),
        },
      ],
      window: JULY,
      publishedTable: 'anthropic-list-2026-01-01',
      publishCost: true,
    })
    expect(out.models[0].apiEquivalentUSD).toBeCloseTo(6.25, 9)
  })

  it('reads a Google cache write as plain input, split or not (#123, #213)', () => {
    // The TTL tiers are Anthropic's. A vendor whose cache multipliers are 1.0
    // must not acquire a 2.0x tier by carrying a breakdown.
    const split = repriceSnapshot({
      models: [
        {
          id: 'gemini-3-pro',
          tokens: tokens({
            cacheWrite: MTOK,
            cacheWriteTtl: { fiveMinute: 0, oneHour: MTOK, unsplit: 0 },
          }),
        },
      ],
      window: JULY,
      publishedTable: null,
      publishCost: true,
    })
    const merged = repriceSnapshot({
      models: [{ id: 'gemini-3-pro', tokens: tokens({ cacheWrite: MTOK }) }],
      window: JULY,
      publishedTable: null,
      publishCost: true,
    })
    expect(split.models[0].apiEquivalentUSD).toBe(
      merged.models[0].apiEquivalentUSD
    )
  })

  it('charges a cache read at a tenth of the input rate', () => {
    const out = repriceSnapshot({
      models: [{ id: 'claude-opus-5', tokens: tokens({ cacheRead: MTOK }) }],
      window: JULY,
      publishedTable: 'anthropic-list-2026-01-01',
      publishCost: true,
    })
    expect(out.models[0].apiEquivalentUSD).toBeCloseTo(0.5, 9)
  })

  it('takes the CHEAPER rate when the window straddles a repricing', () => {
    // A published snapshot has no per-response timestamps, so the split across
    // the boundary is unknowable. Picking the cheap side keeps the figure a
    // lower bound instead of a guess that can overstate.
    const straddling = { from: '2026-08-20', to: '2026-09-05' }
    const out = repriceSnapshot({
      models: [
        { id: 'claude-sonnet-5', tokens: tokens({ input: MTOK, output: MTOK }) },
      ],
      window: straddling,
      publishedTable: null,
      publishCost: true,
    })
    expect(out.models[0].apiEquivalentUSD).toBeCloseTo(12, 9) // $2 + $10, not $3 + $15
  })

  it('uses the only rate the window can pay when it straddles nothing', () => {
    const after = { from: '2026-09-05', to: '2026-10-05' }
    const out = repriceSnapshot({
      models: [
        { id: 'claude-sonnet-5', tokens: tokens({ input: MTOK, output: MTOK }) },
      ],
      window: after,
      publishedTable: null,
      publishCost: true,
    })
    expect(out.models[0].apiEquivalentUSD).toBeCloseTo(18, 9)
  })

  it('estimates nothing from a window it cannot read', () => {
    const out = repriceSnapshot({
      models: [
        { id: 'gpt-5.6-sol', tokens: tokens({ input: MTOK }) },
        {
          id: 'claude-opus-5',
          tokens: tokens({ input: MTOK }),
          apiEquivalentUSD: 5,
        },
      ],
      window: { from: 'not-a-date', to: '2026-07-31' },
      publishedTable: PRICING_TABLE_VERSION,
      publishCost: true,
    })
    expect(out.models[0].apiEquivalentUSD).toBeUndefined()
    expect(out.cost).toMatchObject({ estimatedUSD: 0, publishedUSD: 5 })
    expect(out.cost?.coverage).toBeCloseTo(0.5, 9)
  })

  it('reports full coverage for a snapshot with no tokens at all', () => {
    const out = repriceSnapshot({
      models: [],
      window: JULY,
      publishedTable: null,
      publishCost: true,
    })
    expect(out.cost).toBeNull()
  })
})

describe('per-model citations from a mixed-vendor payload (#136)', () => {
  it('cites each published figure by the table the model carries', () => {
    // One opencode payload prices OpenAI and Google rows from two tables. The
    // old shape stamped one id over both - a false citation. The new shape
    // carries the table on the model, and the top-level field is null.
    const out = repriceSnapshot({
      models: [
        {
          id: 'openai:gpt-5.4',
          tokens: tokens({ input: MTOK }),
          apiEquivalentUSD: 2.5,
          pricingTable: OPENAI_PRICING_TABLE_VERSION,
        },
        {
          id: 'google:gemini-3.6-flash',
          tokens: tokens({ input: MTOK }),
          apiEquivalentUSD: 1.5,
          pricingTable: GOOGLE_PRICING_TABLE_VERSION,
        },
      ],
      window: JULY,
      publishedTable: null,
      publishCost: true,
    })
    expect(out.cost?.publishedUSD).toBe(4)
    expect(out.cost?.pricingTables).toEqual([
      OPENAI_PRICING_TABLE_VERSION,
      GOOGLE_PRICING_TABLE_VERSION,
    ])
  })

  it('falls back to the payload table for a model with no citation of its own', () => {
    // The old wire shape: dollars on the model, one table on the payload.
    const out = repriceSnapshot({
      models: [
        {
          id: 'claude-opus-5',
          tokens: tokens({ output: MTOK }),
          apiEquivalentUSD: 25,
        },
      ],
      window: JULY,
      publishedTable: PRICING_TABLE_VERSION,
      publishCost: true,
    })
    expect(out.cost?.pricingTables).toEqual([PRICING_TABLE_VERSION])
  })

  it('does not repeat a table cited by both a published and an estimated row', () => {
    const out = repriceSnapshot({
      models: [
        {
          id: 'openai:gpt-5.4',
          tokens: tokens({ input: MTOK }),
          apiEquivalentUSD: 2.5,
          pricingTable: OPENAI_PRICING_TABLE_VERSION,
        },
        { id: 'gpt-5.6-luna', tokens: tokens({ output: MTOK }) },
      ],
      window: JULY,
      publishedTable: null,
      publishCost: true,
    })
    expect(out.cost?.pricingTables).toEqual([OPENAI_PRICING_TABLE_VERSION])
  })

  it('strips the citation with the dollars when cost is off', () => {
    // Cost is absent, not zeroed - and a citation with nothing to cite would
    // leak that a figure existed.
    const out = repriceSnapshot({
      models: [
        {
          id: 'openai:gpt-5.4',
          tokens: tokens({ input: MTOK }),
          apiEquivalentUSD: 2.5,
          pricingTable: OPENAI_PRICING_TABLE_VERSION,
        },
      ],
      window: JULY,
      publishedTable: null,
      publishCost: false,
    })
    expect(out.models[0].apiEquivalentUSD).toBeUndefined()
    expect(out.models[0].pricingTable).toBeUndefined()
  })

  it('stamps the citing table onto a row it estimates', () => {
    // An estimated figure is cited by OUR table, per model, the same way a
    // published figure is cited by the CLI's.
    const out = repriceSnapshot({
      models: [{ id: 'gpt-5.6-sol', tokens: tokens({ input: MTOK }) }],
      window: JULY,
      publishedTable: null,
      publishCost: true,
    })
    expect(out.models[0].costEstimated).toBe(true)
    expect(out.models[0].pricingTable).toBe(OPENAI_PRICING_TABLE_VERSION)
  })
})

describe('provider-qualified ids from a multi-provider harness (#123)', () => {
  it('estimates a Google row at the Google list rate', () => {
    const out = repriceSnapshot({
      models: [
        {
          id: 'google:gemini-3-pro-preview',
          tokens: tokens({ input: MTOK, output: MTOK }),
        },
      ],
      window: JULY,
      publishedTable: null,
      publishCost: true,
    })
    // $2 in + $12 out.
    expect(out.models[0].apiEquivalentUSD).toBe(14)
    expect(out.cost?.pricingTables).toEqual([GOOGLE_PRICING_TABLE_VERSION])
  })

  it('charges a Google cache write as plain input, not at Anthropic 1.25x', () => {
    // The lower-bound tenet: Google bills cache storage by the hour and charges
    // the standard input rate to write. 1.25x would put the estimate ABOVE the
    // real cost.
    const out = repriceSnapshot({
      models: [
        {
          id: 'google:gemini-3.6-flash',
          tokens: tokens({ cacheWrite: MTOK, cacheRead: MTOK }),
        },
      ],
      window: JULY,
      publishedTable: null,
      publishCost: true,
    })
    // $1.50 write + $0.15 read.
    expect(out.models[0].apiEquivalentUSD).toBe(1.65)
  })

  it('leaves a gateway row unpriced instead of borrowing the vendor rate', () => {
    // github-copilot re-serves `gemini-3-pro-preview` at terms no list page
    // states (#122). An estimate here would be invented, and could overstate.
    const out = repriceSnapshot({
      models: [
        {
          id: 'github-copilot:gemini-3-pro-preview',
          tokens: tokens({ input: MTOK }),
        },
        { id: 'opencode:big-pickle', tokens: tokens({ input: MTOK }) },
        {
          id: 'anthropic:claude-opus-5',
          tokens: tokens({ input: MTOK }),
          apiEquivalentUSD: 5,
        },
      ],
      window: JULY,
      publishedTable: PRICING_TABLE_VERSION,
      publishCost: true,
    })
    expect(out.models[0].apiEquivalentUSD).toBeUndefined()
    expect(out.models[1].apiEquivalentUSD).toBeUndefined()
    expect(out.repricedTokens).toBe(0)
    expect(out.cost?.coverage).toBeCloseTo(1 / 3, 9)
  })

  it('counts a local model as covered at zero rather than as a table gap', () => {
    const out = repriceSnapshot({
      models: [
        { id: 'ollama:qwen3-coder', tokens: tokens({ input: MTOK }) },
        {
          id: 'anthropic:claude-opus-5',
          tokens: tokens({ input: MTOK }),
          apiEquivalentUSD: 5,
        },
      ],
      window: JULY,
      publishedTable: PRICING_TABLE_VERSION,
      publishCost: true,
    })
    expect(out.models[0].apiEquivalentUSD).toBe(0)
    expect(out.cost?.coverage).toBe(1)
    expect(out.cost?.lowerBoundUSD).toBe(5)
    expect(out.cost?.pricingTables).toEqual([
      PRICING_TABLE_VERSION,
      LOCAL_PRICING_TABLE_VERSION,
    ])
  })
})
