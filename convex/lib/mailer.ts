/**
 * The parts of a bulk send that a broadcast and a newsletter issue share
 * (#201, map #198).
 *
 * `convex/email.ts` owns the registered one-off broadcasts. `convex/newsletter.ts`
 * owns the weekly issues. Both build the same audience, filter it against the
 * same per-category preferences, sign the same unsubscribe links, and walk the
 * same rate-limited Resend loop. That shared middle lives here so neither copy
 * can drift from the other: a fix to the send loop must reach both.
 *
 * Nothing here touches the database. The callers read their own rows and hand
 * this module plain values.
 */

import type { Resend } from 'resend'
import { UNSUBSCRIBE_PLACEHOLDER } from '../../src/emails/styles'
import { signUnsubscribeToken } from '../emailToken'

/** One of the two preference toggles a recipient can turn off. */
export type EmailCategoryValue = 'newsletter' | 'important-updates'

/**
 * The `emailPreferences` column each category toggles. One name for one thing:
 * the wire and the URL use "important-updates", the row uses `importantUpdates`.
 */
export const CATEGORY_FIELD = {
  newsletter: 'newsletter',
  'important-updates': 'importantUpdates',
} as const

/**
 * Lowercase and dedupe email lists into their order-stable union. The first
 * lowercased occurrence wins, and empty entries are dropped.
 */
export function mergeAudience(...lists: string[][]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const list of lists) {
    for (const raw of list) {
      const email = raw?.trim().toLowerCase()
      if (!email) continue
      if (seen.has(email)) continue
      seen.add(email)
      out.push(email)
    }
  }
  return out
}

/**
 * Remove the addresses that turned this category off. Case-insensitive,
 * order-stable, and non-mutating.
 */
export function subtractSuppressed(
  emails: string[],
  suppressed: Set<string> | string[],
): string[] {
  const set = new Set<string>()
  for (const s of suppressed) set.add(s.trim().toLowerCase())
  return emails.filter((e) => !set.has(e.trim().toLowerCase()))
}

/**
 * Build a signed unsubscribe URL for each recipient, concurrently.
 *
 * NOTE: rotating BETTER_AUTH_SECRET invalidates every unsubscribe link already
 * sitting in an inbox (tokens never expire). Only rotate with a dual-verify
 * grace window.
 *
 * The token signs the ADDRESS only, and the category rides beside it as a plain
 * parameter. Two reasons. Every link already sent keeps working, and those
 * cannot be migrated. And the category is not a secret: the token proves the
 * holder owns the address, and the only preferences they can reach are theirs.
 */
export async function buildUnsubscribeUrls(
  recipients: string[],
  secret: string,
  appUrl: string,
  category: EmailCategoryValue,
): Promise<Map<string, string>> {
  const entries = await Promise.all(
    recipients.map(async (email) => {
      const token = await signUnsubscribeToken(email, secret)
      return [
        email,
        `${appUrl}/api/email/unsubscribe?token=${token}&category=${category}`,
      ] as const
    }),
  )
  return new Map(entries)
}

/** What one bulk send did, per address. */
export interface BulkSendResult {
  success: boolean
  sent: number
  failed: number
  total: number
  sentEmails: string[]
  errors: { email: string; error: string }[]
}

/**
 * Send one rendered email to many recipients, one per second.
 *
 * The pause is Resend's rate limit (2 per second), halved for headroom. The run
 * never throws: a failed address is recorded and the loop carries on, because a
 * send that stops halfway leaves the owner with no idea who got it.
 */
export async function sendBulkEmails(
  resend: Resend,
  emails: string[],
  subject: string,
  html: string,
  unsubUrlFor: (email: string) => string,
  from = process.env.EMAIL_FROM || 'onboarding@resend.dev',
): Promise<BulkSendResult> {
  let sent = 0
  let failed = 0
  const errors: { email: string; error: string }[] = []
  const sentEmails: string[] = []

  console.log(
    `Starting send to ${emails.length} recipients (1 email per second)...`,
  )

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i]
    console.log(`Sending ${i + 1}/${emails.length}: ${email}`)

    const url = unsubUrlFor(email)
    const personalizedHtml = html.replaceAll(UNSUBSCRIBE_PLACEHOLDER, url)

    try {
      const { error } = await resend.emails.send({
        from,
        to: email,
        subject,
        html: personalizedHtml,
        headers: {
          'List-Unsubscribe': `<${url}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      })

      if (error) {
        failed++
        const errorMsg = JSON.stringify(error)
        errors.push({ email, error: errorMsg })
        console.error(`✗ Failed: ${email} - ${errorMsg}`)
      } else {
        sent++
        sentEmails.push(email)
        console.log(`✓ Sent: ${email}`)
      }
    } catch (err) {
      failed++
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      errors.push({ email, error: errorMsg })
      console.error(`✗ Failed: ${email} - ${errorMsg}`)
    }

    // Wait a second before the next one, except after the last.
    if (i < emails.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  console.log(`\n=== Send summary ===`)
  console.log(`Total: ${emails.length}, Sent: ${sent}, Failed: ${failed}`)
  if (sentEmails.length > 0) console.log(`Sent to: ${sentEmails.join(', ')}`)
  if (errors.length > 0) {
    console.log('Failed emails:')
    for (const err of errors) console.log(`  - ${err.email}: ${err.error}`)
  }

  return {
    success: failed === 0,
    sent,
    failed,
    total: emails.length,
    sentEmails,
    errors,
  }
}

/**
 * The three environment facts every bulk send needs, or the reason it cannot
 * run. Checked BEFORE a single address is read, so a misconfigured deployment
 * refuses loudly instead of mailing broken unsubscribe links.
 */
export function readSendEnv(appUrl: string):
  | { ok: true; resendKey: string; secret: string; appUrl: string }
  | { ok: false; message: string } {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY environment variable is not set')
    return { ok: false, message: 'Email service not configured' }
  }
  // Without the signing secret we cannot build verifiable unsubscribe tokens.
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret) {
    console.error('BETTER_AUTH_SECRET environment variable is not set')
    return { ok: false, message: 'Email service not configured' }
  }
  // A localhost or missing APP_URL ships dead unsubscribe links, and mail
  // clients drop the List-Unsubscribe header that carries them.
  if (!appUrl.startsWith('https://')) {
    console.error('APP_URL is not an https URL - refusing to send')
    return { ok: false, message: 'Email service not configured' }
  }
  return {
    ok: true,
    resendKey: process.env.RESEND_API_KEY,
    secret,
    appUrl,
  }
}
