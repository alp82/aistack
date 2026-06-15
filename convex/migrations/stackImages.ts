import { v } from 'convex/values'
import { internalMutation, internalQuery } from '../_generated/server'

/**
 * Helpers consumed by scripts/migrate-stack-images.ts. Run via the script,
 * which talks HTTP to Convex with admin auth (same pattern as the icon
 * backfill). Backfills the storage-backed stack avatar from the legacy
 * user-controlled `stackImageUrl` column.
 */

export const listStacksToMigrate = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('stacks').collect()
    return all
      .filter((s) => s.stackImageUrl && !s.avatarStorageId)
      .map((s) => ({
        _id: s._id,
        name: s.name,
        stackImageUrl: s.stackImageUrl,
        avatarStorageId: s.avatarStorageId,
      }))
  },
})

export const generateUploadUrl = internalMutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

export const patchStackAvatar = internalMutation({
  args: {
    stackId: v.id('stacks'),
    avatarStorageId: v.id('_storage'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.stackId, {
      avatarStorageId: args.avatarStorageId,
      stackImageUrl: undefined,
      updatedAt: Date.now(),
    })
    return null
  },
})
