import { internalMutation } from '../_generated/server'
import { v } from 'convex/values'

/**
 * One-shot migration that retires project-scoped resources. It drains every
 * project-owned `resourceLinks` row (soft-deleting any resource left without
 * links), clears the defunct `resources.scope` field, unsets the
 * `projects.source` / `projects.cloneCount` fields, and renames any
 * stableKey that starts with 'hooks:project:' to 'hooks:local:'.
 *
 * THREE-PHASE DEPLOY SEQUENCE — do not skip steps:
 *
 * Deploy A — push a schema identical to the old one EXCEPT:
 *   - resources.scope becomes v.optional(...) (was required)
 *   - this migration file is included
 *   Everything else stays wide (ownerKind still includes 'project',
 *   projects still has source/cloneCount as optional).
 *   Then run:  npx convex run migrations/20260612_retire_project_resources:run
 *
 *   WARNING: Running this migration while resources.scope is still REQUIRED
 *   (i.e. before Deploy A) will fail Convex schema validation the moment any
 *   scoped row is patched — patch({ scope: undefined }) is rejected on a
 *   required field.
 *
 * Deploy B — push the fully narrowed schema: scope removed from resources,
 *   ownerKind narrowed to literal 'stack', projects loses source/cloneCount.
 *
 * Idempotent: a second run finds nothing to change and returns zeros.
 */

type LegacyShape = {
  scope?: string
  source?: string
  cloneCount?: number
}

export const run = internalMutation({
  args: {},
  returns: v.object({
    projectLinksDeleted: v.number(),
    resourcesSoftDeleted: v.number(),
    scopeCleared: v.number(),
    projectsPatched: v.number(),
    hookKeysRenamed: v.number(),
  }),
  handler: async (ctx) => {
    let projectLinksDeleted = 0
    let resourcesSoftDeleted = 0
    let scopeCleared = 0
    let projectsPatched = 0
    let hookKeysRenamed = 0

    // 'project' is no longer expressible in the narrowed ownerKind type, but
    // the by_owner index still serves the legacy value at runtime.
    const links = await ctx.db
      .query('resourceLinks')
      .withIndex('by_owner', (q) => q.eq('ownerKind', 'project' as never))
      .collect()
    for (const link of links) {
      const resourceId = link.resourceId
      await ctx.db.delete(link._id)
      projectLinksDeleted++

      const remaining = await ctx.db
        .query('resourceLinks')
        .withIndex('by_resourceId', (q) => q.eq('resourceId', resourceId))
        .collect()
      if (remaining.length === 0) {
        const resource = await ctx.db.get(resourceId)
        if (resource && resource.deletedAt === null) {
          await ctx.db.patch(resourceId, { deletedAt: Date.now() })
          resourcesSoftDeleted++
        }
      }
    }

    const resources = await ctx.db.query('resources').collect()
    for (const resource of resources) {
      if ((resource as unknown as LegacyShape).scope === undefined) continue
      await ctx.db.patch(resource._id, { scope: undefined } as never)
      scopeCleared++
    }

    const projects = await ctx.db.query('projects').collect()
    for (const project of projects) {
      const legacy = project as unknown as LegacyShape
      if (legacy.source === undefined && legacy.cloneCount === undefined) continue
      await ctx.db.patch(
        project._id,
        { source: undefined, cloneCount: undefined } as never,
      )
      projectsPatched++
    }

    // Pass 4: rename stableKey 'hooks:project:*' -> 'hooks:local:*'.
    // The CLI renamed hooks:project:${event} to hooks:local:${event}; server
    // dedup is by (addedBy, stableKey), so old-keyed rows would accumulate
    // duplicates on the next collect run. Idempotent: second run finds none.
    const PREFIX = 'hooks:project:'
    for (const resource of resources) {
      const key = (resource as unknown as { stableKey: string }).stableKey
      if (!key.startsWith(PREFIX)) continue
      const newKey = 'hooks:local:' + key.slice(PREFIX.length)
      await ctx.db.patch(resource._id, { stableKey: newKey } as never)
      hookKeysRenamed++
    }

    return {
      projectLinksDeleted,
      resourcesSoftDeleted,
      scopeCleared,
      projectsPatched,
      hookKeysRenamed,
    }
  },
})
