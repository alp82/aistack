import { describe, expect, test } from 'vitest'
import {
  DEFAULT_MIN_POINTS,
  HN_KEYWORDS,
  HN_WINDOW_HOURS,
  hnDiscussionUrl,
  matchKeywords,
  parseHits,
  searchRequestUrl,
  selectStories,
  topTier,
} from './hackerNews'

const story = (over: Record<string, unknown> = {}) => ({
  id: '1',
  title: 'Claude Code ships a new agent mode',
  url: 'https://anthropic.com/news/agent-mode',
  points: 40,
  comments: 12,
  createdAtSec: 1_760_000_000,
  ...over,
})

describe('matchKeywords', () => {
  test('matches a product name in the title', () => {
    expect(matchKeywords('Claude Code ships agent mode', null)).toContain(
      'claude code',
    )
  })

  test('matches a product name in the URL alone', () => {
    expect(matchKeywords('A new coding assistant', 'https://opencode.ai/blog')).toContain(
      'opencode',
    )
  })

  test('holds word boundaries, so a substring is not a match', () => {
    expect(matchKeywords('Precursor to a new language', null)).toEqual([])
    expect(matchKeywords('Generalized linear models in R', null)).toEqual([])
    expect(matchKeywords('The Ollama release', null)).toContain('ollama')
  })

  test('needs a digit after the versioned names', () => {
    expect(matchKeywords('GLM-5.3 lands', null)).toContain('glm-*')
    expect(matchKeywords('GPT-5 lands', null)).toContain('gpt-*')
    expect(matchKeywords('A glm refresher', null)).toEqual([])
  })

  test('a story with no AI words matches nothing', () => {
    expect(matchKeywords('Show HN: I built a sourdough timer', 'https://a.test')).toEqual(
      [],
    )
  })
})

describe('topTier', () => {
  test('the strongest tier of the matched keywords wins', () => {
    expect(topTier(['llm', 'claude', 'claude code'])).toBe('tool')
    expect(topTier(['llm', 'claude'])).toBe('model')
    expect(topTier(['llm'])).toBe('broad')
    expect(topTier([])).toBeNull()
  })
})

describe('the proved keyword set', () => {
  test('carries the three tiers from the prototype', () => {
    const tiers = new Set(HN_KEYWORDS.map((k) => k.tier))
    expect([...tiers].sort()).toEqual(['broad', 'model', 'tool'])
  })

  test('names every product the prototype proved', () => {
    const names = HN_KEYWORDS.map((k) => k.kw)
    for (const kw of ['claude code', 'codex', 'gemini cli', 'opencode', 'mcp']) {
      expect(names).toContain(kw)
    }
  })

  test('one keyword is listed once', () => {
    expect(new Set(HN_KEYWORDS.map((k) => k.kw)).size).toBe(HN_KEYWORDS.length)
  })
})

describe('searchRequestUrl', () => {
  test('asks Algolia for one window of stories, newest first', () => {
    const url = new URL(searchRequestUrl(1_000, 2_000))
    expect(url.origin + url.pathname).toBe(
      'https://hn.algolia.com/api/v1/search_by_date',
    )
    expect(url.searchParams.get('tags')).toBe('story')
    expect(url.searchParams.get('hitsPerPage')).toBe('1000')
    expect(url.searchParams.get('numericFilters')).toBe(
      'created_at_i>=1000,created_at_i<2000',
    )
  })
})

describe('parseHits', () => {
  test('reads the fields the lane stores', () => {
    const parsed = parseHits({
      hits: [
        {
          objectID: '44',
          title: 'Opus 5 is out',
          url: 'https://anthropic.com/opus-5',
          points: 210,
          num_comments: 88,
          created_at_i: 1_760_000_000,
        },
      ],
    })
    expect(parsed).toEqual([
      {
        id: '44',
        title: 'Opus 5 is out',
        url: 'https://anthropic.com/opus-5',
        points: 210,
        comments: 88,
        createdAtSec: 1_760_000_000,
      },
    ])
  })

  test('an Ask HN post carries no URL, and that is not a fault', () => {
    const parsed = parseHits({
      hits: [
        {
          objectID: '45',
          title: 'Ask HN: which coding agent do you use',
          points: 30,
          created_at_i: 1_760_000_000,
        },
      ],
    })
    expect(parsed[0].url).toBeNull()
    expect(parsed[0].comments).toBe(0)
  })

  test('drops a hit with no title or no id, which cannot become an item', () => {
    const parsed = parseHits({
      hits: [
        { objectID: '46', points: 30, created_at_i: 1 },
        { title: 'no id', points: 30, created_at_i: 1 },
        { objectID: '47', title: 'good', points: 30, created_at_i: 1 },
      ],
    })
    expect(parsed.map((p) => p.id)).toEqual(['47'])
  })

  test('throws when the body is not an Algolia answer', () => {
    expect(() => parseHits({ message: 'nope' })).toThrow()
  })
})

describe('selectStories', () => {
  test('keeps a keyword match that clears the points gate', () => {
    expect(selectStories([story()], 20).map((s) => s.id)).toEqual(['1'])
  })

  test('drops a keyword match under the gate', () => {
    expect(selectStories([story({ points: 19 })], 20)).toEqual([])
  })

  test('drops a story no keyword matched, whatever its points', () => {
    const off = story({ title: 'A sourdough timer', url: null, points: 900 })
    expect(selectStories([off], 20)).toEqual([])
  })

  test('carries the matched keywords and the tier onto the result', () => {
    const [picked] = selectStories([story()], 20)
    expect(picked.matched).toContain('claude code')
    expect(picked.tier).toBe('tool')
  })

  test('the gate is a parameter, so the owner can widen the net', () => {
    expect(selectStories([story({ points: 5 })], 0)).toHaveLength(1)
  })
})

describe('the lane constants', () => {
  test('the gate and the window are the values the prototype proved', () => {
    expect(DEFAULT_MIN_POINTS).toBe(20)
    expect(HN_WINDOW_HOURS).toBe(48)
  })

  test('the discussion link is the HN item page', () => {
    expect(hnDiscussionUrl('44')).toBe(
      'https://news.ycombinator.com/item?id=44',
    )
  })
})
