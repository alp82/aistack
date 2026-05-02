import type { QueryCtx } from '../_generated/server'

const SHORT_ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'
const SHORT_ID_LENGTH = 6

export async function generateUniqueShortId(
  ctx: QueryCtx,
  table: 'stacks' | 'projects' | 'tools' | 'bundles' | 'models',
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    let shortId = ''
    for (let i = 0; i < SHORT_ID_LENGTH; i++) {
      shortId += SHORT_ID_CHARS[Math.floor(Math.random() * SHORT_ID_CHARS.length)]
    }
    const existing = await ctx.db
      .query(table)
      .withIndex('by_shortId', (q) => q.eq('shortId', shortId))
      .first()
    if (!existing) return shortId
  }
  throw new Error('Failed to generate unique shortId after 10 attempts')
}

export function extractShortId(compositeSlug: string): string {
  const lastHyphen = compositeSlug.lastIndexOf('-')
  if (lastHyphen === -1) return compositeSlug
  return compositeSlug.slice(lastHyphen + 1)
}
