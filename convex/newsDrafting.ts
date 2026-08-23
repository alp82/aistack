/**
 * The drafting lane of the news pipeline (#233, map #198).
 *
 * Spec: the Drafting section of docs/specs/news-pipeline.md. Decision:
 * docs/adr/0003-news-drafting-in-the-owner-session.md.
 *
 * THERE IS NO LLM CALL HERE, and there is no API key. Drafting runs as a skill
 * in the owner's Claude session (.claude/skills/news-draft). This file is the
 * two ends of that run:
 *
 *   1. `undrafted` hands the run its work: unpublished stream and inbox items
 *      with no summary, plus the topic list the run picks from.
 *   2. `applyDrafts` writes the reviewed drafts back onto those rows.
 *
 * Both are INTERNAL. `scripts/news-drafts.ts` reaches them over
 * `scripts/convex-prod.sh`, which authenticates with an admin key. An admin key
 * carries no user identity, so the `isAdmin` gate on the public news functions
 * would refuse it.
 */

import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { internalMutation, internalQuery } from './_generated/server'
import { NewsLicenseClass } from './schema'

/**
 * How many items one run drafts by default. The run reads the full linked page
 * per item through a subagent, so a batch is minutes of work, not seconds. The
 * owner raises it when the inbox has piled up.
 */
const DEFAULT_BATCH = 20

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'untitled'
  )
}

// ---------------------------------------------------------------------------
// The read step
// ---------------------------------------------------------------------------

const DraftingItem = v.object({
  itemId: v.id('newsItems'),
  url: v.string(),
  headline: v.string(),
  publishedAt: v.union(v.number(), v.null()),
  collectedAt: v.number(),
  sourceName: v.union(v.string(), v.null()),
  licenseClass: NewsLicenseClass,
  /** The license notice a permissive release-notes item must carry. */
  attribution: v.union(v.string(), v.null()),
  /** Present only where the license class let us keep the body. */
  sourceText: v.union(v.string(), v.null()),
})

const DraftingTopic = v.object({
  topicId: v.id('newsTopics'),
  name: v.string(),
  slug: v.string(),
})

/**
 * The work for one drafting run, plus the topic list it picks from.
 *
 * Undrafted means `summary` is absent. That is the schema's own definition, and
 * it is why a failed item is re-attempted by the next run for free: nothing was
 * written, so it is still work.
 *
 * OLDEST FIRST. A weekly run that hits the limit must leave the newest items
 * behind, not the ones that have already waited.
 */
export const undrafted = internalQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.object({
    items: v.array(DraftingItem),
    topics: v.array(DraftingTopic),
    /** How many undrafted items remain past the limit. */
    remaining: v.number(),
  }),
  handler: async (ctx, args) => {
    const limit = Math.max(1, args.limit ?? DEFAULT_BATCH)
    const [inbox, approved] = await Promise.all(
      (['inbox', 'approved'] as const).map((state) =>
        ctx.db
          .query('newsItems')
          .withIndex('by_state_collectedAt', (q) => q.eq('state', state))
          .order('asc')
          .collect()
      )
    )
    const undraftedRows = [...inbox, ...approved]
      .filter((item) => !item.summary?.trim())
      .sort((a, b) => a.collectedAt - b.collectedAt)

    const sources = new Map<string, Doc<'newsSources'> | null>()
    const items = []
    for (const item of undraftedRows.slice(0, limit)) {
      let source: Doc<'newsSources'> | null = null
      if (item.sourceId) {
        const cached = sources.get(item.sourceId)
        source = cached === undefined ? await ctx.db.get(item.sourceId) : cached
        sources.set(item.sourceId, source)
      }
      items.push({
        itemId: item._id,
        url: item.url,
        headline: item.headline,
        publishedAt: item.publishedAt ?? null,
        collectedAt: item.collectedAt,
        sourceName: source?.name ?? null,
        licenseClass: item.licenseClass,
        attribution: source?.attribution ?? null,
        sourceText: item.sourceText ?? null,
      })
    }

    const topics = await ctx.db
      .query('newsTopics')
      .withIndex('by_order')
      .collect()

    return {
      items,
      topics: topics.map((topic) => ({
        topicId: topic._id,
        name: topic.name,
        slug: topic.slug,
      })),
      remaining: Math.max(0, undraftedRows.length - items.length),
    }
  },
})

