import type { Infer } from 'convex/values'
import { parseRepo } from '../../src/lib/github-repo'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../_generated/server'
import { Resource as ResourceValidator, ResourceInput } from '../schema'
import { generateUniqueShortId } from './ids'

// `src/lib/github-repo.ts` is the single source of truth for the GitHub repo
// parser (it owns the test table). Convex imports plain TS from `src/` the same
// way it imports `slugifyAscii` elsewhere. Re-exported here so existing
// importers of this module (resources.ts, the test, etc.) keep working.
export {
  canonicalizeRepoUrl,
  isGithubRepoUrl,
  normalizeUpstreamPath,
  parseRepo,
  repoNameFromCanonical,
} from '../../src/lib/github-repo'

/**
 * Owner-scoped resource access. Hosted `resources` rows are shared per
 * `(addedBy, stableKey)`; linked rows are shared GLOBALLY per
 * `(upstream.repoUrl, upstream.path)`. `resourceLinks` rows attach a resource
 * to a stack or project owner. Neither owner owns the row - it lives until the
 * last link is removed, at which point it is soft-deleted (`deletedAt`).
 */

export type Resource = Infer<typeof ResourceValidator>
export type ResourceInputItem = Infer<typeof ResourceInput>
type OwnerKind = 'stack'

function castOwnerId(ownerId: string) {
  // ownerId is a v.string() on the link row; narrow it back to the table id
  // it references. Mirrors how userId: v.string() is treated elsewhere.
  return ownerId as Id<'stacks'>
}

/**
 * Derive a GitHub handle (owner org/user) from a repo URL without any network
 * call. Falls back to the trimmed input when the URL is not a recognizable
 * `owner/repo` form (preserving the prior contract). Server-only wrapper over
 * the shared `parseRepo`; used at the linked-row insert.
 */
export function parseGithubHandle(repoUrl: string): string {
  return parseRepo(repoUrl)?.owner ?? repoUrl.trim()
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
    ...(doc.files !== undefined ? { files: doc.files } : {}),
    ...(doc.upstream !== undefined ? { upstream: doc.upstream } : {}),
    ...(doc.pkg !== undefined ? { pkg: doc.pkg } : {}),
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
}

export async function upsertResourcesForOwner(
  ctx: MutationCtx,
  { addedBy, ownerKind, ownerId, items }: UpsertArgs,
): Promise<void> {
  const ownerIdCast = castOwnerId(ownerId)
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
    // A linked row has exactly one of upstream/pkg and no files; a hosted row
    // has files.
    if (item.upstream || item.pkg) {
      if (item.upstream && item.pkg) {
        throw new Error('linked resource cannot have both upstream and pkg')
      }
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
    } else if (item.pkg) {
      // LINKED package (e.g. MCP server): shared GLOBALLY by (registry, id).
      // Hoist to locals so the index closure keeps the narrowed types.
      const { registry, id } = item.pkg
      const existing = await ctx.db
        .query('resources')
        .withIndex('by_pkg', (q) =>
          q.eq('pkg.registry', registry).eq('pkg.id', id),
        )
        .first()

      if (existing) {
        // Shared linked row exists; only resurrect a soft-deleted one.
        resourceId = existing._id
        if (existing.deletedAt !== null) {
          await ctx.db.patch(existing._id, { deletedAt: null })
        }
      } else {
        const shortId = await generateUniqueShortId(ctx, 'resources')
        resourceId = await ctx.db.insert('resources', {
          type: item.type,
          name: item.name,
          description: item.description,
          group: item.group,
          stableKey: item.stableKey,
          storage: 'linked',
          owner: { kind: 'package', registry, id },
          addedBy,
          pkg: item.pkg,
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
          type: item.type,
          name: item.name,
          description: item.description,
          group: item.group,
          files: item.files,
          storage: 'hosted',
          owner: { kind: 'creator', id: addedBy },
          upstream: undefined,
          pkg: undefined,
          deletedAt: null,
        })
      } else {
        const shortId = await generateUniqueShortId(ctx, 'resources')
        resourceId = await ctx.db.insert('resources', {
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

/**
 * Remove a single resource (by stableKey) from one owner, leaving every other
 * link untouched. Soft-deletes the resource only when this was its last link
 * (the orphan invariant enforced by softDeleteIfOrphaned). No-op when the owner
 * has no link to that stableKey.
 */
export async function unlinkResourceFromOwner(
  ctx: MutationCtx,
  ownerKind: OwnerKind,
  ownerId: string,
  stableKey: string,
): Promise<boolean> {
  const ownerIdCast = castOwnerId(ownerId)

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
