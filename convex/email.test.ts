/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { beforeEach, describe, expect, test } from 'vitest'
import { render } from '@react-email/render'
import schema from './schema'
import { api, internal } from './_generated/api'
import type { MutationCtx } from './_generated/server'
import { mergeAudience, subtractSuppressed } from './email'
import { FeatureUpdateEmail } from '../src/emails/FeatureUpdateEmail'
import { WaitlistLaunchEmail } from '../src/emails/WaitlistLaunchEmail'
import { UNSUBSCRIBE_PLACEHOLDER } from '../src/emails/styles'
import { ADMIN_EMAILS } from './lib/admin'

const modules = import.meta.glob('./**/*.{js,ts}')

// Ensure RESEND_API_KEY is absent for every test — convexTest runs in the
// same process as the test runner, so process.env mutations are visible.
beforeEach(() => {
  delete process.env.RESEND_API_KEY
})

// ---------------------------------------------------------------------------
// GROUP Q — sendBroadcast
// ---------------------------------------------------------------------------

describe('GROUP Q — sendBroadcast', () => {
  // TC-Q-01: alreadySent guard fires for "waitlist-launch" without any
  // waitlist rows and without an API key — never reaches env/DB checks.
  test('TC-Q-01: sendBroadcast("waitlist-launch") returns alreadySent:true, success:false; does not throw', async () => {
    const t = convexTest(schema, modules)
    const asAdmin = t.withIdentity({ tokenIdentifier: 'convex|admin', email: ADMIN_EMAILS[0] })

    const result = await asAdmin.action(api.email.sendBroadcast, { broadcastId: 'waitlist-launch' })

    expect(result.success).toBe(false)
    expect(result.alreadySent).toBe(true)
  })

  // TC-Q-02: unknown broadcast ID returns a descriptive error, not alreadySent.
  test('TC-Q-02: sendBroadcast("does-not-exist") returns success:false and message "Unknown broadcast ID"', async () => {
    const t = convexTest(schema, modules)
    const asAdmin = t.withIdentity({ tokenIdentifier: 'convex|admin', email: ADMIN_EMAILS[0] })

    const result = await asAdmin.action(api.email.sendBroadcast, { broadcastId: 'does-not-exist' })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Unknown broadcast ID')
    expect(result.alreadySent).not.toBe(true)
  })

  // TC-Q-03: "feature-update" with no API key hits the env guard.
  test('TC-Q-03: sendBroadcast("feature-update") with no RESEND_API_KEY returns env-guard failure', async () => {
    const t = convexTest(schema, modules)
    const asAdmin = t.withIdentity({ tokenIdentifier: 'convex|admin', email: ADMIN_EMAILS[0] })

    const result = await asAdmin.action(api.email.sendBroadcast, { broadcastId: 'feature-update' })

    expect(result.success).toBe(false)
    expect(result.message).toContain('Email service not configured')
  })

  // TC-Q-04: the "feature-update" refusal is an env-guard refusal, NOT alreadySent.
  test('TC-Q-04: sendBroadcast("feature-update") refusal does NOT carry alreadySent:true', async () => {
    const t = convexTest(schema, modules)
    const asAdmin = t.withIdentity({ tokenIdentifier: 'convex|admin', email: ADMIN_EMAILS[0] })

    const result = await asAdmin.action(api.email.sendBroadcast, { broadcastId: 'feature-update' })

    expect(result.alreadySent).not.toBe(true)
  })

  // TC-Q-NEW: sendBroadcast("feature-update") with a fake RESEND_API_KEY but no
  // BETTER_AUTH_SECRET hits the secret guard and returns the configured fail-closed shape.
  test('TC-Q-NEW: sendBroadcast("feature-update") with RESEND key but no BETTER_AUTH_SECRET returns secret-guard failure', async () => {
    const t = convexTest(schema, modules)
    const asAdmin = t.withIdentity({ tokenIdentifier: 'convex|admin', email: ADMIN_EMAILS[0] })
    const savedSecret = process.env.BETTER_AUTH_SECRET
    process.env.RESEND_API_KEY = 'fake-key-for-test'
    delete process.env.BETTER_AUTH_SECRET
    try {
      const result = await asAdmin.action(api.email.sendBroadcast, { broadcastId: 'feature-update' })
      expect(result.success).toBe(false)
      expect(result.message).toContain('Email service not configured')
    } finally {
      delete process.env.RESEND_API_KEY
      if (savedSecret !== undefined) process.env.BETTER_AUTH_SECRET = savedSecret
    }
  })

  // TC-Q-05: seeding waitlist rows does not change the "waitlist-launch" outcome —
  // the alreadySent guard fires before any DB enumeration.
  test('TC-Q-05: sendBroadcast("waitlist-launch") with seeded waitlist rows still returns alreadySent:true', async () => {
    const t = convexTest(schema, modules)
    const asAdmin = t.withIdentity({ tokenIdentifier: 'convex|admin', email: ADMIN_EMAILS[0] })

    // Seed 3 waitlist rows
    await t.run(async (ctx: MutationCtx) => {
      for (const email of ['a@example.com', 'b@example.com', 'c@example.com']) {
        await ctx.db.insert('waitlist', {
          email,
          provider: 'email',
          status: 'pending',
          joinedAt: Date.now(),
          lookupId: `lookup-${email}`,
        })
      }
    })

    const result = await asAdmin.action(api.email.sendBroadcast, { broadcastId: 'waitlist-launch' })

    expect(result.success).toBe(false)
    expect(result.alreadySent).toBe(true)
  })

  // TC-Q-AUTH: authenticated non-admin user is rejected with Unauthorized.
  // RED: before the gate lands, sendBroadcast returns "Email service not configured"
  // instead of "Unauthorized", so this assertion fails.
  test('TC-Q-AUTH: sendBroadcast with non-admin identity returns {success:false, message:/unauthorized/i}', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity({ tokenIdentifier: 'convex|intruder', email: 'intruder@example.com' })

    const result = await asUser.action(api.email.sendBroadcast, { broadcastId: 'feature-update' })

    expect(result.success).toBe(false)
    expect(result.message).toMatch(/unauthorized/i)
  })

  // TC-Q-AUTH-ANON: anonymous caller (no identity) is rejected with Unauthorized.
  // RED: before the gate lands, sendBroadcast returns "Email service not configured"
  // instead of "Unauthorized", so this assertion fails.
  test('TC-Q-AUTH-ANON: sendBroadcast with no identity returns {success:false, message:/unauthorized/i}', async () => {
    const t = convexTest(schema, modules)

    const result = await t.action(api.email.sendBroadcast, { broadcastId: 'feature-update' })

    expect(result.success).toBe(false)
    expect(result.message).toMatch(/unauthorized/i)
  })
})

