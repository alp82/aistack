/**
 * The pure half of the news drafting apply step (#233, map #198).
 *
 * Everything here is a plain function over strings: parsing a draft file,
 * reading a value back out of the Convex CLI stream, and rendering the report.
 * The ssh hop, the filesystem, and the deletes live in scripts/news-drafts.ts,
 * which is the shell around these.
 *
 * The split exists so the parsing rules are tested without a prod round trip.
 * A draft file is written by a language model and merged by hand, which are the
 * two least predictable inputs in the pipeline.
 */

export interface ParsedDraft {
  ok: true
  file: string
  itemId: string
  url: string | null
  headline: string | null
  topic: string
  summary: string
}

export interface RejectedDraft {
  ok: false
  file: string
  error: string
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

/**
 * One draft file, or the reason it cannot be applied.
 *
 * A rejection NEVER throws. One malformed file out of twenty must not cost the
 * other nineteen their apply, so every fault is a value the report can print.
 *
 * The frontmatter reader is deliberately not a YAML parser. The four keys hold
 * flat strings, and a URL with a colon in its query is the only quoting case
 * that has ever come up, so `key: rest of the line` is the whole grammar.
 */
export function parseDraftFile(
  text: string,
  file: string,
): ParsedDraft | RejectedDraft {
  const match = text.match(FRONTMATTER)
  if (!match) {
    return { ok: false, file, error: 'no --- frontmatter block at the top' }
  }

  const fields = new Map<string, string>()
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const colon = trimmed.indexOf(':')
    if (colon === -1) continue
    fields.set(trimmed.slice(0, colon).trim(), unquote(trimmed.slice(colon + 1)))
  }

  const itemId = fields.get('itemId') ?? ''
  if (!itemId) return { ok: false, file, error: 'no itemId in the frontmatter' }
  const topic = fields.get('topic') ?? ''
  if (!topic) return { ok: false, file, error: 'no topic in the frontmatter' }
  const summary = match[2].trim()
  if (!summary) return { ok: false, file, error: 'the summary body is empty' }

  return {
    ok: true,
    file,
    itemId,
    url: fields.get('url') || null,
    headline: fields.get('headline') || null,
    topic,
    summary,
  }
}

function unquote(raw: string): string {
  const value = raw.trim()
  if (value.length >= 2) {
    const first = value[0]
    const last = value[value.length - 1]
    if ((first === '"' || first === "'") && first === last) {
      return value.slice(1, -1)
    }
  }
  return value
}

/**
 * The last JSON value in a stream that also carries log lines.
 *
 * `npx convex run` prints the function's return value, but it prints its own
 * progress around it, and a function that logs adds more. Scanning for the LAST
 * balanced block is what survives both: the return value is printed last.
 *
 * Returns null when the stream holds no value, so the caller can show the raw
 * output instead of guessing.
 */
export function lastJsonValue(output: string): unknown {
  let found: unknown = null
  for (const block of balancedBlocks(output)) {
    try {
      found = JSON.parse(block)
    } catch {
      // Not a value. A log line that merely looks like one is normal.
    }
  }
  return found
}

/** Every `{...}` and `[...]` run in the text, brace-matched outside strings. */
function* balancedBlocks(text: string): Generator<string> {
  let depth = 0
  let start = -1
  let inString = false
  let escaped = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') {
      inString = true
      continue
    }
    if (char === '{' || char === '[') {
      if (depth === 0) start = i
      depth++
      continue
    }
    if (char === '}' || char === ']') {
      if (depth === 0) continue
      depth--
      if (depth === 0 && start !== -1) {
        yield text.slice(start, i + 1)
        start = -1
      }
    }
  }
}

export interface ApplyResult {
  itemId: string
  outcome: string
  headline: string | null
  topicCreated: boolean
}

export interface ApplyReport {
  results: ApplyResult[]
  applied: number
  skipped: number
}

/**
 * The per-item report, one line per draft plus a count line.
 *
 * The spec asks for the same shape as the broadcast sender: the run says what
 * happened to every item, and a partial run is a normal outcome rather than an
 * error to hide.
 */
export function renderReport(report: ApplyReport): string[] {
  const lines = report.results.map((result) => {
    const name = result.headline ?? result.itemId
    const topic = result.topicCreated ? ' (new topic)' : ''
    return `${result.outcome.padEnd(16)} ${name}${topic}`
  })
  lines.push(`${report.applied} applied, ${report.skipped} skipped`)
  return lines
}
