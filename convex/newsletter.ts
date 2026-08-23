/**
 * The newsletter projection (#201, map #198).
 *
 * Spec: the newsletter section of docs/specs/news-pipeline.md. The compose
 * prototype (#202) ruled that issues stay code-based, so there is no compose
 * page and nothing here writes editorial copy. An issue is authored in
 * `src/newsletter/issues.ts`, and this module does four things with it:
 *
 *   prepare  resolve the authored URLs against the item stream into a draft row
 *   render   join the draft row to its items and lay them out as one email
 *   send     mail that email to the newsletter audience, once
 *   publish  serve the sent issue as a public archive page
 *
 * A sent issue is never edited (#202). Every write path here refuses a row in
 * state `sent`, which is what makes it safe for the archive page and the copy
 * in someone's inbox to read the same summary off the same item row.
 *
 * The owner reaches `prepare` and `send` two ways: the admin Newsletter view,
 * which is identity-gated by `isAdmin`, and `scripts/newsletter.ts`, which runs
 * on the server through `scripts/convex-prod.sh` and therefore calls the
 * INTERNAL functions - an admin key carries no user identity, so `isAdmin`
 * would refuse it.
 */

import { v } from 'convex/values'
import { render } from '@react-email/render'
import { Resend } from 'resend'
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { internal } from './_generated/api'
import type { QueryCtx } from './_generated/server'
import { NewsletterIssueEmail } from '../src/emails/NewsletterIssueEmail'
import { UNSUBSCRIBE_PLACEHOLDER } from '../src/emails/styles'
import {
  NEWSLETTER_ISSUES,
  getIssueDefinition,
} from '../src/newsletter/issues'
import { getAppUrl } from './httpCli'
import { isAdmin } from './lib/admin'
import { newsUrlKey } from './lib/feed'
import {
  buildUnsubscribeUrls,
  mergeAudience,
  readSendEnv,
  sendBulkEmails,
  subtractSuppressed,
} from './lib/mailer'
import { consume } from './rateLimit'
import { verifyUnsubscribeToken } from './emailToken'

/**
 * How many subscribe attempts one address gets a minute. The caller is a
 * browser with no IP we can trust, so the bucket is keyed by the ADDRESS: it
 * stops a form loop re-submitting the same address, and it does not pretend to
 * stop a script walking a list of addresses. Nothing is mailed on subscribe, so
 * that second case costs a row and nothing else.
 */
const SUBSCRIBE_ATTEMPTS_PER_MINUTE = 5

