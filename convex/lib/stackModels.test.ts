import { describe, expect, test } from 'vitest'
import { mergeStackModels } from './stackModels'

const canonical = (slug: string) =>
  ({ 'claude-opus-5': 'claude-opus-5', 'fable-5': 'claude-fable-5', 'gpt-5.4': 'gpt-5.4' })[
    slug
  ] ?? null

describe('mergeStackModels', () => {
  test('measured models sort by share, then picks in stored order, no duplicates', () => {
    const out = mergeStackModels({
      measured: [
        { catalogSlug: 'claude-fable-5', tokenShare: 0.3, totalTokens: 30 },
        { catalogSlug: 'claude-opus-5', tokenShare: 0.7, totalTokens: 70 },
      ],
      picks: [{ modelSlug: 'gpt-5.4' }, { modelSlug: 'fable-5', description: 'reviews' }],
      hidden: [],
      canonical,
    })
    expect(out.map((m) => m.slug)).toEqual(['claude-opus-5', 'claude-fable-5', 'gpt-5.4'])
    expect(out[1]).toMatchObject({ measured: true, tokenShare: 0.3, description: 'reviews' })
    expect(out[2]).toMatchObject({ measured: false, tokenShare: null })
  })

  test('two measured ids on one catalog row add up; zero-token and unresolved ids drop', () => {
    const out = mergeStackModels({
      measured: [
        { catalogSlug: 'claude-opus-5', tokenShare: 0.2, totalTokens: 2 },
        { catalogSlug: 'claude-opus-5', tokenShare: 0.3, totalTokens: 3 },
        { catalogSlug: 'gpt-5.4', tokenShare: 0, totalTokens: 0 },
        { catalogSlug: null, tokenShare: 0.5, totalTokens: 5 },
      ],
      picks: [],
      hidden: [],
      canonical,
    })
    expect(out).toEqual([{ slug: 'claude-opus-5', tokenShare: 0.5, measured: true, hidden: false }])
  })

  test('a pick naming no catalog row is dropped and a hidden slug is flagged, not removed', () => {
    const out = mergeStackModels({
      measured: [{ catalogSlug: 'claude-opus-5', tokenShare: 1, totalTokens: 1 }],
      picks: [{ modelSlug: 'nope' }, { modelSlug: 'gpt-5.4' }],
      hidden: ['claude-opus-5'],
      canonical,
    })
    expect(out.map((m) => [m.slug, m.hidden])).toEqual([
      ['claude-opus-5', true],
      ['gpt-5.4', false],
    ])
  })
})