// ---------------------------------------------------------------------------
// GROUP R — sendTestEmail
// ---------------------------------------------------------------------------

describe('GROUP R — sendTestEmail', () => {
  // TC-R-01: no identity → auth guard fires first.
  test('TC-R-01: sendTestEmail("waitlist-launch") with no identity returns "Not authenticated" failure', async () => {
    const t = convexTest(schema, modules)

    // Call without withIdentity — unauthenticated
    const result = await t.action(api.email.sendTestEmail, { broadcastId: 'waitlist-launch' })

    expect(result.success).toBe(false)
    expect(result.message).toMatch(/not authenticated|no email/i)
  })

  // TC-R-AUTH: authenticated non-admin user is rejected with Unauthorized.
  // RED: before the gate lands, sendTestEmail returns "Email service not configured"
  // instead of "Unauthorized", so this assertion fails.
  test('TC-R-AUTH: sendTestEmail with non-admin identity returns {success:false, message:/unauthorized/i}', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity({ tokenIdentifier: 'convex|intruder', email: 'intruder@example.com' })

    const result = await asUser.action(api.email.sendTestEmail, { broadcastId: 'feature-update' })

    expect(result.success).toBe(false)
    expect(result.message).toMatch(/unauthorized/i)
  })

  // TC-R-02: authenticated but unknown broadcast ID returns "Unknown broadcast ID".
  test('TC-R-02: sendTestEmail("ghost-broadcast") with identity returns "Unknown broadcast ID"', async () => {
    const t = convexTest(schema, modules)
    const asAdmin = t.withIdentity({ tokenIdentifier: 'convex|admin', email: ADMIN_EMAILS[0] })

    const result = await asAdmin.action(api.email.sendTestEmail, { broadcastId: 'ghost-broadcast' })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Unknown broadcast ID')
  })

  // TC-R-03: "waitlist-launch" IS valid for test sends (alreadySent does NOT block sendTestEmail);
  // with no API key the env guard is what fires.
  test('TC-R-03: sendTestEmail("waitlist-launch") with identity and no API key hits env guard, not unknown-id guard', async () => {
    const t = convexTest(schema, modules)
    const asAdmin = t.withIdentity({ tokenIdentifier: 'convex|admin', email: ADMIN_EMAILS[0] })

    const result = await asAdmin.action(api.email.sendTestEmail, { broadcastId: 'waitlist-launch' })

    expect(result.success).toBe(false)
    expect(result.message).not.toBe('Unknown broadcast ID')
    expect(result.message).toContain('Email service not configured')
  })

  // TC-R-04: "feature-update" with identity and no API key also hits env guard.
  test('TC-R-04: sendTestEmail("feature-update") with identity and no API key returns env-guard failure', async () => {
    const t = convexTest(schema, modules)
    const asAdmin = t.withIdentity({ tokenIdentifier: 'convex|admin', email: ADMIN_EMAILS[0] })

    const result = await asAdmin.action(api.email.sendTestEmail, { broadcastId: 'feature-update' })

    expect(result.success).toBe(false)
    expect(result.message).not.toBe('Unknown broadcast ID')
  })

  // TC-R-05: BETTER_AUTH_SECRET guard fires when secret is missing (API key present).
  test('TC-R-05: sendTestEmail("feature-update") with RESEND key but no BETTER_AUTH_SECRET returns secret-guard failure', async () => {
    const t = convexTest(schema, modules)
    const asAdmin = t.withIdentity({ tokenIdentifier: 'convex|admin', email: ADMIN_EMAILS[0] })
    // beforeEach already deleted RESEND_API_KEY; set it now so the env guard passes
    process.env.RESEND_API_KEY = 'fake-key-for-test'
    const savedSecret = process.env.BETTER_AUTH_SECRET
    delete process.env.BETTER_AUTH_SECRET
    try {
      const result = await asAdmin.action(api.email.sendTestEmail, { broadcastId: 'feature-update' })
      expect(result.success).toBe(false)
      expect(result.message).toContain('Email service not configured')
    } finally {
      delete process.env.RESEND_API_KEY
      if (savedSecret !== undefined) process.env.BETTER_AUTH_SECRET = savedSecret
      else delete process.env.BETTER_AUTH_SECRET
    }
  })

  // TC-R-06: Non-https appUrl guard fires when APP_URL is http (secret + key present).
  test('TC-R-06: sendTestEmail("feature-update") with http appUrl returns appUrl-guard failure', async () => {
    const t = convexTest(schema, modules)
    const asAdmin = t.withIdentity({ tokenIdentifier: 'convex|admin', email: ADMIN_EMAILS[0] })
    // beforeEach already deleted RESEND_API_KEY; set it so env guard passes
    process.env.RESEND_API_KEY = 'fake-key-for-test'
    // BETTER_AUTH_SECRET must be present so the secret guard passes
    const savedSecret = process.env.BETTER_AUTH_SECRET
    process.env.BETTER_AUTH_SECRET = 'test-secret-value'
    // Force a deterministic non-https appUrl:
    //   getAppUrl() = process.env.APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3019'
    const savedAppUrl = process.env.APP_URL
    const savedBetterAuthUrl = process.env.BETTER_AUTH_URL
    process.env.APP_URL = 'http://localhost:3019'
    delete process.env.BETTER_AUTH_URL
    try {
      const result = await asAdmin.action(api.email.sendTestEmail, { broadcastId: 'feature-update' })
      expect(result.success).toBe(false)
      expect(result.message).toContain('Email service not configured')
    } finally {
      delete process.env.RESEND_API_KEY
      if (savedAppUrl !== undefined) process.env.APP_URL = savedAppUrl
      else delete process.env.APP_URL
      if (savedBetterAuthUrl !== undefined) process.env.BETTER_AUTH_URL = savedBetterAuthUrl
      else delete process.env.BETTER_AUTH_URL
      if (savedSecret !== undefined) process.env.BETTER_AUTH_SECRET = savedSecret
      else delete process.env.BETTER_AUTH_SECRET
    }
  })
})

