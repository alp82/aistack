import { internalMutation } from '../_generated/server'

/**
 * Reconstruct the knowledge base publication time for ready historical items.
 *
 * A newsletter send publishes every ready approved item. For rows created
 * before that rule existed, the first send after approval and drafting is the
 * publication time. Rows that became ready after the latest send stay queued.
 *
 * IDEMPOTENT. A row with a publication time is never changed.
 * Run with
 * `scripts/convex-prod.sh run migrations/20260823_knowledge_base_publication:run`.
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const sends = (
      await ctx.db
        .query('newsIssues')
        .withIndex('by_status', (q) => q.eq('status', 'sent'))
        .collect()
    )
      .map((issue) => issue.sentAt)
      .filter((sentAt): sentAt is number => sentAt !== undefined)
      .sort((a, b) => a - b)
    const items = await ctx.db
      .query('newsItems')
      .withIndex('by_state_knowledgeBasePublishedAt', (q) =>
        q
          .eq('state', 'approved')
          .eq('knowledgeBasePublishedAt', undefined)
      )
      .collect()

    let published = 0
    let waiting = 0
    for (const item of items) {
      if (!item.summary?.trim() || !item.topicId) {
        waiting++
        continue
      }
      const summaryReadyAt = item.draftedAt ?? item.updatedAt
      const readyAt = Math.max(item.decidedAt ?? item.updatedAt, summaryReadyAt)
      const publication = sends.find((sentAt) => sentAt >= readyAt)
      if (publication === undefined) {
        waiting++
        continue
      }
      await ctx.db.patch(item._id, { knowledgeBasePublishedAt: publication })
      published++
    }
    return { published, waiting }
  },
})
