import { v } from 'convex/values'
import { internal } from './_generated/api'
import {
  internalAction,
  internalQuery,
  mutation,
  query,
} from './_generated/server'
import { isAdmin } from './lib/admin'

/**
 * Reactive query that resolves a Convex storage ID to a public URL.
 * Used by IconUploadField for live preview after upload.
 */
export const getUrl = query({
  args: { storageId: v.id('_storage') },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId)
  },
})

/**
 * Admin-gated mutation to delete a storage blob.
 * Used by IconUploadField when an admin removes an icon.
 */
export const deleteIconStorage = mutation({
  args: { storageId: v.id('_storage') },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx))) {
      throw new Error('Unauthorized')
    }
    await ctx.storage.delete(args.storageId)
    return null
  },
})

/**
 * Internal helper for gcOrphans. Returns the set of storage IDs currently
 * referenced by any tool/model/bundle row.
 */
export const _collectReferencedStorageIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const referenced: string[] = []
    const tools = await ctx.db.query('tools').collect()
    for (const t of tools) {
      if (t.iconStorageId) referenced.push(t.iconStorageId)
    }
    const models = await ctx.db.query('models').collect()
    for (const m of models) {
      if (m.iconStorageId) referenced.push(m.iconStorageId)
    }
    const bundles = await ctx.db.query('bundles').collect()
    for (const b of bundles) {
      if (b.iconStorageId) referenced.push(b.iconStorageId)
    }
    const creators = await ctx.db.query('creators').collect()
    for (const c of creators) {
      if (c.avatarStorageId) referenced.push(c.avatarStorageId)
    }
    const editSuggestions = await ctx.db.query('toolEditSuggestions').collect()
    for (const s of editSuggestions) {
      if (s.suggestedIconStorageId) referenced.push(s.suggestedIconStorageId)
    }
    return referenced
  },
})

/**
 * Internal helper for gcOrphans. Paginates over the _storage system table.
 */
export const _listStoragePage = internalQuery({
  args: { cursor: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    return await ctx.db.system
      .query('_storage')
      .paginate({ cursor: args.cursor, numItems: 256 })
  },
})

/**
 * Nightly internal action that lists all blobs in `_storage` and deletes
 * any that are not referenced by any tool/model/bundle row and are at least
 * 24 hours old. Returns counts for logging.
 */
export const gcOrphans = internalAction({
  args: {},
  returns: v.object({ scanned: v.number(), deleted: v.number() }),
  handler: async (ctx): Promise<{ scanned: number; deleted: number }> => {
    const referencedList: string[] = await ctx.runQuery(
      internal.iconStorage._collectReferencedStorageIds,
      {},
    )
    const referenced = new Set(referencedList)

    let scanned = 0
    let deleted = 0
    const cutoff = Date.now() - 24 * 60 * 60 * 1000

    let cursor: string | null = null
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const page: {
        page: Array<{ _id: string; _creationTime: number }>
        isDone: boolean
        continueCursor: string
      } = await ctx.runQuery(internal.iconStorage._listStoragePage, { cursor })

      for (const blob of page.page) {
        scanned++
        if (referenced.has(blob._id)) continue
        if (blob._creationTime > cutoff) continue
        try {
          await ctx.storage.delete(blob._id as never)
          deleted++
        } catch {
          // ignore - best-effort
        }
      }

      if (page.isDone) break
      cursor = page.continueCursor
    }

    return { scanned, deleted }
  },
})
