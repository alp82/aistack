import { describe, expect, test } from 'vitest'
import { priceFooter } from './discordPriceFooter'

const side = (handle: string, cost: boolean, publishCost = true) => ({
  identity: { handle },
  publishCost,
  current: {
    usage: {
      cost: cost
        ? {
            usd: 1617.43,
            estimated: true,
            pricedShare: 0.998,
            pricingTables: ['models.dev@2026-09-02', 'openai-list-2026-08-02'],
          }
        : null,
    },
  },
})

describe('priceFooter', () => {
  test('cites every table, the priced share and the lower-bound status', () => {
    expect(priceFooter('cost', side('alper', true), null)).toBe(
      '$1617.43 estimate / lower bound · 99.8% of tokens priced · models.dev@2026-09-02, openai-list-2026-08-02',
    )
  })
  test('names each side of a comparison and skips a side without dollars', () => {
    const text = priceFooter('compare', side('alper', true), side('g', false))
    expect(text).toBe(
      '@alper: $1617.43 estimate / lower bound · 99.8% of tokens priced · models.dev@2026-09-02, openai-list-2026-08-02',
    )
  })
  test('withheld consent and commands without dollars print nothing', () => {
    expect(priceFooter('cost', side('alper', true, false), null)).toBeUndefined()
    expect(priceFooter('tokens', side('alper', true), null)).toBeUndefined()
    expect(priceFooter('cost', side('alper', false), null)).toBeUndefined()
  })
})