/** Only a shape check. The address proves itself when a send reaches it. */
function isEmailShaped(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ---------------------------------------------------------------------------
// Prepare: the authored issue becomes a draft row
// ---------------------------------------------------------------------------

/** What one prepare run found. `ok` means every authored URL resolved. */
type PrepareReport = {
  ok: boolean
  message?: string
  slug: string
  number?: number
  resolved?: number
  missing?: string[]
  notApproved?: { url: string; state: string }[]
  undrafted?: string[]
}

/** The same report, on the wire. */
const PREPARE_REPORT = v.object({
  ok: v.boolean(),
  message: v.optional(v.string()),
  slug: v.string(),
  number: v.optional(v.number()),
  resolved: v.optional(v.number()),
  /** Authored URLs with no item row at all. Quick-add or collect them. */
  missing: v.optional(v.array(v.string())),
  /** Authored URLs whose item is still in the inbox, or discarded. */
  notApproved: v.optional(v.array(v.object({ url: v.string(), state: v.string() }))),
  /** Resolved items with no summary yet. They render as a bare link. */
  undrafted: v.optional(v.array(v.string())),
})

/**
 * Resolve the authored issue into a draft row, and say what is missing.
 *
 * Idempotent: running it again re-resolves and rewrites the same draft row, so
 * the owner can prepare, work the inbox, and prepare again. It refuses a sent
 * issue, because the composition is frozen at the send.
 */
export const prepareIssue = internalMutation({
  args: { slug: v.string() },
  returns: PREPARE_REPORT,
  handler: async (ctx, args): Promise<PrepareReport> => {
    const def = getIssueDefinition(args.slug)
    if (!def) {
      return {
        ok: false,
        slug: args.slug,
        message: `No issue "${args.slug}" is authored in src/newsletter/issues.ts`,
      }
    }

    const existing = await ctx.db
      .query('newsIssues')
      .withIndex('by_slug', (q) => q.eq('slug', def.slug))
      .first()
    if (existing?.status === 'sent') {
      return {
        ok: false,
        slug: def.slug,
        number: def.number,
        message: 'The issue is sent. A sent issue is never edited.',
      }
    }

    const itemIds: Id<'newsItems'>[] = []
    const missing: string[] = []
    const notApproved: { url: string; state: string }[] = []
    const undrafted: string[] = []

    for (const url of def.itemUrls) {
      const key = newsUrlKey(url)
      const item = await ctx.db
        .query('newsItems')
        .withIndex('by_urlKey', (q) => q.eq('urlKey', key))
        .first()
      if (!item) {
        missing.push(url)
        continue
      }
      if (item.state !== 'approved') {
        notApproved.push({ url, state: item.state })
        continue
      }
      if (!item.summary?.trim()) undrafted.push(url)
      itemIds.push(item._id)
    }

    const now = Date.now()
    if (existing) {
      await ctx.db.patch(existing._id, {
        number: def.number,
        subject: def.subject,
        intro: def.intro,
        itemIds,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert('newsIssues', {
        number: def.number,
        slug: def.slug,
        subject: def.subject,
        intro: def.intro,
        itemIds,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      })
    }

    return {
      ok: missing.length === 0 && notApproved.length === 0,
      slug: def.slug,
      number: def.number,
      resolved: itemIds.length,
      missing,
      notApproved,
      undrafted,
    }
  },
})

// ---------------------------------------------------------------------------
// Render: the draft row plus its items
// ---------------------------------------------------------------------------

/** One item as both the email and the archive page need it. */
type RenderItem = {
  headline: string
  url: string
  summary?: string
  sourceName?: string
  publishedAt?: number
  attribution?: string
}

/**
 * Join an issue's item ids to the rows, in send order.
 *
 * An id that no longer resolves is dropped, not faked: an item deleted between
 * prepare and send should shorten the issue, never render an empty slot. The
 * source row supplies the credit line and the license notice.
 */
async function joinItems(
  ctx: QueryCtx,
  itemIds: Id<'newsItems'>[],
): Promise<RenderItem[]> {
  const sourceNames = new Map<string, { name: string; attribution?: string }>()
  const out: RenderItem[] = []
  for (const id of itemIds) {
    const item = await ctx.db.get(id)
    if (!item) continue
    let source: { name: string; attribution?: string } | undefined
    if (item.sourceId) {
      const cached = sourceNames.get(item.sourceId)
      if (cached) {
        source = cached
      } else {
        const row = await ctx.db.get(item.sourceId)
        if (row) {
          source = { name: row.name, attribution: row.attribution }
          sourceNames.set(item.sourceId, source)
        }
      }
    }
    out.push({
      headline: item.headline,
      url: item.url,
      summary: item.summary,
      sourceName: source?.name,
      publishedAt: item.publishedAt,
      attribution: source?.attribution,
    })
  }
  return out
}

/** The draft or sent issue named by `slug`, with its items in send order. */
export const issueForRender = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const issue = await ctx.db
      .query('newsIssues')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
    if (!issue) return null
    return { issue, items: await joinItems(ctx, issue.itemIds) }
  },
})

/** Render one issue to the HTML that goes on the wire. */
async function renderIssue(
  issue: Doc<'newsIssues'>,
  items: RenderItem[],
): Promise<string> {
  const def = getIssueDefinition(issue.slug)
  return render(
    NewsletterIssueEmail({
      number: issue.number,
      slug: issue.slug,
      subject: issue.subject,
      preview: def?.preview ?? issue.subject,
      intro: issue.intro,
      items,
    }),
  )
}

/**
 * The exact HTML one issue puts on the wire, unpersonalized.
 *
 * `scripts/newsletter.ts preview` writes it to a file so the owner can open the
 * real render in a browser before a single address is touched. The unsubscribe
 * placeholder is still in it: personalization happens per recipient, at send.
 */
export const renderIssueHtml = internalAction({
  args: { slug: v.string() },
  // An OBJECT, not a bare string: `scripts/newsletter.ts` reads the Convex
  // CLI's stdout, and its parser only picks braced values out of the log noise.
  returns: v.object({ found: v.boolean(), html: v.optional(v.string()) }),
  handler: async (
    ctx,
    args,
  ): Promise<{ found: boolean; html?: string }> => {
    const data = await ctx.runQuery(internal.newsletter.issueForRender, {
      slug: args.slug,
    })
    if (!data) return { found: false }
    return { found: true, html: await renderIssue(data.issue, data.items) }
  },
})

// ---------------------------------------------------------------------------
// The audience
// ---------------------------------------------------------------------------

/** Every address that asked for the newsletter on the public subscribe page. */
export const getSubscriberEmails = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('newsletterSubscribers').collect()
    return rows.map((r) => r.email)
  },
})

