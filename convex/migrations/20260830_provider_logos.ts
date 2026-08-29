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
 * Three rows were filed under provider "Other" and are corrected first so
 * they map. Meta has a logo too; the other vendors without one (ElevenLabs,
 * Kuaishou, ByteDance, Black Forest Labs, Cognition) keep their stored icon.
 *
 * IDEMPOTENT. A row already on the logo with no storage icon is skipped.
 */
const PROVIDER_FIXES: Record<string, string> = {
  'glm-5.2': 'Zhipu AI',
  'kimi-k3': 'Moonshot AI',
  'composer-2.5': 'Cursor',
}

export const run = internalMutation({
  args: {},
  returns: v.object({ patched: v.number(), skipped: v.number(), unknown: v.array(v.string()) }),
  handler: async (ctx) => {
    let patched = 0
    let skipped = 0
    const unknown: string[] = []
    for (const row of await ctx.db.query('models').collect()) {
      const fixed = PROVIDER_FIXES[row.slug]
      if (fixed && row.provider !== fixed) {
        await ctx.db.patch(row._id, { provider: fixed, updatedAt: Date.now() })
        row.provider = fixed
      }
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
