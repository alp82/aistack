/**
 * The Hacker News lane (#208, map #198). Spec: docs/specs/news-pipeline.md.
 *
 * Ported from the proved prototype in `prototypes/hn-collector/` (#178), which
 * pulled one real week of Hacker News through the Algolia `search_by_date` API
 * and measured what the spec filters leave. Its numbers, which set every value
 * here:
 *
 *   - 7,096 stories in 9 requests. The 10,000 per hour limit is a non-issue.
 *   - The keyword net matches 928 of them.
 *   - A 20-point gate leaves 97 items per week, about 14 a day.
 *   - Points SETTLE. Only 6% of stories under six hours old sit at 20 points,
 *     against 10% of settled ones. So the lane re-reads a trailing 48-hour
 *     window on every run instead of gating a story the hour it appears.
 *
 * The keyword tiers live here, as code, because they are regular expressions
 * with word boundaries that a test proves. The points gate lives on the source
 * row, so the owner can move the volume without a deploy.
 *
 * Pure functions only. Everything here is called from `convex/news.ts` and is
 * tested directly, so a filter regression fails a unit test instead of a cron.
 */

export type HnTier = 'tool' | 'model' | 'broad'

export interface HnKeyword {
  kw: string
  tier: HnTier
  re: RegExp
}

/**
 * The proved net, from the #178 resolution.
 *
 * `tool` and `model` name the products this site covers. `broad` is the generic
 * vocabulary, and it is the tier that carries the noise. `opus` and `sonnet`
 * hold a poetry and music ambiguity that the prototype measured and accepted.
 * The versioned names need a digit, so `glm` does not catch generalized linear
 * models.
 */
export const HN_KEYWORDS: HnKeyword[] = [
  { kw: 'claude code', tier: 'tool', re: /\bclaude[\s-]*code\b/i },
  { kw: 'codex', tier: 'tool', re: /\bcodex\b/i },
  { kw: 'gemini cli', tier: 'tool', re: /\bgemini[\s-]*cli\b/i },
  { kw: 'copilot', tier: 'tool', re: /\bcopilot\b/i },
  { kw: 'cursor', tier: 'tool', re: /\bcursor\b/i },
  { kw: 'windsurf', tier: 'tool', re: /\bwindsurf\b/i },
  { kw: 'opencode', tier: 'tool', re: /\bopencode\b/i },
  { kw: 'aider', tier: 'tool', re: /\baider\b/i },
  { kw: 'cline', tier: 'tool', re: /\bcline\b/i },
  { kw: 'mcp', tier: 'tool', re: /\bmcp\b/i },
  { kw: 'openrouter', tier: 'tool', re: /\bopenrouter\b/i },

  { kw: 'claude', tier: 'model', re: /\bclaude\b/i },
  { kw: 'anthropic', tier: 'model', re: /\banthropic\b/i },
  { kw: 'openai', tier: 'model', re: /\bopenai\b/i },
  { kw: 'chatgpt', tier: 'model', re: /\bchatgpt\b/i },
  { kw: 'gpt-*', tier: 'model', re: /\bgpt[\s-]?[0-9o]/i },
  { kw: 'gemini', tier: 'model', re: /\bgemini\b/i },
  { kw: 'deepseek', tier: 'model', re: /\bdeepseek\b/i },
  { kw: 'qwen', tier: 'model', re: /\bqwen\b/i },
  { kw: 'llama', tier: 'model', re: /\bllama\b/i },
  { kw: 'mistral', tier: 'model', re: /\bmistral\b/i },
  { kw: 'grok', tier: 'model', re: /\bgrok\b/i },
  { kw: 'ollama', tier: 'model', re: /\bollama\b/i },
  { kw: 'kimi', tier: 'model', re: /\bkimi\b/i },
  { kw: 'opus', tier: 'model', re: /\bopus\b/i },
  { kw: 'sonnet', tier: 'model', re: /\bsonnet\b/i },
  { kw: 'glm-*', tier: 'model', re: /\bglm[\s-]?[0-9]/i },

  { kw: 'llm', tier: 'broad', re: /\bllms?\b/i },
  { kw: 'ai agent', tier: 'broad', re: /\bai agents?\b/i },
  { kw: 'coding agent', tier: 'broad', re: /\bcoding agents?\b/i },
  { kw: 'agentic', tier: 'broad', re: /\bagentic\b/i },
  { kw: 'vibe coding', tier: 'broad', re: /\bvibe[\s-]?cod(e|ed|ing)\b/i },
  { kw: 'code assistant', tier: 'broad', re: /\b(code|coding) assistants?\b/i },
]