/**
 * The real recipient count, reactive, for the admin view. It runs the same
 * three reads the send runs, so the number shown is the number mailed.
 */
export const recipientCount = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return 0
    const waitlist = (await ctx.db.query('waitlist').collect()).map((e) => e.email)
    const subscribers = (
      await ctx.db.query('newsletterSubscribers').collect()
    ).map((r) => r.email)
    const suppressed = (await ctx.db.query('emailPreferences').collect())
      .filter((r) => r.newsletter === false)
      .map((r) => r.email)
    // Members are counted by the send itself, which can page the better-auth
    // component. This number is the floor, and the admin view says so.
    return subtractSuppressed(mergeAudience(waitlist, subscribers), suppressed)
      .length
  },
})

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------

/** Freeze the composition and record what the send did. */
export const markSent = internalMutation({
  args: {
    slug: v.string(),
    sentCount: v.number(),
    failedCount: v.number(),
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db
      .query('newsIssues')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
    if (!issue) return null
    const now = Date.now()
    const readyItems = await ctx.db
      .query('newsItems')
      .withIndex('by_state_knowledgeBasePublishedAt', (q) =>
        q
          .eq('state', 'approved')
          .eq('knowledgeBasePublishedAt', undefined)
      )
      .collect()
    for (const item of readyItems) {
      if (!item.summary?.trim() || !item.topicId) continue
      await ctx.db.patch(item._id, { knowledgeBasePublishedAt: now })
    }
    await ctx.db.patch(issue._id, {
      status: 'sent',
      sentAt: now,
      sentCount: args.sentCount,
      failedCount: args.failedCount,
      updatedAt: now,
    })
    return issue._id
  },
})

type SendResult = {
  success: boolean
  sent: number
  failed: number
  total?: number
  suppressed?: number
  message?: string
  errors?: { email: string; error: string }[]
}

/**
 * Send one issue, or one test copy of it.
 *
 * `testTo` sends a single `[TEST]` copy and changes nothing in the database, so
 * the owner can look at the real render in a real client before committing. A
 * real send marks the issue sent, and a second real send is refused.
 */
export const sendIssue = internalAction({
  args: { slug: v.string(), testTo: v.optional(v.string()) },
  handler: async (ctx, args): Promise<SendResult> => {
    const env = readSendEnv(getAppUrl())
    if (!env.ok) return { success: false, sent: 0, failed: 0, message: env.message }

    const data = await ctx.runQuery(internal.newsletter.issueForRender, {
      slug: args.slug,
    })
    if (!data) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        message: `No draft row for "${args.slug}". Run prepare first.`,
      }
    }
    const { issue, items } = data
    if (issue.status === 'sent' && !args.testTo) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        message: 'The issue is already sent.',
      }
    }
    if (items.length === 0) {
      return { success: false, sent: 0, failed: 0, message: 'The issue has no items.' }
    }
    if (!issue.subject.trim()) {
      return { success: false, sent: 0, failed: 0, message: 'The issue has no subject.' }
    }

    const html = await renderIssue(issue, items)
    // Loud pre-send failure: without the placeholder every recipient gets a
    // dead unsubscribe link, and mail clients drop the header that carries it.
    if (!html.includes(UNSUBSCRIBE_PLACEHOLDER)) {
      console.error('Rendered issue is missing the unsubscribe placeholder')
      return {
        success: false,
        sent: 0,
        failed: 0,
        message: 'Unsubscribe link missing from template',
      }
    }

    let recipients: string[]
    let suppressed = 0
    if (args.testTo) {
      recipients = [args.testTo.trim().toLowerCase()]
    } else {
      const waitlist = await ctx.runQuery(internal.email.getWaitlistEmails, {})
      const members = await ctx.runQuery(internal.email.getMemberEmails, {})
      const subscribers = await ctx.runQuery(
        internal.newsletter.getSubscriberEmails,
        {},
      )
      const audience = mergeAudience(waitlist, members, subscribers)
      const optedOut = await ctx.runQuery(internal.email.getSuppressedEmails, {
        category: 'newsletter',
      })
      recipients = subtractSuppressed(audience, optedOut)
      suppressed = audience.length - recipients.length
    }

    const urlByEmail = await buildUnsubscribeUrls(
      recipients,
      env.secret,
      env.appUrl,
      'newsletter',
    )
    const resend = new Resend(env.resendKey)
    const result = await sendBulkEmails(
      resend,
      recipients,
      args.testTo ? `[TEST] ${issue.subject}` : issue.subject,
      html,
      (e) => urlByEmail.get(e) ?? '',
    )

    if (!args.testTo) {
      await ctx.runMutation(internal.newsletter.markSent, {
        slug: args.slug,
        sentCount: result.sent,
        failedCount: result.failed,
      })
    }

    return { ...result, suppressed }
  },
})

