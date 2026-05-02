import { v } from 'convex/values'
import { query } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { isAdmin } from './lib/admin'

type Kind = 'tool' | 'model' | 'bundle'

type Row = {
  storageId: Id<'_storage'>
  sizeBytes: number
  url: string | null
  kind: Kind
  rowId: string
  name: string
  slug: string
}

/**
 * Admin-gated query: returns the top N icons by stored byte size, joined
 * with the row metadata (kind / name / slug) so the admin UI can render a
 * thumbnail + edit link.
 */
export const getTopIconsBySize = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      storageId: v.id('_storage'),
      sizeBytes: v.number(),
      url: v.union(v.string(), v.null()),
      kind: v.union(v.literal('tool'), v.literal('model'), v.literal('bundle')),
      rowId: v.string(),
      name: v.string(),
      slug: v.string(),
    }),
  ),
  handler: async (ctx, args): Promise<Row[]> => {
    if (!(await isAdmin(ctx))) return []

    const limit = args.limit ?? 50

    const [tools, models, bundles] = await Promise.all([
      ctx.db.query('tools').collect(),
      ctx.db.query('models').collect(),
      ctx.db.query('bundles').collect(),
    ])

    const toolRows = await Promise.all(
      tools
        .filter((t) => t.iconStorageId)
        .map(async (t): Promise<Row | null> => {
          const storageId = t.iconStorageId!
          const [meta, url] = await Promise.all([
            ctx.db.system.get(storageId),
            ctx.storage.getUrl(storageId),
          ])
          if (!meta) return null
          return {
            storageId,
            sizeBytes: meta.size,
            url,
            kind: 'tool',
            rowId: t._id,
            name: t.name,
            slug: t.slug,
          }
        })
    )

    const modelRows = await Promise.all(
      models
        .filter((m) => m.iconStorageId)
        .map(async (m): Promise<Row | null> => {
          const storageId = m.iconStorageId!
          const [meta, url] = await Promise.all([
            ctx.db.system.get(storageId),
            ctx.storage.getUrl(storageId),
          ])
          if (!meta) return null
          return {
            storageId,
            sizeBytes: meta.size,
            url,
            kind: 'model',
            rowId: m._id,
            name: m.name,
            slug: m.slug,
          }
        })
    )

    const bundleRows = await Promise.all(
      bundles
        .filter((b) => b.iconStorageId)
        .map(async (b): Promise<Row | null> => {
          const storageId = b.iconStorageId!
          const [meta, url] = await Promise.all([
            ctx.db.system.get(storageId),
            ctx.storage.getUrl(storageId),
          ])
          if (!meta) return null
          return {
            storageId,
            sizeBytes: meta.size,
            url,
            kind: 'bundle',
            rowId: b._id,
            name: b.name,
            slug: b.slug,
          }
        })
    )

    const collected = [...toolRows, ...modelRows, ...bundleRows].filter(
      (r): r is Row => r !== null,
    )
    collected.sort((a, b) => b.sizeBytes - a.sizeBytes)
    return collected.slice(0, limit)
  },
})
