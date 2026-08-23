import { internalMutation } from '../_generated/server'

/**
 * Global unsubscribes become per-category preferences (#204, map #198).
 *
 * The old `emailUnsubscribes` table could only say "never mail me again". The
 * spec replaces it with two toggles, the newsletter and important updates, and
 * a row that carries both.
 *
 * Every global unsubscribe copies across with BOTH categories off. That is the
 * only honest reading: the address refused everything we could send, and the
 * newsletter did not exist for them to refuse separately. Turning one back on
 * for them would mail somebody who already said no.
 *
 * An absent row reads as subscribed to both, so addresses that never
 * unsubscribed need no row and get none.
 *
 * IDEMPOTENT. An address that already has a preferences row is left alone,
 * because that row is newer than this table and may hold a resubscribe.
 *
 * DEPLOY ORDER. Run this BEFORE dropping `emailUnsubscribes` from the schema:
 * a column already dropped cannot be migrated from. Run with
 * `scripts/convex-prod.sh run migrations/20260823_email_preferences:run`.
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const old = await ctx.db.query('emailUnsubscribes').collect()
    const now = Date.now()

    let migrated = 0
    let alreadyHadPreferences = 0
    for (const row of old) {
      const email = row.email.trim().toLowerCase()
      if (!email) continue
      const existing = await ctx.db
        .query('emailPreferences')
        .withIndex('by_email', (q) => q.eq('email', email))
        .first()
      if (existing) {
        alreadyHadPreferences++
        continue
      }
      await ctx.db.insert('emailPreferences', {
        email,
        newsletter: false,
        importantUpdates: false,
        updatedAt: now,
      })
      migrated++
    }
    return { scanned: old.length, migrated, alreadyHadPreferences }
  },
})