// ---------------------------------------------------------------------------
// The admin surface. Identity-gated, and thin: the work is above.
// ---------------------------------------------------------------------------

/**
 * Every authored issue, with the state of its row. The registry is the list, so
 * an issue that has never been prepared still shows up, as `not prepared`.
 */
async function readIssueStates(ctx: QueryCtx) {
  const rows = await ctx.db.query('newsIssues').collect()
  const bySlug = new Map(rows.map((r) => [r.slug, r]))
  return NEWSLETTER_ISSUES.map((def) => {
    const row = bySlug.get(def.slug)
    return {
      number: def.number,
      slug: def.slug,
      subject: def.subject,
      authoredItems: def.itemUrls.length,
      status: row?.status ?? null,
      resolvedItems: row?.itemIds.length ?? 0,
      sentAt: row?.sentAt,
      sentCount: row?.sentCount,
      failedCount: row?.failedCount,
    }
  }).sort((a, b) => b.number - a.number)
}

/** The admin Newsletter view. */
export const listIssues = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isAdmin(ctx))) return []
    return await readIssueStates(ctx)
  },
})

/** The same list for `scripts/newsletter.ts list`, which holds an admin key. */
export const listIssuesInternal = internalQuery({
  args: {},
  handler: async (ctx) => await readIssueStates(ctx),
})

export const adminPrepareIssue = action({
  args: { slug: v.string() },
  returns: PREPARE_REPORT,
  handler: async (ctx, args): Promise<PrepareReport> => {
    if (!(await isAdmin(ctx))) {
      return { ok: false, slug: args.slug, message: 'Unauthorized' }
    }
    return await ctx.runMutation(internal.newsletter.prepareIssue, {
      slug: args.slug,
    })
  },
})

export const adminSendTestIssue = action({
  args: { slug: v.string() },
  handler: async (ctx, args): Promise<SendResult> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!(await isAdmin(ctx)) || !identity?.email) {
      return { success: false, sent: 0, failed: 0, message: 'Unauthorized' }
    }
    return await ctx.runAction(internal.newsletter.sendIssue, {
      slug: args.slug,
      testTo: identity.email,
    })
  },
})

export const adminSendIssue = action({
  args: { slug: v.string() },
  handler: async (ctx, args): Promise<SendResult> => {
    if (!(await isAdmin(ctx))) {
      return { success: false, sent: 0, failed: 0, message: 'Unauthorized' }
    }
    return await ctx.runAction(internal.newsletter.sendIssue, { slug: args.slug })
  },
})

// ---------------------------------------------------------------------------
// The public archive (#203: an issue's own page opens the other issues)
// ---------------------------------------------------------------------------

/** Every sent issue, newest first. Drafts are not public. */
export const listSentIssues = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query('newsIssues')
      .withIndex('by_status', (q) => q.eq('status', 'sent'))
      .collect()
    return rows
      .sort((a, b) => b.number - a.number)
      .map((r) => ({
        number: r.number,
        slug: r.slug,
        subject: r.subject,
        intro: r.intro,
        sentAt: r.sentAt,
        itemCount: r.itemIds.length,
      }))
  },
})

/**
 * One sent issue's archive page: its items, and the way to the other issues.
 *
 * The neighbours ride on this one read because #203 requires them: the
 * read-in-browser link is the only site link an issue carries besides the main
 * page, so the page it lands on has to open the rest of the archive.
 */
export const getSentIssue = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const issue = await ctx.db
      .query('newsIssues')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
    if (!issue || issue.status !== 'sent') return null

    const all = (
      await ctx.db
        .query('newsIssues')
        .withIndex('by_status', (q) => q.eq('status', 'sent'))
        .collect()
    ).sort((a, b) => b.number - a.number)
    const index = all.findIndex((r) => r.slug === issue.slug)
    const brief = (row?: Doc<'newsIssues'>) =>
      row ? { number: row.number, slug: row.slug, subject: row.subject } : null

    return {
      number: issue.number,
      slug: issue.slug,
      subject: issue.subject,
      intro: issue.intro,
      sentAt: issue.sentAt,
      items: await joinItems(ctx, issue.itemIds),
      // "newer" is the lower index, because the list is newest first.
      newer: brief(all[index - 1]),
      older: brief(all[index + 1]),
      others: all
        .filter((r) => r.slug !== issue.slug)
        .map((r) => ({ number: r.number, slug: r.slug, subject: r.subject })),
    }
  },
})