// ---------------------------------------------------------------------------
// GROUP S — mergeAudience
// ---------------------------------------------------------------------------

describe('GROUP S — mergeAudience', () => {
  // TC-S-01: disjoint lists — waitlist-first order preserved.
  test('TC-S-01: mergeAudience(["a@x.com"], ["b@x.com"]) → ["a@x.com","b@x.com"]', () => {
    const result = mergeAudience(['a@x.com'], ['b@x.com'])

    expect(result).toEqual(['a@x.com', 'b@x.com'])
  })

  // TC-S-02: intra-list dedupe — duplicate within a single list collapses.
  test('TC-S-02: mergeAudience(["a@x.com","a@x.com"]) → ["a@x.com"]', () => {
    const result = mergeAudience(['a@x.com', 'a@x.com'])

    expect(result).toEqual(['a@x.com'])
  })

  // TC-S-03: inter-list overlap — b appears in both lists; first occurrence wins, order stable.
  test('TC-S-03: mergeAudience(["a@x.com","b@x.com"], ["b@x.com","c@x.com"]) → ["a@x.com","b@x.com","c@x.com"]', () => {
    const result = mergeAudience(['a@x.com', 'b@x.com'], ['b@x.com', 'c@x.com'])

    expect(result).toEqual(['a@x.com', 'b@x.com', 'c@x.com'])
  })

  // TC-S-04: case-insensitive dedupe — ADA@x.com and ada@x.com are the same address; output lowercased.
  test('TC-S-04: mergeAudience(["ADA@x.com"], ["ada@x.com"]) → ["ada@x.com"]', () => {
    const result = mergeAudience(['ADA@x.com'], ['ada@x.com'])

    expect(result).toEqual(['ada@x.com'])
  })

  // TC-S-05: inverted-order case dedupe — lowercase list first, uppercase second.
  test('TC-S-05: mergeAudience(["ada@x.com"], ["ADA@X.COM"]) → ["ada@x.com"]', () => {
    const result = mergeAudience(['ada@x.com'], ['ADA@X.COM'])

    expect(result).toEqual(['ada@x.com'])
  })

  // TC-S-06: trim before dedupe — leading/trailing whitespace stripped before comparison and output.
  test('TC-S-06: mergeAudience(["  a@x.com  "], ["a@x.com"]) → ["a@x.com"]', () => {
    const result = mergeAudience(['  a@x.com  '], ['a@x.com'])

    expect(result).toEqual(['a@x.com'])
  })

  // TC-S-07: empty and blank-only entries dropped from a single list.
  test('TC-S-07: mergeAudience(["", "   ", "valid@x.com"]) → ["valid@x.com"]', () => {
    const result = mergeAudience(['', '   ', 'valid@x.com'])

    expect(result).toEqual(['valid@x.com'])
  })

  // TC-S-08: blank suppression across multiple lists.
  test('TC-S-08: mergeAudience(["", "a@x.com"], ["", "b@x.com", "  "]) → ["a@x.com","b@x.com"]', () => {
    const result = mergeAudience(['', 'a@x.com'], ['', 'b@x.com', '  '])

    expect(result).toEqual(['a@x.com', 'b@x.com'])
  })

  // TC-S-09: no arguments → empty array.
  test('TC-S-09: mergeAudience() → []', () => {
    const result = mergeAudience()

    expect(result).toEqual([])
  })

  // TC-S-10: empty lists → empty array.
  test('TC-S-10: mergeAudience([], []) → []', () => {
    const result = mergeAudience([], [])

    expect(result).toEqual([])
  })

  // TC-S-11: single list — entries lowercased and order kept.
  test('TC-S-11: mergeAudience(["A@X.COM","B@X.COM"]) → ["a@x.com","b@x.com"]', () => {
    const result = mergeAudience(['A@X.COM', 'B@X.COM'])

    expect(result).toEqual(['a@x.com', 'b@x.com'])
  })

  // TC-S-12: all members list entries are dupes of the waitlist — result is only the first (waitlist) set.
  test('TC-S-12: mergeAudience(["x@a.com","y@a.com"], ["X@A.COM","Y@A.COM","x@a.com"]) → ["x@a.com","y@a.com"]', () => {
    const result = mergeAudience(['x@a.com', 'y@a.com'], ['X@A.COM', 'Y@A.COM', 'x@a.com'])

    expect(result).toEqual(['x@a.com', 'y@a.com'])
  })

  // TC-S-13: input arrays are not mutated.
  test('TC-S-13: mergeAudience does not mutate the input array', () => {
    const original = ['A@X.COM']

    mergeAudience(original)

    expect(original).toEqual(['A@X.COM'])
  })
})

