/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.{js,ts}')

describe('the public knowledge base', () => {
  test('groups published drafted items by topic and limits the latest strip to five', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx: any) => {
      const topicId = await ctx.db.insert('newsTopics', {
        name: 'Agent harnesses',
        slug: 'agent-harnesses',
        order: 0,
        createdAt: 1,
      })

      for (let n = 1; n <= 6; n++) {
        await ctx.db.insert('newsItems', {
          url: `https://example.com/published-${n}`,
          urlKey: `https://example.com/published-${n}`,
          headline: `Published ${n}`,
          publishedAt: n,
          collectedAt: n,
          intake: 'collector',
          licenseClass: 'article',
          state: 'approved',
          summary: `Summary ${n}`,
          topicId,
          knowledgeBasePublication: { publishedAt: 100 },
          updatedAt: n,
        })
      }

      const hidden = [
        { headline: 'Approved only', knowledgeBasePublication: undefined, summary: 'Drafted' },
        { headline: 'Undrafted', knowledgeBasePublication: { publishedAt: 100 }, summary: undefined },
        { headline: 'Discarded', knowledgeBasePublication: { publishedAt: 100 }, summary: 'Drafted', state: 'discarded' },
      ]
      for (const [n, item] of hidden.entries()) {
        await ctx.db.insert('newsItems', {
          url: `https://example.com/hidden-${n}`,
          urlKey: `https://example.com/hidden-${n}`,
          headline: item.headline,
          publishedAt: 20 + n,
          collectedAt: 20 + n,
          intake: 'collector',
          licenseClass: 'article',
          state: item.state ?? 'approved',
          summary: item.summary,
          topicId,
          knowledgeBasePublication: item.knowledgeBasePublication,
          updatedAt: 20 + n,
        })
      }
    })

    const index = await t.query(api.knowledgeBase.getIndex, {})

    expect(index.latest.map((item: any) => item.headline)).toEqual([
      'Published 6',
      'Published 5',
      'Published 4',
      'Published 3',
      'Published 2',
    ])
    expect(index.topics).toEqual([
      {
        name: 'Agent harnesses',
        slug: 'agent-harnesses',
        itemCount: 6,
        headlines: ['Published 6', 'Published 5', 'Published 4'],
      },
    ])
  })

  test('returns only the content each license class permits', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx: any) => {
      const topicId = await ctx.db.insert('newsTopics', {
        name: 'Models',
        slug: 'models',
        order: 0,
        createdAt: 1,
      })
      const attributedSourceId = await ctx.db.insert('newsSources', {
        name: 'Gemini API changelog',
        slug: 'gemini-api-changelog',
        kind: 'page',
        url: 'https://example.com/changelog',
        licenseClass: 'cc-by',
        attribution: 'Google, CC BY 4.0',
        enabled: true,
        collectFrom: 0,
        consecutiveFailures: 0,
        createdAt: 1,
        updatedAt: 1,
      })
      const releaseSourceId = await ctx.db.insert('newsSources', {
        name: 'opencode releases',
        slug: 'opencode-releases',
        kind: 'feed',
        url: 'https://example.com/releases',
        licenseClass: 'permissive-release-notes',
        attribution: 'opencode contributors, MIT',
        enabled: true,
        collectFrom: 0,
        consecutiveFailures: 0,
        createdAt: 1,
        updatedAt: 1,
      })

      const base = {
        collectedAt: 1,
        intake: 'collector',
        state: 'approved',
        summary: 'Our summary.',
        topicId,
        knowledgeBasePublication: { publishedAt: 100 },
        updatedAt: 1,
      }
      const rows = [
        {
          url: 'https://example.com/cc-by',
          urlKey: 'cc-by',
          headline: 'CC-BY entry',
          licenseClass: 'cc-by',
          sourceId: attributedSourceId,
          sourceText: 'The source text.',
          knowledgeBasePublication: {
            publishedAt: 100,
            attribution: 'Google, CC BY 4.0',
          },
        },
        {
          url: 'https://example.com/permissive',
          urlKey: 'permissive',
          headline: 'Permissive release',
          licenseClass: 'permissive-release-notes',
          sourceId: releaseSourceId,
          sourceText: 'Substantive release notes '.repeat(8),
          knowledgeBasePublication: {
            publishedAt: 100,
            attribution: 'opencode contributors, MIT',
          },
        },
        {
          url: 'https://example.com/unlicensed',
          urlKey: 'unlicensed',
          headline: 'Unlicensed release',
          licenseClass: 'unlicensed-release-notes',
          sourceText: 'Vendor words must never leave Convex.',
        },
        {
          url: 'https://example.com/article',
          urlKey: 'article',
          headline: 'Article entry',
          licenseClass: 'article',
          sourceText: 'Article text must never leave Convex.',
        },
        {
          url: 'https://example.com/hn',
          urlKey: 'hn',
          headline: 'Hacker News entry',
          licenseClass: 'hn',
          hnItemId: '42',
          hnPoints: 120,
          hnComments: 34,
        },
        {
          url: 'https://x.com/example/status/7',
          urlKey: 'x',
          headline: 'X words must not leave Convex',
          licenseClass: 'x',
          hnItemId: '99',
          hnPoints: 500,
          hnComments: 80,
          xEmbed: {
            statusId: '7',
            html: '<blockquote class="twitter-tweet" onclick="steal()"><p>Safe <a href="https://x.com/example/status/7">link</a><img src=x onerror=steal()></p><script src="https://platform.twitter.com/widgets.js">steal()</script><a href="javascript:steal()">bad</a></blockquote>',
          },
        },
      ]
      for (const [index, row] of rows.entries()) {
        await ctx.db.insert('newsItems', {
          ...base,
          ...row,
          publishedAt: index + 1,
        })
      }
    })

    const page = await t.query(api.knowledgeBase.getTopic, { slug: 'models' })
    const byClass = new Map(
      page!.entries.map((item: any) => [item.licenseClass, item]),
    )

    expect(byClass.get('cc-by')).toMatchObject({
      sourceText: 'The source text.',
      attribution: 'Google, CC BY 4.0',
    })
    expect(byClass.get('permissive-release-notes')).toMatchObject({
      attribution: 'opencode contributors, MIT',
    })
    expect(byClass.get('article').sourceText).toBeUndefined()
    expect(byClass.get('hn').discussionUrl).toBe(
      'https://news.ycombinator.com/item?id=42',
    )
    expect(byClass.get('hn')).toMatchObject({ points: 120, comments: 34 })

    expect(page!.thinReleases).toEqual([
      {
        licenseClass: 'unlicensed-release-notes',
        headline: 'Unlicensed release',
        url: 'https://example.com/unlicensed',
        sourceName: 'example.com',
      },
    ])
    const x = byClass.get('x')
    expect(Object.keys(x).sort()).toEqual([
      'embedHtml',
      'licenseClass',
      'summary',
    ])
    expect(x.embedHtml).toContain('<blockquote class="twitter-tweet">')
    expect(x.embedHtml).toContain('<a href="https://x.com/example/status/7"')
    expect(x.embedHtml).not.toMatch(/script|onclick|onerror|javascript:|<img/i)
  })

  test('collapses short and compare-only releases while keeping 120 characters', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx: any) => {
      const topicId = await ctx.db.insert('newsTopics', {
        name: 'Releases',
        slug: 'releases',
        order: 0,
        createdAt: 1,
      })
      const sourceId = await ctx.db.insert('newsSources', {
        name: 'tool releases',
        slug: 'tool-releases',
        kind: 'feed',
        url: 'https://example.com/releases',
        licenseClass: 'permissive-release-notes',
        attribution: 'Tool contributors, MIT',
        enabled: true,
        collectFrom: 0,
        consecutiveFailures: 0,
        createdAt: 1,
        updatedAt: 1,
      })
      const compare = `https://github.com/${'long-name/'.repeat(10)}compare/v1.0.0...v1.1.0`
      const changelog = `Full Changelog : ${'v1.0.0...v1.1.0 '.repeat(10)}`
      for (const [index, [headline, sourceText]] of [
        ['119 characters', 'a'.repeat(119)],
        ['120 characters', 'b'.repeat(120)],
        ['Compare only', compare],
        ['Full changelog only', changelog],
      ].entries()) {
        await ctx.db.insert('newsItems', {
          url: `https://example.com/${index}`,
          urlKey: `release-${index}`,
          headline,
          publishedAt: index,
          collectedAt: index,
          sourceId,
          intake: 'collector',
          licenseClass: 'permissive-release-notes',
          sourceText,
          state: 'approved',
          summary: 'Our summary.',
          topicId,
          knowledgeBasePublication: { publishedAt: 100 },
          updatedAt: index,
        })
      }
    })

    const page = await t.query(api.knowledgeBase.getTopic, { slug: 'releases' })

    expect(page!.thinReleases.map((item: any) => item.headline).sort()).toEqual([
      '119 characters',
      'Compare only',
      'Full changelog only',
    ])
    expect(page!.entries.map((item: any) => item.headline)).toEqual([
      '120 characters',
    ])
  })

  test('keeps exact attribution when the source row is gone', async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx: any) => {
      const topicId = await ctx.db.insert('newsTopics', {
        name: 'APIs',
        slug: 'apis',
        order: 0,
        createdAt: 1,
      })
      for (const [index, [licenseClass, attribution]] of [
        ['cc-by', 'Google, CC BY 4.0'],
        ['permissive-release-notes', 'opencode contributors, MIT'],
      ].entries()) {
        await ctx.db.insert('newsItems', {
          url: `https://vendor.test/${index}`,
          urlKey: `orphan-${index}`,
          headline: `Orphan ${index}`,
          collectedAt: index,
          intake: 'collector',
          licenseClass,
          sourceText: 'Substantive licensed source text. '.repeat(8),
          state: 'approved',
          summary: 'Our summary.',
          topicId,
          knowledgeBasePublication: { publishedAt: 100, attribution },
          updatedAt: index,
        })
      }
    })

    const page = await t.query(api.knowledgeBase.getTopic, { slug: 'apis' })

    expect(page!.entries).toHaveLength(2)
    const byClass = new Map(
      page!.entries.map((item: any) => [item.licenseClass, item]),
    )
    expect(byClass.get('cc-by')).toMatchObject({
      sourceText: expect.any(String),
      attribution: 'Google, CC BY 4.0',
    })
    expect(byClass.get('permissive-release-notes')).toMatchObject({
      sourceText: expect.any(String),
      attribution: 'opencode contributors, MIT',
    })
  })
})
