/**
 * The news pipeline core (#204, map #198). Spec: docs/specs/news-pipeline.md.
 *
 * Three things live here:
 *
 *   1. The COLLECTOR. A scheduled action reads every enabled source and writes
 *      new items into the inbox. Nothing reaches the public from collection.
 *   2. The INBOX. Owner-only reads and writes over collected items: edit the
 *      summary, set the topic, approve or discard.
 *   3. QUICK-ADD. The owner pastes a URL and the item lands in the inbox.
 *
 * Every surface here is ADMIN ONLY. The item stream is private, and only a
 * projection publishes. The projections themselves are not built here: the
 * newsletter is #201 and the knowledge base is #211.
 */

import { type Infer, v } from 'convex/values'
import { internal } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server'
import { newsUrlKey, parseFeed } from './lib/feed'
import { isAdmin } from './lib/admin'
import { NewsLicenseClass, NewsSourceKind } from './schema'

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

/**
 * A normal browser user agent, per the spec's Machinery note. openai.com sits
 * behind Cloudflare and the prototype (#177) needed this to get a feed at all.
 */
const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const FETCH_TIMEOUT_MS = 25_000

/** How many inbox rows one list call returns. The inbox is worked, not read. */
const INBOX_PAGE = 100

/**
 * The classes that allow us to keep the source body. Everything else keeps the
 * headline, the date, the link, and our own summary. See NewsLicenseClass.
 */
const FULL_TEXT_CLASSES = new Set(['cc-by', 'permissive-release-notes'])

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'untitled'
  )
}

async function assertAdmin(ctx: { auth: any }): Promise<void> {
  if (!(await isAdmin(ctx))) throw new Error('Unauthorized')
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

export const listSources = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return null
    const sources = await ctx.db.query('newsSources').collect()
    sources.sort((a, b) => a.name.localeCompare(b.name))
    return sources
  },
})

export const createSource = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    kind: NewsSourceKind,
    licenseClass: NewsLicenseClass,
    attribution: v.optional(v.string()),
    /** Absent means "start now", which is the answer that never floods. */
    collectFrom: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx)
    const name = args.name.trim()
    const url = args.url.trim()
    if (!name) throw new Error('A source needs a name')
    if (!/^https?:\/\//i.test(url)) throw new Error('A source needs an http URL')

    const existing = await ctx.db
      .query('newsSources')
      .filter((q) => q.eq(q.field('url'), url))
      .first()
    if (existing) throw new Error('That URL is already a source')

    const now = Date.now()
    return await ctx.db.insert('newsSources', {
      name,
      slug: await uniqueSourceSlug(ctx, slugify(name)),
      kind: args.kind,
      url,
      licenseClass: args.licenseClass,
      attribution: args.attribution?.trim() || undefined,
      enabled: true,
      collectFrom: args.collectFrom ?? now,
      consecutiveFailures: 0,
      createdAt: now,
      updatedAt: now,
    })
  },
})

async function uniqueSourceSlug(
  ctx: { db: any },
  base: string,
): Promise<string> {
  for (let n = 0; ; n++) {
    const candidate = n === 0 ? base : `${base}-${n}`
    const clash = await ctx.db
      .query('newsSources')
      .withIndex('by_slug', (q: any) => q.eq('slug', candidate))
      .first()
    if (!clash) return candidate
  }
}

export const setSourceEnabled = mutation({
  args: { sourceId: v.id('newsSources'), enabled: v.boolean() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx)
    await ctx.db.patch(args.sourceId, {
      enabled: args.enabled,
      updatedAt: Date.now(),
    })
  },
})

/**
 * Delete a source. Its already-collected items STAY, with `sourceId` cleared.
 *
 * Deleting the rows would rewrite history: an item the owner already approved
 * is in the item stream, and a source list edit must not silently unpublish it
 * from the next issue.
 */
export const deleteSource = mutation({
  args: { sourceId: v.id('newsSources') },
  handler: async (ctx, args) => {
    await assertAdmin(ctx)
    const items = await ctx.db
      .query('newsItems')
      .withIndex('by_source', (q) => q.eq('sourceId', args.sourceId))
      .collect()
    for (const item of items) {
      await ctx.db.patch(item._id, { sourceId: undefined })
    }
    await ctx.db.delete(args.sourceId)
    return { keptItems: items.length }
  },
})

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

