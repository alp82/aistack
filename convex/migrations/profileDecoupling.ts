import { v } from 'convex/values'
import { internalMutation, internalQuery } from '../_generated/server'

/**
 * Profile-first decoupling migration (Phase B). Helpers consumed by
 * scripts/migrate-profile-decoupling.ts, which talks HTTP to Convex with
 * admin auth (same pattern as the retired stack-image backfill it supersedes).
 *
 * Per creator: move the most-recently-updated stack avatar onto the creator
 * (skip-if-set), merge every stack personalPageUrl into creators.personalPages
 * (deduped by URL, name = hostname), then clear the dying stack identity
 * fields. `stackImageUrl` is cleared only once consumed — i.e. only when the
 * creator ends the run with an avatarStorageId (or the script explicitly gave
 * up on a dead URL) — so a failed image fetch keeps the row dirty and a rerun
 * retries it. Phase C's schema narrow refuses to deploy while any row is
 * still dirty (self-gating).
 */

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export const listCreatorsToMigrate = internalQuery({
  args: {},
  handler: async (ctx) => {
    const creators = await ctx.db.query('creators').collect()
    const rows = []
    for (const creator of creators) {
      const stacks = await ctx.db
        .query('stacks')
        .withIndex('by_creatorId', (q) => q.eq('creatorId', creator._id))
        .collect()
      const byRecency = [...stacks].sort((a, b) => b.updatedAt - a.updatedAt)
      const winningStackAvatarId =
        byRecency.find((s) => s.avatarStorageId)?.avatarStorageId ?? null
      const hasCreatorAvatar = creator.avatarStorageId !== undefined
      const fallbackImageUrl =
        !hasCreatorAvatar && !winningStackAvatarId
          ? (byRecency.find((s) => s.stackImageUrl)?.stackImageUrl ?? null)
          : null
      const needsWork = stacks.some(
        (s) => s.avatarStorageId || s.personalPageUrl || s.stackImageUrl,
      )
      rows.push({
        creatorId: creator._id,
        name: creator.name,
        hasCreatorAvatar,
        winningStackAvatarId,
        fallbackImageUrl,
        needsWork,
      })
    }
    return rows
  },
})

export const generateUploadUrl = internalMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

export const applyForCreator = internalMutation({
  args: {
    creatorId: v.id('creators'),
    /** Storage id of a fetched-and-uploaded `stackImageUrl` fallback image. */
    uploadedStorageId: v.optional(v.id('_storage')),
    /**
     * Escape hatch for permanently dead `stackImageUrl` hosts: clear the
     * field without an upload so "rerun until clean" terminates. Set by the
     * script's --give-up flag only; logged loudly there.
     */
    giveUpImageUrl: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.creatorId)
    if (!creator) throw new Error('Creator not found')

    const stacks = await ctx.db
      .query('stacks')
      .withIndex('by_creatorId', (q) => q.eq('creatorId', args.creatorId))
      .collect()
    const byRecency = [...stacks].sort((a, b) => b.updatedAt - a.updatedAt)

    // Avatar: skip-if-set; most-recent stack avatar wins over the uploaded
    // stackImageUrl fallback.
    let creatorAvatarId = creator.avatarStorageId
    if (!creatorAvatarId) {
      const winning = byRecency.find((s) => s.avatarStorageId)?.avatarStorageId
      const next = winning ?? args.uploadedStorageId
      if (next) {
        await ctx.db.patch(creator._id, { avatarStorageId: next })
        creatorAvatarId = next
      }
    }

    // personalPages: merge every stack personalPageUrl, deduped by URL
    // (existing creator pages win their slot; name = hostname).
    const seen = new Set(creator.personalPages.map((p) => p.url))
    const mergedPages = [...creator.personalPages]
    for (const stack of byRecency) {
      if (stack.personalPageUrl && !seen.has(stack.personalPageUrl)) {
        seen.add(stack.personalPageUrl)
        mergedPages.push({
          name: hostnameOf(stack.personalPageUrl),
          url: stack.personalPageUrl,
        })
      }
    }
    if (mergedPages.length !== creator.personalPages.length) {
      await ctx.db.patch(creator._id, { personalPages: mergedPages })
    }

    // Clear consumed stack fields. avatarStorageId/personalPageUrl are
    // deterministically consumed above; stackImageUrl only once the creator
    // actually has an avatar (or the script gave up) — a failed fetch keeps
    // it as the retry source.
    const clearImageUrl = creatorAvatarId !== undefined || args.giveUpImageUrl === true
    for (const stack of stacks) {
      const patch: Record<string, undefined> = {}
      if (stack.avatarStorageId) patch.avatarStorageId = undefined
      if (stack.personalPageUrl) patch.personalPageUrl = undefined
      if (stack.stackImageUrl && clearImageUrl) patch.stackImageUrl = undefined
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(stack._id, patch)
      }
    }

    return null
  },
})
