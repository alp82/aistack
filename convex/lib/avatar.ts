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