export const listTopics = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return null
    return await ctx.db.query('newsTopics').withIndex('by_order').collect()
  },
})

/** Topic rows plus how many items carry each one. The Topics view needs both. */
export const listTopicsWithCounts = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return null
    const topics = await ctx.db
      .query('newsTopics')
      .withIndex('by_order')
      .collect()
    return await Promise.all(
      topics.map(async (topic) => {
        const items = await ctx.db
          .query('newsItems')
          .withIndex('by_topic', (q) => q.eq('topicId', topic._id))
          .collect()
        return { ...topic, itemCount: items.length }
      }),
    )
  },
})

export const createTopic = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx)
    const name = args.name.trim()
    if (!name) throw new Error('A topic needs a name')
    const slug = slugify(name)
    const clash = await ctx.db
      .query('newsTopics')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()
    if (clash) return clash._id

    const last = await ctx.db
      .query('newsTopics')
      .withIndex('by_order')
      .order('desc')
      .first()
    return await ctx.db.insert('newsTopics', {
      name,
      slug,
      order: (last?.order ?? -1) + 1,
      createdAt: Date.now(),
    })
  },
})

export const renameTopic = mutation({
  args: { topicId: v.id('newsTopics'), name: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx)
    const name = args.name.trim()
    if (!name) throw new Error('A topic needs a name')
    await ctx.db.patch(args.topicId, { name, slug: slugify(name) })
  },
})

/**
 * Delete a topic. REFUSED while any item carries it, because the alternative is
 * a knowledge base page whose grouping key points at nothing.
 */
export const deleteTopic = mutation({
  args: { topicId: v.id('newsTopics') },
  handler: async (ctx, args) => {
    await assertAdmin(ctx)
    const inUse = await ctx.db
      .query('newsItems')
      .withIndex('by_topic', (q) => q.eq('topicId', args.topicId))
      .first()
    if (inUse) throw new Error('Move the items off this topic first')
    await ctx.db.delete(args.topicId)
  },
})

// ---------------------------------------------------------------------------
// The inbox and the item stream
// ---------------------------------------------------------------------------

type ItemWithContext = Doc<'newsItems'> & {
  sourceName: string | null
  topicName: string | null
}

async function withContext(
  ctx: { db: any },
  items: Doc<'newsItems'>[],
): Promise<ItemWithContext[]> {
  const sourceNames = new Map<string, string>()
  const topicNames = new Map<string, string>()
  return await Promise.all(
    items.map(async (item) => {
      let sourceName: string | null = null
      if (item.sourceId) {
        const cached = sourceNames.get(item.sourceId)
        if (cached !== undefined) sourceName = cached
        else {
          const source = await ctx.db.get(item.sourceId)
          sourceName = source?.name ?? null
          if (sourceName) sourceNames.set(item.sourceId, sourceName)
        }
      }
      let topicName: string | null = null
      if (item.topicId) {
        const cached = topicNames.get(item.topicId)
        if (cached !== undefined) topicName = cached
        else {
          const topic = await ctx.db.get(item.topicId)
          topicName = topic?.name ?? null
          if (topicName) topicNames.set(item.topicId, topicName)
        }
      }
      return { ...item, sourceName, topicName }
    }),
  )
}

export const listItems = query({
  args: {
    state: v.union(
      v.literal('inbox'),
      v.literal('approved'),
      v.literal('discarded'),
    ),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) return null
    const items = await ctx.db
      .query('newsItems')
      .withIndex('by_state_collectedAt', (q) => q.eq('state', args.state))
      .order('desc')
      .take(INBOX_PAGE)
    return await withContext(ctx, items)
  },
})

/** The three state counts, for the tab badge and the sub-tab headers. */
export const countItems = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return null
    const count = async (state: 'inbox' | 'approved' | 'discarded') =>
      (
        await ctx.db
          .query('newsItems')
          .withIndex('by_state_collectedAt', (q) => q.eq('state', state))
          .collect()
      ).length
    return {
      inbox: await count('inbox'),
      approved: await count('approved'),
      discarded: await count('discarded'),
    }
  },
})