const TIER_ORDER: HnTier[] = ['tool', 'model', 'broad']

/** The points a story needs before the lane collects it. See #178. */
export const DEFAULT_MIN_POINTS = 20

/**
 * How far back one run reads. Points settle over about two days, so a run that
 * only read the last hours would drop the story that climbs overnight.
 */
export const HN_WINDOW_HOURS = 48

const API = 'https://hn.algolia.com/api/v1/search_by_date'

/** The Hacker News discussion page for one story. */
export function hnDiscussionUrl(id: string): string {
  return `https://news.ycombinator.com/item?id=${id}`
}

/** Which keywords one story matches. Title and URL together are the haystack. */
export function matchKeywords(title: string, url: string | null): string[] {
  const hay = `${title} ${url ?? ''}`
  return HN_KEYWORDS.filter((k) => k.re.test(hay)).map((k) => k.kw)
}

/** The strongest tier among the matched keywords. Null means nothing matched. */
export function topTier(matched: string[]): HnTier | null {
  const tiers = new Set(
    matched
      .map((kw) => HN_KEYWORDS.find((k) => k.kw === kw)?.tier)
      .filter((t): t is HnTier => t !== undefined),
  )
  return TIER_ORDER.find((t) => tiers.has(t)) ?? null
}

/**
 * One page of the window, newest first. The cursor is exclusive, so the next
 * request starts at the oldest story the last one returned.
 */
export function searchRequestUrl(startSec: number, cursorSec: number): string {
  const filters = `created_at_i>=${startSec},created_at_i<${cursorSec}`
  const url = new URL(API)
  url.searchParams.set('tags', 'story')
  url.searchParams.set('hitsPerPage', '1000')
  url.searchParams.set('numericFilters', filters)
  return url.toString()
}

export interface HnStory {
  id: string
  title: string
  /** Absent on an Ask HN or a text post, which lives on Hacker News itself. */
  url: string | null
  points: number
  comments: number
  createdAtSec: number
}

export interface HnPick extends HnStory {
  matched: string[]
  tier: HnTier
}

/**
 * Read one Algolia answer. Throws when the body carries no `hits` array, which
 * is how a rate limit or an error page announces itself.
 */
export function parseHits(body: unknown): HnStory[] {
  const hits = (body as { hits?: unknown })?.hits
  if (!Array.isArray(hits)) throw new Error('no hits array in the answer')
  const stories: HnStory[] = []
  for (const raw of hits) {
    const hit = raw as Record<string, unknown>
    const id = typeof hit.objectID === 'string' ? hit.objectID : null
    const title = typeof hit.title === 'string' ? hit.title.trim() : ''
    if (!id || !title) continue
    stories.push({
      id,
      title,
      url: typeof hit.url === 'string' && hit.url ? hit.url : null,
      points: typeof hit.points === 'number' ? hit.points : 0,
      comments: typeof hit.num_comments === 'number' ? hit.num_comments : 0,
      createdAtSec:
        typeof hit.created_at_i === 'number' ? hit.created_at_i : 0,
    })
  }
  return stories
}

/** The stories that pass the net: a keyword match at or over the points gate. */
export function selectStories(
  stories: HnStory[],
  minPoints: number,
): HnPick[] {
  const picks: HnPick[] = []
  for (const s of stories) {
    if (s.points < minPoints) continue
    const matched = matchKeywords(s.title, s.url)
    const tier = topTier(matched)
    if (tier === null) continue
    picks.push({ ...s, matched, tier })
  }
  return picks
}
