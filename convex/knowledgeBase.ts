/** The public knowledge base projection over the approved news item stream. */

import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { query } from './_generated/server'
import { hnDiscussionUrl } from './lib/hackerNews'
import { sanitizeXEmbed } from './lib/xEmbedSanitizer'

const LATEST_COUNT = 5
const CARD_HEADLINE_COUNT = 3
const FULL_ENTRY_LENGTH = 120

type PublicRow = Doc<'newsItems'> & {
  sourceName: string
  attribution?: string
}

function displaySource(item: Doc<'newsItems'>, source?: Doc<'newsSources'>): string {
  if (source) return source.name
  try {
    return new URL(item.url).hostname.replace(/^www\./, '')
  } catch {
    return 'Source'
  }
}

function isVisible(item: Doc<'newsItems'>): boolean {
  return (
    item.knowledgeBasePublishedAt !== undefined &&
    item.state === 'approved' &&
    Boolean(item.summary?.trim()) &&
    item.topicId !== undefined &&
    (item.licenseClass !== 'x' || Boolean(item.xEmbed?.html.trim()))
  )
}

function itemDate(item: Doc<'newsItems'>): number {
  return item.publishedAt ?? item.collectedAt
}

function isThinRelease(item: Doc<'newsItems'>): boolean {
  if (
    item.licenseClass !== 'permissive-release-notes' &&
    item.licenseClass !== 'unlicensed-release-notes'
  ) {
    return false
  }
  const body = item.sourceText?.trim() ?? ''
  const compareTarget = body.replace(/^full changelog\s*:?\s*/i, '').trim()
  let compareOnly = /^full changelog\b/i.test(body) && compareTarget.length === 0
  try {
    compareOnly =
      compareOnly || new URL(compareTarget).pathname.toLowerCase().includes('/compare/')
  } catch {
    // A sentence that mentions a comparison still carries content to read.
  }
  return body.length < FULL_ENTRY_LENGTH || compareOnly
}

async function publicRows(ctx: { db: any }): Promise<PublicRow[]> {
  const items = (
    await ctx.db
      .query('newsItems')
      .withIndex('by_knowledgeBasePublishedAt', (q: any) =>
        q.gt('knowledgeBasePublishedAt', 0)
      )
      .collect()
  )
    .filter(isVisible)
    .sort((a: Doc<'newsItems'>, b: Doc<'newsItems'>) => itemDate(b) - itemDate(a))
  const sources = new Map<string, Doc<'newsSources'> | null>()
  const rows: PublicRow[] = []
  for (const item of items) {
    let source: Doc<'newsSources'> | undefined
    if (item.sourceId) {
      if (!sources.has(item.sourceId)) {
        sources.set(item.sourceId, await ctx.db.get(item.sourceId))
      }
      source = sources.get(item.sourceId) ?? undefined
    }
    rows.push({
      ...item,
      sourceName: displaySource(item, source),
      attribution: source?.attribution,
    })
  }
  return rows
}

function discussion(item: PublicRow) {
  if (!item.hnItemId) return {}
  return {
    points: item.hnPoints ?? 0,
    comments: item.hnComments ?? 0,
    discussionUrl: hnDiscussionUrl(item.hnItemId),
  }
}

function projectEntry(item: PublicRow) {
  if (item.licenseClass === 'x') {
    return {
      licenseClass: 'x' as const,
      summary: item.summary!,
      embedHtml: sanitizeXEmbed(item.xEmbed!.html),
    }
  }

  const common = {
    licenseClass: item.licenseClass,
    headline: item.headline,
    url: item.url,
    sourceName: item.sourceName,
    publishedAt: itemDate(item),
    summary: item.summary!,
    ...discussion(item),
  }
  if (
    (item.licenseClass === 'cc-by' ||
      item.licenseClass === 'permissive-release-notes') &&
    item.attribution
  ) {
    return {
      ...common,
      sourceText: item.sourceText,
      attribution: item.attribution,
    }
  }
  return common
}

export const getIndex = query({
  args: {},
  handler: async (ctx) => {
    const topics = await ctx.db
      .query('newsTopics')
      .withIndex('by_order')
      .collect()
    const items = await publicRows(ctx)

    const topicById = new Map(topics.map((topic) => [topic._id, topic]))
    const latest = items.slice(0, LATEST_COUNT).map((item) => {
      const topic = topicById.get(item.topicId!)
      if (item.licenseClass === 'x') {
        return {
          licenseClass: 'x' as const,
          summary: item.summary!,
          topicName: topic?.name ?? '',
          topicSlug: topic?.slug ?? '',
        }
      }
      return {
        licenseClass: item.licenseClass,
        headline: item.headline,
        url: item.url,
        publishedAt: itemDate(item),
        topicName: topic?.name ?? '',
        topicSlug: topic?.slug ?? '',
      }
    })

    return {
      latest,
      topics: topics.map((topic) => {
        const topicItems = items.filter((item) => item.topicId === topic._id)
        return {
          name: topic.name,
          slug: topic.slug,
          itemCount: topicItems.length,
          headlines: topicItems.slice(0, CARD_HEADLINE_COUNT).map((item) =>
            item.licenseClass === 'x' ? item.summary! : item.headline
          ),
        }
      }),
    }
  },
})

export const getTopic = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const topic = await ctx.db
      .query('newsTopics')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
    if (!topic) return null

    const items = (await publicRows(ctx)).filter(
      (item) => item.topicId === topic._id
    )
    return {
      topic: { name: topic.name, slug: topic.slug },
      itemCount: items.length,
      thinReleases: items.filter(isThinRelease).map((item) => ({
        licenseClass: item.licenseClass as
          | 'permissive-release-notes'
          | 'unlicensed-release-notes',
        headline: item.headline,
        url: item.url,
        sourceName: item.sourceName,
      })),
      entries: items.filter((item) => !isThinRelease(item)).map(projectEntry),
    }
  },
})