// ---------------------------------------------------------------------------
// The apply step
// ---------------------------------------------------------------------------

/**
 * What became of one draft. `applied` is the only outcome that wrote a row, and
 * the script deletes only the files whose draft came back applied.
 *
 *   applied           the summary and the topic are on the row
 *   unknown-item      the id names no row, so the file is stale
 *   not-in-inbox      the owner discarded the item
 *   already-drafted   the row carries a summary the draft must not erase
 */
const ApplyOutcome = v.union(
  v.literal('applied'),
  v.literal('unknown-item'),
  v.literal('not-in-inbox'),
  v.literal('already-drafted')
)

/**
 * Write the reviewed drafts onto inbox rows or unpublished approved rows.
 *
 * ONE mutation for the whole batch, because every convex-prod call is an ssh
 * hop. It is also all-or-nothing per run, which is the right unit: a batch that
 * fails halfway would leave the script guessing which files to delete.
 *
 * A row that changed after the draft was written is SKIPPED, never overwritten.
 * The draft is the machine's first pass and the owner's own text is the later
 * one, so the report names the skip and the file stays for the owner to read.
 *
 * `itemId` is a plain string, not an `Id`. A stale file naming a deleted row
 * must come back as one report line, not as a validator error that throws the
 * whole batch away.
 *
 * A topic the list does not hold is CREATED. The owner reviewed and merged the
 * file, and the skill asks in the session before it proposes a new topic, so a
 * new name in a merged file is a decision the owner already made.
 */
export const applyDrafts = internalMutation({
  args: {
    drafts: v.array(
      v.object({
        itemId: v.string(),
        summary: v.string(),
        topic: v.string(),
      })
    ),
  },
  returns: v.object({
    results: v.array(
      v.object({
        itemId: v.string(),
        outcome: ApplyOutcome,
        headline: v.union(v.string(), v.null()),
        topicCreated: v.boolean(),
      })
    ),
    applied: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now()
    const results = []

    for (const draft of args.drafts) {
      const itemId = ctx.db.normalizeId('newsItems', draft.itemId)
      const item = itemId ? await ctx.db.get(itemId) : null
      if (!itemId || !item) {
        results.push({
          itemId: draft.itemId,
          outcome: 'unknown-item' as const,
          headline: null,
          topicCreated: false,
        })
        continue
      }
      if (item.state !== 'inbox' && item.state !== 'approved') {
        results.push({
          itemId: draft.itemId,
          outcome: 'not-in-inbox' as const,
          headline: item.headline,
          topicCreated: false,
        })
        continue
      }
      if (item.summary?.trim()) {
        results.push({
          itemId: draft.itemId,
          outcome: 'already-drafted' as const,
          headline: item.headline,
          topicCreated: false,
        })
        continue
      }

      const resolved = await resolveTopic(ctx, draft.topic)
      await ctx.db.patch(itemId, {
        summary: draft.summary.trim(),
        topicId: resolved.topicId,
        draftedAt: now,
        updatedAt: now,
      })
      results.push({
        itemId: draft.itemId,
        outcome: 'applied' as const,
        headline: item.headline,
        topicCreated: resolved.created,
      })
    }

    const applied = results.filter((r) => r.outcome === 'applied').length
    return { results, applied, skipped: results.length - applied }
  },
})

/** The topic by that name, created when the list does not hold it yet. */
async function resolveTopic(
  ctx: { db: any },
  name: string
): Promise<{ topicId: Id<'newsTopics'>; created: boolean }> {
  const trimmed = name.trim()
  const slug = slugify(trimmed)
  const existing = await ctx.db
    .query('newsTopics')
    .withIndex('by_slug', (q: any) => q.eq('slug', slug))
    .first()
  if (existing) return { topicId: existing._id, created: false }

  const last = await ctx.db
    .query('newsTopics')
    .withIndex('by_order')
    .order('desc')
    .first()
  const topicId = await ctx.db.insert('newsTopics', {
    name: trimmed,
    slug,
    order: (last?.order ?? -1) + 1,
    createdAt: Date.now(),
  })
  return { topicId, created: true }
}
