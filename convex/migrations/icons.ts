import { v } from 'convex/values'
import { internalMutation, internalQuery } from '../_generated/server'

/**
 * Helpers consumed by scripts/migrate-icons.ts. Run via `npx convex run`
 * against the user's local deploy (which is what the CLI script uses).
 */

export const listToolsToMigrate = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('tools').collect()
    return all.map((t) => ({
      _id: t._id,
      name: t.name,
      iconUrl: t.iconUrl,
      iconStorageId: t.iconStorageId,
    }))
  },
})

export const listModelsToMigrate = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('models').collect()
    return all.map((m) => ({
      _id: m._id,
      name: m.name,
      iconUrl: m.iconUrl,
      iconStorageId: m.iconStorageId,
    }))
  },
})

export const listBundlesToMigrate = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('bundles').collect()
    return all.map((b) => ({
      _id: b._id,
      name: b.name,
      iconUrl: b.iconUrl,
      iconStorageId: b.iconStorageId,
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

export const patchIcon = internalMutation({
  args: {
    table: v.union(v.literal('tools'), v.literal('models'), v.literal('bundles')),
    toolId: v.optional(v.id('tools')),
    modelId: v.optional(v.id('models')),
    bundleId: v.optional(v.id('bundles')),
    iconStorageId: v.id('_storage'),
    clearIconUrl: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now()
    if (args.table === 'tools') {
      if (!args.toolId) throw new Error('toolId required when table=tools')
      const patch: {
        iconStorageId: typeof args.iconStorageId
        iconUrl?: undefined
        updatedAt: number
      } = {
        iconStorageId: args.iconStorageId,
        updatedAt: now,
      }
      if (args.clearIconUrl) patch.iconUrl = undefined
      await ctx.db.patch(args.toolId, patch)
    } else if (args.table === 'models') {
      if (!args.modelId) throw new Error('modelId required when table=models')
      const patch: {
        iconStorageId: typeof args.iconStorageId
        iconUrl?: undefined
        updatedAt: number
      } = {
        iconStorageId: args.iconStorageId,
        updatedAt: now,
      }
      if (args.clearIconUrl) patch.iconUrl = undefined
      await ctx.db.patch(args.modelId, patch)
    } else {
      if (!args.bundleId) throw new Error('bundleId required when table=bundles')
      const patch: {
        iconStorageId: typeof args.iconStorageId
        iconUrl?: undefined
        updatedAt: number
      } = {
        iconStorageId: args.iconStorageId,
        updatedAt: now,
      }
      if (args.clearIconUrl) patch.iconUrl = undefined
      await ctx.db.patch(args.bundleId, patch)
    }
    return null
  },
})