export const updateItem = mutation({
  args: {
    itemId: v.id('newsItems'),
    headline: v.optional(v.string()),
    summary: v.optional(v.string()),
    /** Null clears the topic. Absent leaves it alone. */
    topicId: v.optional(v.union(v.id('newsTopics'), v.null())),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx)
    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    if (args.headline !== undefined) {
      const headline = args.headline.trim()
      if (!headline) throw new Error('An item needs a headline')
      patch.headline = headline
    }
    if (args.summary !== undefined) {
      patch.summary = args.summary.trim() || undefined
    }
    if (args.topicId !== undefined) {
      patch.topicId = args.topicId ?? undefined
    }
    await ctx.db.patch(args.itemId, patch)
  },
})

/**
 * Move an item between the inbox, the item stream, and the discard pile.
 *
 * ONE mutation for all three moves, not three. The owner works the inbox by
 * changing an item's state, and a restore is the same act in reverse.
 */
export const setItemState = mutation({
  args: {
    itemId: v.id('newsItems'),
    state: v.union(
      v.literal('inbox'),
      v.literal('approved'),
      v.literal('discarded'),
    ),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx)
    const now = Date.now()
    await ctx.db.patch(args.itemId, {
      state: args.state,
      decidedAt: args.state === 'inbox' ? undefined : now,
      updatedAt: now,
    })
  },
})

// ---------------------------------------------------------------------------
// Quick-add
// ---------------------------------------------------------------------------

/** Result of one intake attempt. `duplicate` is a normal outcome, not a fault. */
const IntakeResult = v.object({
  added: v.boolean(),
  duplicate: v.boolean(),
  itemId: v.union(v.id('newsItems'), v.null()),
  headline: v.string(),
})

/**
 * Insert one collected link, or report it as a duplicate.
 *
 * The dedupe check and the insert sit in ONE mutation on purpose: two polls of
 * two sources that both carry the same repost run in different actions, and a
 * check in the action would let both through.
 */
export const insertItem = internalMutation({
  args: {
    url: v.string(),
    headline: v.string(),
    publishedAt: v.optional(v.number()),
    sourceId: v.optional(v.id('newsSources')),
    intake: v.union(v.literal('collector'), v.literal('quick-add')),
    licenseClass: NewsLicenseClass,
    sourceText: v.optional(v.string()),
  },
  returns: IntakeResult,
  handler: async (ctx, args) => {
    const urlKey = newsUrlKey(args.url)
    const existing = await ctx.db
      .query('newsItems')
      .withIndex('by_urlKey', (q) => q.eq('urlKey', urlKey))
      .first()
    if (existing) {
      return {
        added: false,
        duplicate: true,
        itemId: existing._id,
        headline: existing.headline,
      }
    }
    const now = Date.now()
    const itemId = await ctx.db.insert('newsItems', {
      url: args.url,
      urlKey,
      headline: args.headline,
      publishedAt: args.publishedAt,
      collectedAt: now,
      sourceId: args.sourceId,
      intake: args.intake,
      licenseClass: args.licenseClass,
      sourceText: FULL_TEXT_CLASSES.has(args.licenseClass)
        ? args.sourceText
        : undefined,
      state: 'inbox',
      updatedAt: now,
    })
    return { added: true, duplicate: false, itemId, headline: args.headline }
  },
})

/**
 * The owner pastes a URL and the item lands in the inbox.
 *
 * An ACTION, because it reads the page for its title. Typing every headline by
 * hand is the friction that stops a capture surface from being used, and the
 * owner can overwrite whatever the page claimed.
 *
 * The fetch is best-effort. A page that refuses us still yields an item: the
 * host stands in as the headline until the owner edits it.
 */
export const quickAdd = action({
  args: {
    url: v.string(),
    headline: v.optional(v.string()),
    licenseClass: v.optional(NewsLicenseClass),
  },
  returns: IntakeResult,
  handler: async (ctx, args): Promise<Infer<typeof IntakeResult>> => {
    if (!(await isAdmin(ctx))) throw new Error('Unauthorized')
    const url = args.url.trim()
    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      throw new Error('That is not a URL')
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Only http and https links can be added')
    }

    const typed = args.headline?.trim()
    const headline = typed || (await fetchPageTitle(url)) || parsed.hostname

    return await ctx.runMutation(internal.news.insertItem, {
      url,
      headline,
      sourceId: undefined,
      intake: 'quick-add',
      // A pasted link is an article until the owner says otherwise. It is the
      // class that permits the least, so a wrong guess never over-serves.
      licenseClass: args.licenseClass ?? 'article',
    })
  },
})

