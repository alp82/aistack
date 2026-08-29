import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { datasetProviderOf, logoUrl } from '../lib/modelImport'

/**
 * One logo per provider. Rows created before the import carried hand-uploaded
 * icons that differ from the models.dev logo the import stamps on new rows, so
 * two models of one vendor rendered two different marks on a stack. Every
 * model whose provider maps to a models.dev provider now points at that logo;
 * a stored icon is detached (the storage file stays). Rows of an unknown
 * provider keep whatever they had.
 *
 * IDEMPOTENT. A row already on the logo with no storage icon is skipped.
 */
export const run = internalMutation({
  args: {},
  returns: v.object({ patched: v.number(), skipped: v.number(), unknown: v.array(v.string()) }),
  handler: async (ctx) => {
    let patched = 0
    let skipped = 0
    const unknown: string[] = []
    for (const row of await ctx.db.query('models').collect()) {
      const providerId = datasetProviderOf(row.provider)
      if (!providerId) {
        unknown.push(row.slug)
        continue
      }
      const iconUrl = logoUrl(providerId)
      if (row.iconUrl === iconUrl && row.iconStorageId === undefined) {
        skipped++
        continue
      }
      await ctx.db.patch(row._id, { iconUrl, iconStorageId: undefined, updatedAt: Date.now() })
      patched++
    }
    return { patched, skipped, unknown }
  },
})
