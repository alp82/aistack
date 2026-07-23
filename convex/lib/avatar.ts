import type { QueryCtx } from '../_generated/server'
import type { Doc } from '../_generated/dataModel'

/** Resolve the creator's avatar: storage-backed first, Google-pic fallback. */
export async function resolveCreatorAvatarUrl(
  ctx: QueryCtx,
  creator: Doc<'creators'>,
): Promise<string | undefined> {
  if (creator.avatarStorageId) {
    const url = await ctx.storage.getUrl(creator.avatarStorageId)
    if (url) return url
  }
  return creator.avatarUrl
}

/**
 * Resolve a stack's displayed avatar: creator-first, with the stack's own
 * `avatarStorageId` as a transitional fallback until the Phase B migration
 * moves it (dropped in Phase C — see .forge/profile-decoupling/phase-c.patch).
 */
export async function resolveStackAvatarUrl(
  ctx: QueryCtx,
  creator: Doc<'creators'>,
  stack: Doc<'stacks'>,
): Promise<string | undefined> {
  if (creator.avatarStorageId) {
    const url = await ctx.storage.getUrl(creator.avatarStorageId)
    if (url) return url
  }
  if (stack.avatarStorageId) {
    const url = await ctx.storage.getUrl(stack.avatarStorageId)
    if (url) return url
  }
  return creator.avatarUrl
}
