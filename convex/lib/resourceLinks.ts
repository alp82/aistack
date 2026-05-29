import type { Infer } from 'convex/values'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { Resource as ResourceValidator, ResourceInput } from '../schema'
import { generateUniqueShortId } from './ids'

/**
 * Owner-scoped resource access. Hosted `resources` rows are shared per
 * `(addedBy, stableKey)`; linked rows are shared GLOBALLY per
 * `(upstream.repoUrl, upstream.path)`. `resourceLinks` rows attach a resource
 * to a stack or project owner. Neither owner owns the row — it lives until the
 * last link is removed, at which point it is soft-deleted (`deletedAt`).
 */

export type Resource = Infer<typeof ResourceValidator>
export type ResourceInputItem = Infer<typeof ResourceInput>
type OwnerKind = 'stack' | 'project'

function castOwnerId(ownerKind: OwnerKind, ownerId: string) {
  // ownerId is a v.string() on the link row; narrow it back to the table id
  // it references. Mirrors how userId: v.string() is treated elsewhere.
  return ownerKind === 'stack'
    ? (ownerId as Id<'stacks'>)
    : (ownerId as Id<'projects'>)
}

/**
 * Derive a GitHub handle (owner org/user) from a repo URL without any network
 * call. Handles `https://github.com/owner/repo(.git)` and
 * `git@github.com:owner/repo(.git)` forms; falls back to the trimmed input.
 */
export function parseGithubHandle(repoUrl: string): string {
  const trimmed = repoUrl.trim()
  const scpMatch = trimmed.match(/^[^@]+@[^:]+:(.+)$/)
  const pathPart = scpMatch
    ? scpMatch[1]
    : trimmed.replace(/^[a-z]+:\/\//i, '').replace(/^[^/]+\//, '')
  const segments = pathPart.replace(/\.git$/, '').split('/').filter(Boolean)
  return segments[0] ?? trimmed
}

function toResource(doc: Doc<'resources'>): Resource {
  return {
    type: doc.type,
    name: doc.name,
    description: doc.description,
    group: doc.group,
    stableKey: doc.stableKey,
    storage: doc.storage,
    owner: doc.owner,
    addedBy: doc.addedBy,
    scope: doc.scope,
    ...(doc.files !== undefined ? { files: doc.files } : {}),
    ...(doc.upstream !== undefined ? { upstream: doc.upstream } : {}),
  }
}

export async function resolveLinkedResourceDocs(
  ctx: QueryCtx,
  ownerKind: OwnerKind,
  ownerId: string,
): Promise<Doc<'resources'>[]> {
  const links = await ctx.db
    .query('resourceLinks')
    .withIndex('by_owner', (q) =>
      q.eq('ownerKind', ownerKind).eq('ownerId', ownerId),
    )
    .collect()

  links.sort((a, b) => a.order - b.order)

  const docs: Doc<'resources'>[] = []
  for (const link of links) {
    const doc = await ctx.db.get(link.resourceId)
    if (!doc) continue
    if (doc.deletedAt !== null) continue
    docs.push(doc)
  }
  return docs
}

export async function resolveLinkedResources(
  ctx: QueryCtx,
  ownerKind: OwnerKind,
  ownerId: string,
): Promise<Resource[]> {
  const docs = await resolveLinkedResourceDocs(ctx, ownerKind, ownerId)
  return docs.map(toResource)
}

type UpsertArgs = {
  addedBy: Id<'creators'>
  ownerKind: OwnerKind
  ownerId: string
  items: ResourceInputItem[]
  defaultScope: NonNullable<Resource['scope']>
}

export async function upsertResourcesForOwner(
  ctx: MutationCtx,
  { addedBy, ownerKind, ownerId, items, defaultScope }: UpsertArgs,
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

    // upstream presence is the SOLE storage discriminator: present => linked
    // reference (no files), absent => hosted (files, per-creator).
    if (item.upstream) {
      if (item.files?.length) {
        throw new Error('linked resource must not carry files')
      }
    } else if (!item.files?.length) {
      throw new Error('hosted resource must carry files')
    }

    let resourceId: Id<'resources'>
    if (item.upstream) {
      // LINKED: shared GLOBALLY by (repoUrl, path). Normalize path to '' so
      // the by_upstream index matches at both write and query.
      const path = item.upstream.path ?? ''
      const repoUrl = item.upstream.repoUrl
      const existing = await ctx.db
        .query('resources')
        .withIndex('by_upstream', (q) =>
          q.eq('upstream.repoUrl', repoUrl).eq('upstream.path', path),
        )
        .first()

      if (existing) {
        // A shared linked row already exists. Carry no content; only resurrect
        // a soft-deleted row. Field overwrite is intentionally skipped.
        resourceId = existing._id
        if (existing.deletedAt !== null) {
          await ctx.db.patch(existing._id, { deletedAt: null })
        }
      } else {
        const shortId = await generateUniqueShortId(ctx, 'resources')
        resourceId = await ctx.db.insert('resources', {
          scope,
          type: item.type,
          name: item.name,
          description: item.description,
          group: item.group,
          stableKey: item.stableKey,
          storage: 'linked',
          owner: { kind: 'github', handle: parseGithubHandle(repoUrl) },
          addedBy,
          upstream: { ...item.upstream, path },
          deletedAt: null,
          shortId,
        })
      }
    } else {
      // HOSTED: shared per (addedBy, stableKey), files carried on the row.
      const existing = await ctx.db
        .query('resources')
        .withIndex('by_addedBy_stableKey', (q) =>
          q.eq('addedBy', addedBy).eq('stableKey', item.stableKey),
        )
        .first()

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
          storage: 'hosted',
          owner: { kind: 'creator', id: addedBy },
          upstream: undefined,
          deletedAt: null,
        })
      } else {
        const shortId = await generateUniqueShortId(ctx, 'resources')
        resourceId = await ctx.db.insert('resources', {
          scope,
          type: item.type,
          name: item.name,
          description: item.description,
          group: item.group,
          stableKey: item.stableKey,
          files: item.files,
          storage: 'hosted',
          owner: { kind: 'creator', id: addedBy },
          addedBy,
          deletedAt: null,
          shortId,
        })
      }
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
export async function softDeleteIfOrphaned(
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
