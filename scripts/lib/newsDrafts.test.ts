import { describe, expect, test } from 'vitest'
import { lastJsonValue, parseDraftFile, renderReport } from './newsDrafts'

// ---------------------------------------------------------------------------
// The draft file: what the skill writes and the owner reviews
// ---------------------------------------------------------------------------

describe('parseDraftFile', () => {
  const good = `---
itemId: k57abc
url: https://vendor.test/blog/thing
headline: A post
topic: Coding agents
---

The first sentence of the summary.

The second paragraph.
`

  test('the frontmatter names the row and the body is the summary', () => {
    const draft = parseDraftFile(good, 'a-post.md')

    expect(draft.ok).toBe(true)
    if (!draft.ok) return
    expect(draft.itemId).toBe('k57abc')
    expect(draft.topic).toBe('Coding agents')
    expect(draft.summary).toBe(
      'The first sentence of the summary.\n\nThe second paragraph.',
    )
  })

  test('a file with no frontmatter is refused by name', () => {
    const draft = parseDraftFile('Just a summary.\n', 'loose.md')

    expect(draft.ok).toBe(false)
    if (draft.ok) return
    expect(draft.file).toBe('loose.md')
    expect(draft.error).toMatch(/frontmatter/i)
  })

  test('a file with no itemId is refused, because apply has no row to write', () => {
    const draft = parseDraftFile(
      '---\nurl: https://a.test/1\ntopic: Agents\n---\n\nText.\n',
      'no-id.md',
    )

    expect(draft.ok).toBe(false)
    if (draft.ok) return
    expect(draft.error).toMatch(/itemId/)
  })

  test('a file with no topic is refused, because every item carries one', () => {
    const draft = parseDraftFile(
      '---\nitemId: k57abc\n---\n\nText.\n',
      'no-topic.md',
    )

    expect(draft.ok).toBe(false)
    if (draft.ok) return
    expect(draft.error).toMatch(/topic/)
  })

  test('an empty body is refused, because a blank summary is not a draft', () => {
    const draft = parseDraftFile(
      '---\nitemId: k57abc\ntopic: Agents\n---\n\n   \n',
      'blank.md',
    )

    expect(draft.ok).toBe(false)
    if (draft.ok) return
    expect(draft.error).toMatch(/summary/i)
  })

  test('quoted values lose their quotes, and a colon in a value survives', () => {
    const draft = parseDraftFile(
      '---\nitemId: "k57abc"\nurl: https://a.test/x?a=1:2\ntopic: Agents\n---\n\nText.\n',
      'quoted.md',
    )

    expect(draft.ok).toBe(true)
    if (!draft.ok) return
    expect(draft.itemId).toBe('k57abc')
    expect(draft.url).toBe('https://a.test/x?a=1:2')
  })
})

// ---------------------------------------------------------------------------
// Reading a value back out of the Convex CLI, which also prints logs
// ---------------------------------------------------------------------------

describe('lastJsonValue', () => {
  test('the result is read out of a stream that also carries log lines', () => {
    const out = `✔ Connected
log: news apply: 2 rows
{
  "applied": 2,
  "skipped": 0
}
`
    expect(lastJsonValue(out)).toEqual({ applied: 2, skipped: 0 })
  })

  test('a trailing log line after the result does not hide it', () => {
    const out = '{"applied": 1}\nDone in 3s\n'
    expect(lastJsonValue(out)).toEqual({ applied: 1 })
  })

  test('the LAST value wins, because the result is printed last', () => {
    const out = '{"a": 1}\nsome noise\n{"a": 2}\n'
    expect(lastJsonValue(out)).toEqual({ a: 2 })
  })

  test('a brace inside a string does not end the value early', () => {
    const out = 'noise\n{"headline": "A post about {braces}", "applied": 1}\n'
    expect(lastJsonValue(out)).toEqual({
      headline: 'A post about {braces}',
      applied: 1,
    })
  })

  test('output with no value at all is null, not a crash', () => {
    expect(lastJsonValue('nothing here\n')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// The per-item report, which is the whole visible result of a run
// ---------------------------------------------------------------------------

describe('renderReport', () => {
  test('every draft gets one line, and the counts close the report', () => {
    const lines = renderReport({
      applied: 1,
      skipped: 1,
      results: [
        {
          itemId: 'k1',
          outcome: 'applied',
          headline: 'A post',
          topicCreated: false,
        },
        {
          itemId: 'k2',
          outcome: 'already-drafted',
          headline: 'Another post',
          topicCreated: false,
        },
      ],
    })

    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain('applied')
    expect(lines[0]).toContain('A post')
    expect(lines[1]).toContain('already-drafted')
    expect(lines[2]).toBe('1 applied, 1 skipped')
  })

  test('a created topic is called out, because the list is owner-managed', () => {
    const lines = renderReport({
      applied: 1,
      skipped: 0,
      results: [
        {
          itemId: 'k1',
          outcome: 'applied',
          headline: 'A post',
          topicCreated: true,
        },
      ],
    })

    expect(lines[0]).toMatch(/new topic/i)
  })
})