// ---------------------------------------------------------------------------
// Subscribe
// ---------------------------------------------------------------------------

/**
 * Take a newcomer's address for the newsletter.
 *
 * Subscribing is an explicit ask, so it also clears an earlier refusal: an
 * address that unsubscribed and then typed itself into the form again gets
 * `newsletter: true` back. `alreadySubscribed` is a normal outcome and is
 * reported as success, because telling a visitor "you are already on the list"
 * is the truth and re-submitting is not an error.
 */
export const subscribe = mutation({
  args: { email: v.string(), source: v.optional(v.string()) },
  returns: v.object({
    ok: v.boolean(),
    alreadySubscribed: v.optional(v.boolean()),
    message: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase()
    if (!isEmailShaped(email)) {
      return { ok: false, message: 'That does not look like an email address.' }
    }

    const limit = await consume(
      ctx,
      `newsletter-subscribe:${email}`,
      SUBSCRIBE_ATTEMPTS_PER_MINUTE,
    )
    if (!limit.allowed) {
      return { ok: false, message: 'Too many attempts. Try again in a minute.' }
    }

    // An earlier refusal is lifted by this explicit ask.
    const pref = await ctx.db
      .query('emailPreferences')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first()
    if (pref && pref.newsletter === false) {
      await ctx.db.patch(pref._id, { newsletter: true, updatedAt: Date.now() })
    }

    const existing = await ctx.db
      .query('newsletterSubscribers')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first()
    if (existing) return { ok: true, alreadySubscribed: true }

    await ctx.db.insert('newsletterSubscribers', {
      email,
      source: args.source,
      createdAt: Date.now(),
    })
    return { ok: true, alreadySubscribed: false }
  },
})

// ---------------------------------------------------------------------------
// The preferences page
// ---------------------------------------------------------------------------

/**
 * Both toggles for one address. Absent reads as subscribed to both, which is
 * the same rule the send filters by.
 */
export const preferencesFor = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('emailPreferences')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first()
    return {
      email: args.email,
      newsletter: row?.newsletter ?? true,
      importantUpdates: row?.importantUpdates ?? true,
    }
  },
})

export const setPreferencesFor = internalMutation({
  args: {
    email: v.string(),
    newsletter: v.boolean(),
    importantUpdates: v.boolean(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('emailPreferences')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first()
    const now = Date.now()
    if (row) {
      await ctx.db.patch(row._id, {
        newsletter: args.newsletter,
        importantUpdates: args.importantUpdates,
        updatedAt: now,
      })
      return
    }
    await ctx.db.insert('emailPreferences', {
      email: args.email,
      newsletter: args.newsletter,
      importantUpdates: args.importantUpdates,
      updatedAt: now,
    })
  },
})

/**
 * Read the preferences the token's address owns.
 *
 * The token is the same signed unsubscribe token every email already carries,
 * so the link in a two-year-old inbox opens this page. It proves the holder
 * owns the address, and the only preferences it reaches are that address's.
 */
type PreferenceRow = {
  email: string
  newsletter: boolean
  importantUpdates: boolean
}

export const preferencesByToken = action({
  args: { token: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      email: v.string(),
      newsletter: v.boolean(),
      importantUpdates: v.boolean(),
    }),
  ),
  handler: async (ctx, args): Promise<PreferenceRow | null> => {
    const secret = process.env.BETTER_AUTH_SECRET
    if (!secret) return null
    const email = await verifyUnsubscribeToken(args.token, secret)
    if (!email) return null
    return await ctx.runQuery(internal.newsletter.preferencesFor, { email })
  },
})

export const setPreferencesByToken = action({
  args: {
    token: v.string(),
    newsletter: v.boolean(),
    importantUpdates: v.boolean(),
  },
  returns: v.object({ ok: v.boolean(), message: v.optional(v.string()) }),
  handler: async (
    ctx,
    args,
  ): Promise<{ ok: boolean; message?: string }> => {
    const secret = process.env.BETTER_AUTH_SECRET
    if (!secret) return { ok: false, message: 'Email service not configured' }
    const email = await verifyUnsubscribeToken(args.token, secret)
    if (!email) return { ok: false, message: 'That link is not valid.' }
    await ctx.runMutation(internal.newsletter.setPreferencesFor, {
      email,
      newsletter: args.newsletter,
      importantUpdates: args.importantUpdates,
    })
    return { ok: true }
  },
})
