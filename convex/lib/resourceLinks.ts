import type { Infer } from 'convex/values'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { Resource as ResourceValidator } from '../schema'
import { generateUniqueShortId } from './ids'

/**
 * Owner-scoped resource access. `resources` rows are shared (one row per
 * `(creatorId, stableKey)`); `resourceLinks` rows attach a resource to a
 * stack or project owner. Neither owner owns the row — it lives until the
 * last link is removed, at which point it is soft-deleted (`deletedAt`).
 */

export type Resource = Infer<typeof ResourceValidator>
type OwnerKind = 'stack' | 'project'

function castOwnerId(ownerKind: OwnerKind, ownerId: string) {
  // ownerId is a v.string() on the link row; narrow it back to the table id
  // it references. Mirrors how userId: v.string() is treated elsewhere.
  return ownerKind === 'stack'
    ? (ownerId as Id<'stacks'>)
    : (ownerId as Id<'projects'>)
}

function toResource(doc: {
  type: string
  name: string
  description?: string
  group: string
  stableKey: string
  files: Resource['files']
  source?: Resource['source']
  scope: Doc<'resources'>['scope']
  upstream?: Resource['upstream']
}): Resource {
  return {
    type: doc.type,
    name: doc.name,
    description: doc.description,
    group: doc.group,
    stableKey: doc.stableKey,
    files: doc.files,
    source: doc.source,
    scope: doc.scope,
    upstream: doc.upstream,
  }
}

export async function resolveLinkedResources(
  ctx: QueryCtx,
  ownerKind: OwnerKind,
  ownerId: string,
): Promise<Resource[]> {
  const links = await ctx.db
    .query('resourceLinks')
    .withIndex('by_owner', (q) =>
      q.eq('ownerKind', ownerKind).eq('ownerId', ownerId),
    )
    .collect()

  links.sort((a, b) => a.order - b.order)

  const resources: Resource[] = []
  for (const link of links) {
    const doc = await ctx.db.get(link.resourceId)
    if (!doc) continue
    if (doc.deletedAt !== null) continue
    resources.push(toResource(doc))
  }
  return resources
}

type UpsertArgs = {
  creatorId: Id<'creators'>
  ownerKind: OwnerKind
  ownerId: string
  items: Resource[]
  source: NonNullable<Resource['source']>
  defaultScope: NonNullable<Resource['scope']>
}

export async function upsertResourcesForOwner(
  ctx: MutationCtx,
  { creatorId, ownerKind, ownerId, items, source, defaultScope }: UpsertArgs,
): Promise<void> {
  const ownerIdCast = castOwnerId(ownerKind, ownerId)
  const now = Date.now()

  // Determine the next link order from the owner's existing links so omitted
  // items keep their links and new links append in a stable position.
  const existingLinks = await ctx.db
    .query('resourceLinks')
    .withIndex('by_owner', (q) =>
      q.eq('ownerKind', ownerKind).eq('ownerId', ownerIdCast),
    )
    .collect()
  let nextOrder =
    existingLinks.reduce((max, link) => Math.max(max, link.order), -1) + 1

  for (const item of items) {
    const scope = item.scope ?? defaultScope
    const resolvedSource = source

    const existing = await ctx.db
      .query('resources')
      .withIndex('by_creator_stableKey', (q) =>
        q.eq('creatorId', creatorId).eq('stableKey', item.stableKey),
      )
      .first()

    let resourceId: Id<'resources'>
    if (existing) {
      // Found (live or soft-deleted): overwrite all fields, reuse _id, and
      // resurrect by clearing deletedAt when it was soft-deleted.
      resourceId = existing._id
      await ctx.db.patch(existing._id, {
        scope,
        type: item.type,
        name: item.name,
        description: item.description,
        group: item.group,
        files: item.files,
        source: resolvedSource,
        upstream: item.upstream,
        deletedAt: null,
      })
    } else {
      const shortId = await generateUniqueShortId(ctx, 'resources')
      resourceId = await ctx.db.insert('resources', {
        creatorId,
        scope,
        type: item.type,
        name: item.name,
        description: item.description,
        group: item.group,
        stableKey: item.stableKey,
        files: item.files,
        source: resolvedSource,
        upstream: item.upstream,
        deletedAt: null,
        shortId,
      })
    }

    // Ensure a link exists for this owner; create with next order if missing.
    // Convex Ids are strings, so === is correct for equality checks.
    const link = existingLinks.find((l) => l.resourceId === resourceId)
    if (!link) {
      const inserted = await ctx.db.insert('resourceLinks', {
        resourceId,
        ownerKind,
        ownerId: ownerIdCast,
        order: nextOrder,
        addedAt: now,
      })
      existingLinks.push({
        _id: inserted,
        _creationTime: now,
        resourceId,
        ownerKind,
        ownerId: ownerIdCast,
        order: nextOrder,
        addedAt: now,
      })
      nextOrder++
    }
  }
}

/** Soft-delete a resource once it has no remaining links (orphan invariant). */
async function softDeleteIfOrphaned(
  ctx: MutationCtx,
  resourceId: Id<'resources'>,
): Promise<void> {
  const remaining = await ctx.db
    .query('resourceLinks')
    .withIndex('by_resourceId', (q) => q.eq('resourceId', resourceId))
    .collect()
  if (remaining.length === 0) {
    await ctx.db.patch(resourceId, { deletedAt: Date.now() })
  }
}

export async function cascadeUnlinkOwner(
  ctx: MutationCtx,
  ownerKind: OwnerKind,
  ownerId: string,
): Promise<void> {
  const ownerIdCast = castOwnerId(ownerKind, ownerId)

  const links = await ctx.db
    .query('resourceLinks')
    .withIndex('by_owner', (q) =>
      q.eq('ownerKind', ownerKind).eq('ownerId', ownerIdCast),
    )
    .collect()

  for (const link of links) {
    await ctx.db.delete(link._id)
    await softDeleteIfOrphaned(ctx, link.resourceId)
  }
}

/**
 * Remove a single resource (by stableKey) from one owner, leaving every other
 * link untouched. Soft-deletes the resource only when this was its last link
 * (same orphan invariant as cascadeUnlinkOwner). No-op when the owner has no
 * link to that stableKey.
 */
export async function unlinkResourceFromOwner(
  ctx: MutationCtx,
  ownerKind: OwnerKind,
  ownerId: string,
  stableKey: string,
): Promise<boolean> {
  const ownerIdCast = castOwnerId(ownerKind, ownerId)

  const links = await ctx.db
    .query('resourceLinks')
    .withIndex('by_owner', (q) =>
      q.eq('ownerKind', ownerKind).eq('ownerId', ownerIdCast),
    )
    .collect()

  for (const link of links) {
    const resource = await ctx.db.get(link.resourceId)
    if (!resource || resource.stableKey !== stableKey) continue

    await ctx.db.delete(link._id)
    await softDeleteIfOrphaned(ctx, link.resourceId)
    return true
  }
  return false
}
