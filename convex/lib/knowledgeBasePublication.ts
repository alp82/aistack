import type { Doc } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'

const FULL_ENTRY_LENGTH = 120

type PublicationRecord = {
  publishedAt: number
  attribution?: string
}

/** A release with no reusable reading material belongs in the topic strip. */
export function isThinRelease(item: Doc<'newsItems'>): boolean {
  if (
    item.licenseClass !== 'permissive-release-notes' &&
    item.licenseClass !== 'unlicensed-release-notes'
  ) {
    return false
  }
  const body = item.sourceText?.trim() ?? ''
  let compareOnly = /^full changelog\b/i.test(body)
  try {
    compareOnly =
      compareOnly || new URL(body).pathname.toLowerCase().includes('/compare/')
  } catch {
    // A sentence that mentions a comparison still carries content to read.
  }
  return body.length < FULL_ENTRY_LENGTH || compareOnly
}

/** Build the durable publication record, or hold an incomplete item back. */
export async function publicationRecord(
  ctx: Pick<MutationCtx, 'db'>,
  item: Doc<'newsItems'>,
  publishedAt: number,
): Promise<PublicationRecord | null> {
  if (!item.summary?.trim() || !item.topicId) return null
  if (item.licenseClass === 'x' && !item.xEmbed?.html.trim()) return null

  const needsAttribution =
    item.licenseClass === 'cc-by' ||
    (item.licenseClass === 'permissive-release-notes' && !isThinRelease(item))
  if (!needsAttribution) return { publishedAt }

  const source = item.sourceId ? await ctx.db.get(item.sourceId) : null
  const attribution = source?.attribution?.trim()
  if (!item.sourceText?.trim() || !attribution) return null
  return { publishedAt, attribution }
}