/** The `<title>` of a page, or null. Never throws: the caller has a fallback. */
async function fetchPageTitle(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,*/*' },
    })
    if (!res.ok) return null
    const body = await res.text()
    const match = body.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i)
    if (!match) return null
    const title = match[1]
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
    return title.length > 0 ? title.slice(0, 300) : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// The collector
// ---------------------------------------------------------------------------

export const enabledSources = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('newsSources')
      .withIndex('by_enabled', (q) => q.eq('enabled', true))
      .collect()
  },
})

export const recordPoll = internalMutation({
  args: {
    sourceId: v.id('newsSources'),
    error: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceId)
    if (!source) return
    const now = Date.now()
    await ctx.db.patch(args.sourceId, {
      lastPolledAt: now,
      lastOkAt: args.error === null ? now : source.lastOkAt,
      lastError: args.error ?? undefined,
      consecutiveFailures:
        args.error === null ? 0 : source.consecutiveFailures + 1,
      updatedAt: now,
    })
  },
})

interface PollReport {
  source: string
  added: number
  duplicates: number
  skippedOld: number
  error: string | null
}

/**
 * Read one source and write its new items to the inbox.
 *
 * Two filters keep the inbox worth opening. `collectFrom` drops the archive a
 * feed serves alongside its news, and the urlKey dedupe drops the repost. An
 * item with NO date passes the first filter: silence about a date is not
 * evidence of age, and the dedupe stops it from arriving twice.
 */
async function pollOne(
  ctx: { runMutation: any },
  source: Doc<'newsSources'>,
): Promise<PollReport> {
  const report: PollReport = {
    source: source.name,
    added: 0,
    duplicates: 0,
    skippedOld: 0,
    error: null,
  }
  try {
    const res = await fetch(source.url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'user-agent': USER_AGENT,
        accept:
          'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const feed = parseFeed(await res.text())
    if (feed.items.length === 0) throw new Error('feed parsed but zero items')

    for (const entry of feed.items) {
      if (entry.publishedAt !== null && entry.publishedAt < source.collectFrom) {
        report.skippedOld++
        continue
      }
      const result = await ctx.runMutation(internal.news.insertItem, {
        url: entry.link,
        headline: entry.title,
        publishedAt: entry.publishedAt ?? undefined,
        sourceId: source._id,
        intake: 'collector' as const,
        licenseClass: source.licenseClass,
        sourceText: entry.bodyText ?? undefined,
      })
      if (result.added) report.added++
      else report.duplicates++
    }
  } catch (e) {
    report.error = e instanceof Error ? e.message : String(e)
  }
  await ctx.runMutation(internal.news.recordPoll, {
    sourceId: source._id,
    error: report.error,
  })
  return report
}

/**
 * The collector. One run reads every enabled source.
 *
 * Sources are polled ONE AT A TIME, not concurrently. The run has no deadline
 * worth racing, and serial polling keeps one slow host from being the reason
 * fourteen requests leave at once.
 *
 * A failing source never stops the run. Its error lands on its own row, which
 * is what the Sources view shows.
 */
export const collect = internalAction({
  args: {},
  handler: async (ctx): Promise<PollReport[]> => {
    const sources = await ctx.runQuery(internal.news.enabledSources, {})
    const reports: PollReport[] = []
    for (const source of sources) {
      reports.push(await pollOne(ctx, source))
    }
    const added = reports.reduce((sum, r) => sum + r.added, 0)
    const failed = reports.filter((r) => r.error !== null).length
    console.log(
      `news collect: ${sources.length} sources, ${added} new items, ${failed} failed`,
    )
    return reports
  },
})

/** Run the collector now, from the Sources view. Same code path as the cron. */
export const collectNow = action({
  args: {},
  handler: async (ctx): Promise<PollReport[]> => {
    if (!(await isAdmin(ctx))) throw new Error('Unauthorized')
    return await ctx.runAction(internal.news.collect, {})
  },
})