// ---------------------------------------------------------------------------
// GROUP T — subtractSuppressed (sync, pure)
// ---------------------------------------------------------------------------

describe('GROUP T — subtractSuppressed', () => {
  // TC-T-01: disjoint suppressed set — all emails pass through unchanged.
  test('TC-T-01: disjoint suppressed set → identity (all emails returned)', () => {
    const result = subtractSuppressed(['a@x.com', 'b@x.com'], new Set(['c@x.com']))

    expect(result).toEqual(['a@x.com', 'b@x.com'])
  })

  // TC-T-02: one matching address removed.
  test('TC-T-02: removes matching address', () => {
    const result = subtractSuppressed(['a@x.com', 'b@x.com', 'c@x.com'], new Set(['b@x.com']))

    expect(result).toEqual(['a@x.com', 'c@x.com'])
  })

  // TC-T-03: case-insensitive removal — suppressed "ADA@x.com" removes "ada@x.com".
  test('TC-T-03: suppressed "ADA@x.com" removes "ada@x.com" from emails list', () => {
    const result = subtractSuppressed(['ada@x.com', 'other@x.com'], new Set(['ADA@x.com']))

    expect(result).toEqual(['other@x.com'])
  })

  // TC-T-04: case-insensitive removal — suppressed "ada@x.com" removes "ADA@X.COM".
  test('TC-T-04: suppressed "ada@x.com" removes "ADA@X.COM" from emails list', () => {
    const result = subtractSuppressed(['ADA@X.COM', 'other@x.com'], new Set(['ada@x.com']))

    expect(result).toEqual(['other@x.com'])
  })

  // TC-T-05: accepts a plain array as suppressed (not only Set).
  test('TC-T-05: accepts array as suppressed argument', () => {
    const result = subtractSuppressed(['a@x.com', 'b@x.com'], ['b@x.com'])

    expect(result).toEqual(['a@x.com'])
  })

  // TC-T-06: order-stable — remaining addresses keep their original order.
  test('TC-T-06: result preserves original order of non-suppressed emails', () => {
    const result = subtractSuppressed(
      ['c@x.com', 'a@x.com', 'b@x.com'],
      new Set(['a@x.com']),
    )

    expect(result).toEqual(['c@x.com', 'b@x.com'])
  })

  // TC-T-07: input not mutated.
  test('TC-T-07: input emails array is not mutated', () => {
    const emails = ['a@x.com', 'b@x.com']
    const original = [...emails]

    subtractSuppressed(emails, new Set(['a@x.com']))

    expect(emails).toEqual(original)
  })

  // TC-T-08: empty suppressed → identity.
  test('TC-T-08: empty suppressed set → all emails returned', () => {
    const result = subtractSuppressed(['a@x.com', 'b@x.com'], new Set())

    expect(result).toEqual(['a@x.com', 'b@x.com'])
  })

  // TC-T-09: empty emails → empty array.
  test('TC-T-09: empty emails list → []', () => {
    const result = subtractSuppressed([], new Set(['a@x.com']))

    expect(result).toEqual([])
  })

  // TC-T-10: all emails suppressed → empty array.
  test('TC-T-10: all emails suppressed → []', () => {
    const result = subtractSuppressed(['a@x.com', 'b@x.com'], new Set(['a@x.com', 'b@x.com']))

    expect(result).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// GROUP U — recordUnsubscribe / getUnsubscribedEmails (convexTest)
// ---------------------------------------------------------------------------

describe('GROUP U — recordUnsubscribe / getUnsubscribedEmails', () => {
  // TC-U-01: inserted email is stored lowercase.
  test('TC-U-01: insert lowercases the email address', async () => {
    const t = convexTest(schema, modules)

    await t.mutation(internal.email.recordUnsubscribe, { email: 'Ada@Example.COM' })

    const list = await t.query(internal.email.getUnsubscribedEmails, {})

    expect(list).toContain('ada@example.com')
  })

  // TC-U-02: duplicate same email → one row in the table.
  test('TC-U-02: inserting same email twice → only one row / one entry returned', async () => {
    const t = convexTest(schema, modules)

    await t.mutation(internal.email.recordUnsubscribe, { email: 'dup@x.com' })
    await t.mutation(internal.email.recordUnsubscribe, { email: 'dup@x.com' })

    const list = await t.query(internal.email.getUnsubscribedEmails, {})
    const matches = list.filter((e: string) => e === 'dup@x.com')

    expect(matches).toHaveLength(1)
  })

  // TC-U-03: duplicate via different case → one row.
  test('TC-U-03: inserting same email with different case twice → one entry', async () => {
    const t = convexTest(schema, modules)

    await t.mutation(internal.email.recordUnsubscribe, { email: 'User@X.COM' })
    await t.mutation(internal.email.recordUnsubscribe, { email: 'user@x.com' })

    const list = await t.query(internal.email.getUnsubscribedEmails, {})
    const matches = list.filter((e: string) => e === 'user@x.com')

    expect(matches).toHaveLength(1)
  })

  // TC-U-04: getUnsubscribedEmails returns lowercased strings.
  test('TC-U-04: getUnsubscribedEmails returns lowercased list', async () => {
    const t = convexTest(schema, modules)

    await t.mutation(internal.email.recordUnsubscribe, { email: 'UPPER@EXAMPLE.COM' })

    const list = await t.query(internal.email.getUnsubscribedEmails, {})

    expect(list).toContain('upper@example.com')
    // must not contain the un-lowercased original
    expect(list).not.toContain('UPPER@EXAMPLE.COM')
  })

  // TC-U-05: empty table → [].
  test('TC-U-05: empty table → getUnsubscribedEmails returns []', async () => {
    const t = convexTest(schema, modules)

    const list = await t.query(internal.email.getUnsubscribedEmails, {})

    expect(list).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// GROUP V — suppression integration (convexTest, env-guard-bounded)
// ---------------------------------------------------------------------------

describe('GROUP V — suppression integration', () => {
  // TC-V-01: subtractSuppressed(mergeAudience([...]), seeded suppressed set)
  // excludes the suppressed address.
  test('TC-V-01: subtractSuppressed filters seeded unsubscribed address out of merged audience', async () => {
    const t = convexTest(schema, modules)

    // Seed one unsubscribe record
    await t.mutation(internal.email.recordUnsubscribe, { email: 'suppressed@x.com' })

    // Build a small merged audience that includes the suppressed address
    const audience = mergeAudience(['suppressed@x.com', 'ok@x.com'])
    const suppressed = await t.query(internal.email.getUnsubscribedEmails, {})
    const filtered = subtractSuppressed(audience, suppressed)

    expect(filtered).not.toContain('suppressed@x.com')
    expect(filtered).toContain('ok@x.com')
  })

  // TC-V-02: recordUnsubscribe then getUnsubscribedEmails feeds subtractSuppressed correctly.
  test('TC-V-02: recordUnsubscribe → getUnsubscribedEmails → subtractSuppressed pipeline works end-to-end', async () => {
    const t = convexTest(schema, modules)

    const emails = ['alice@x.com', 'bob@x.com', 'carol@x.com']
    // Unsub alice (mixed case)
    await t.mutation(internal.email.recordUnsubscribe, { email: 'Alice@X.COM' })

    const suppressed = await t.query(internal.email.getUnsubscribedEmails, {})
    const result = subtractSuppressed(emails, suppressed)

    expect(result).not.toContain('alice@x.com')
    expect(result).toEqual(['bob@x.com', 'carol@x.com'])
  })

  // TC-V-03: sendBroadcast("feature-update") with no RESEND_API_KEY → env-guard failure.
  // (Mirrors TC-Q-03 — verifies suppression path doesn't accidentally bypass env guard.)
  test('TC-V-03: sendBroadcast("feature-update") no API key → {success:false, message contains "Email service not configured"}', async () => {
    const t = convexTest(schema, modules)
    const asAdmin = t.withIdentity({ tokenIdentifier: 'convex|admin', email: ADMIN_EMAILS[0] })

    const result = await asAdmin.action(api.email.sendBroadcast, { broadcastId: 'feature-update' })

    expect(result.success).toBe(false)
    expect(result.message).toContain('Email service not configured')
  })

  // TC-V-04: sendTestEmail("feature-update") with identity, no API key → env-guard failure
  // (not a suppression error — suppression must not surface before env guard).
  test('TC-V-04: sendTestEmail("feature-update") with identity, no key → env-guard failure, not suppression error', async () => {
    const t = convexTest(schema, modules)
    const asAdmin = t.withIdentity({ tokenIdentifier: 'convex|admin', email: ADMIN_EMAILS[0] })

    const result = await asAdmin.action(api.email.sendTestEmail, { broadcastId: 'feature-update' })

    expect(result.success).toBe(false)
    expect(result.message).toContain('Email service not configured')
  })

  // NOTE (deferred / manual): the branch where sendBroadcast returns
  // {success:false, message:"Unsubscribe link missing from template"} is not
  // covered here because it requires stubbing the render pipeline. Mark for
  // manual QA or future injectable-render refactor.
})

// ---------------------------------------------------------------------------
// GROUP W — template render (vitest + @react-email/render)
// ---------------------------------------------------------------------------

describe('GROUP W — template render', () => {
  // TC-W-00: UNSUBSCRIBE_PLACEHOLDER must be exported and equal '%%UNSUBSCRIBE_URL%%'.
  // Without this guard, TC-W-05/06 degrade to `.not.toContain("undefined")` which passes
  // vacuously. This test ensures the whole group is honestly RED until the export exists.
  test('TC-W-00: UNSUBSCRIBE_PLACEHOLDER is exported and correct', () => {
    expect(typeof UNSUBSCRIBE_PLACEHOLDER).toBe('string')
    expect(UNSUBSCRIBE_PLACEHOLDER).toBe('%%UNSUBSCRIBE_URL%%')
  })

  // TC-W-01: FeatureUpdateEmail with unsubscribeUrl → html contains URL and <a>Unsubscribe</a>.
  test('TC-W-01: FeatureUpdateEmail(unsubscribeUrl) renders URL and Unsubscribe anchor', async () => {
    const url = 'https://aistack.to/unsubscribe?token=ABC'
    const html = await render(FeatureUpdateEmail({ unsubscribeUrl: url }))

    expect(html).toContain(url)
    // Must contain an anchor whose text includes "Unsubscribe"
    expect(html).toMatch(/<a [^>]*>.*[Uu]nsubscribe.*<\/a>/s)
  })

  // TC-W-02: WaitlistLaunchEmail with unsubscribeUrl → html contains URL and <a>Unsubscribe</a>.
  test('TC-W-02: WaitlistLaunchEmail(unsubscribeUrl) renders URL and Unsubscribe anchor', async () => {
    const url = 'https://aistack.to/unsubscribe?token=XYZ'
    const html = await render(WaitlistLaunchEmail({ unsubscribeUrl: url }))

    expect(html).toContain(url)
    expect(html).toMatch(/<a [^>]*>.*[Uu]nsubscribe.*<\/a>/s)
  })

  // TC-W-03: FeatureUpdateEmail default (no prop) contains the placeholder string.
  test('TC-W-03: FeatureUpdateEmail() with no prop contains UNSUBSCRIBE_PLACEHOLDER', async () => {
    const html = await render(FeatureUpdateEmail({}))

    expect(html).toContain(UNSUBSCRIBE_PLACEHOLDER)
  })

  // TC-W-04: WaitlistLaunchEmail default (no prop) contains the placeholder string.
  test('TC-W-04: WaitlistLaunchEmail() with no prop contains UNSUBSCRIBE_PLACEHOLDER', async () => {
    const html = await render(WaitlistLaunchEmail({}))

    expect(html).toContain(UNSUBSCRIBE_PLACEHOLDER)
  })

  // TC-W-05: FeatureUpdateEmail with prop — placeholder is GONE (replaced by real URL).
  test('TC-W-05: FeatureUpdateEmail(unsubscribeUrl) does NOT contain the placeholder', async () => {
    const url = 'https://aistack.to/unsubscribe?token=ABC'
    const html = await render(FeatureUpdateEmail({ unsubscribeUrl: url }))

    expect(html).not.toContain(UNSUBSCRIBE_PLACEHOLDER)
  })

  // TC-W-06: WaitlistLaunchEmail with prop — placeholder is GONE (replaced by real URL).
  test('TC-W-06: WaitlistLaunchEmail(unsubscribeUrl) does NOT contain the placeholder', async () => {
    const url = 'https://aistack.to/unsubscribe?token=XYZ'
    const html = await render(WaitlistLaunchEmail({ unsubscribeUrl: url }))

    expect(html).not.toContain(UNSUBSCRIBE_PLACEHOLDER)
  })

  // TC-W-07: render(FeatureUpdateEmail({})) with no props leaves the placeholder in the HTML,
  // then replaceAll substitutes a real URL (the string-replacement path used in production).
  test('TC-W-07: render(FeatureUpdateEmail({})) placeholder survives render, replaceAll substitutes URL', async () => {
    const url = 'https://aistack.to/api/email/unsubscribe?token=TESTTOKEN'
    const rawHtml = await render(FeatureUpdateEmail({}))

    // precondition: placeholder is present before substitution
    expect(rawHtml).toContain(UNSUBSCRIBE_PLACEHOLDER)

    const finalHtml = rawHtml.replaceAll(UNSUBSCRIBE_PLACEHOLDER, url)

    expect(finalHtml).toContain(url)
    expect(finalHtml).not.toContain(UNSUBSCRIBE_PLACEHOLDER)
  })

  // TC-W-08: same as TC-W-07 but for WaitlistLaunchEmail({}).
  test('TC-W-08: render(WaitlistLaunchEmail({})) placeholder survives render, replaceAll substitutes URL', async () => {
    const url = 'https://aistack.to/api/email/unsubscribe?token=TESTTOKEN'
    const rawHtml = await render(WaitlistLaunchEmail({}))

    // precondition: placeholder is present before substitution
    expect(rawHtml).toContain(UNSUBSCRIBE_PLACEHOLDER)

    const finalHtml = rawHtml.replaceAll(UNSUBSCRIBE_PLACEHOLDER, url)

    expect(finalHtml).toContain(url)
    expect(finalHtml).not.toContain(UNSUBSCRIBE_PLACEHOLDER)
  })
})

// ---------------------------------------------------------------------------
// GROUP X — getBroadcastRecipientCount (convexTest)
// Tested via the "waitlist" audience (waitlist-launch) which resolves from
// ctx.db only — the "waitlist+members" path enumerates the better-auth
// component, which convexTest does not mount (covered by manual/integration).
// ---------------------------------------------------------------------------

async function seedWaitlist(
  t: ReturnType<typeof convexTest>,
  emails: string[],
) {
  await t.run(async (ctx: MutationCtx) => {
    for (const email of emails) {
      await ctx.db.insert('waitlist', {
        email,
        provider: 'email',
        status: 'pending',
        joinedAt: Date.now(),
        lookupId: `lookup-${email}`,
      })
    }
  })
}

describe('GROUP X — getBroadcastRecipientCount', () => {
  // TC-X-01: unknown broadcast id → 0.
  test('TC-X-01: unknown broadcastId → 0', async () => {
    const t = convexTest(schema, modules)

    const count = await t.query(api.email.getBroadcastRecipientCount, {
      broadcastId: 'does-not-exist',
    })

    expect(count).toBe(0)
  })

  // TC-X-02: real audience minus unsubscribed (waitlist-launch = "waitlist").
  test('TC-X-02: counts waitlist audience minus unsubscribed', async () => {
    const t = convexTest(schema, modules)
    await seedWaitlist(t, ['a@example.com', 'b@example.com', 'c@example.com'])
    await t.mutation(internal.email.recordUnsubscribe, { email: 'b@example.com' })

    const count = await t.query(api.email.getBroadcastRecipientCount, {
      broadcastId: 'waitlist-launch',
    })

    expect(count).toBe(2)
  })

  // TC-X-03: count dedupes case-insensitively (matches mergeAudience).
  test('TC-X-03: dedupes case-insensitive duplicate waitlist rows', async () => {
    const t = convexTest(schema, modules)
    await seedWaitlist(t, ['a@example.com', 'A@EXAMPLE.COM', 'c@example.com'])

    const count = await t.query(api.email.getBroadcastRecipientCount, {
      broadcastId: 'waitlist-launch',
    })

    expect(count).toBe(2)
  })
})
