import { httpAction } from './_generated/server'
import { api, internal } from './_generated/api'
import { verifyUnsubscribeToken } from './emailToken'
import { getAppUrl } from './httpCli'

/**
 * The link to the per-category preferences page (#201).
 *
 * One category off is rarely the whole answer: someone who stops the newsletter
 * may still want an account announcement, and the only place both toggles are
 * visible at once is that page. It carries the SAME token, because the token
 * proves the address and nothing else.
 */
function preferencesLink(token: string): string {
  return `<p style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace;font-size:13px;color:#737373;line-height:20px;margin:28px 0 0"><a href="${getAppUrl()}/email/preferences?token=${token}" style="color:#0a0a0a">Choose which emails you get</a></p>`
}

// Branded HTML shell mirroring the inline-HTML brand idiom from
// sendWaitlistConfirmEmail (dark #111 chrome, lime #a3e635 accent, sharp
// corners, monospace technical accents).
function brandedPage(opts: { label: string; heading: string; body: string }): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;padding:48px 16px;margin:0">
  <div style="background-color:#ffffff;padding:0;margin:0 auto;width:100%;max-width:560px;overflow:hidden">
    <div style="background-color:#111111;padding:28px 40px">
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="width:16px;height:16px;background-color:#a3e635;vertical-align:middle"></td>
        <td style="padding-left:12px;vertical-align:middle"><span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#fafafa;text-transform:uppercase;line-height:1">AI STACK</span></td>
      </tr></table>
    </div>
    <div style="padding:48px 40px 56px">
      <p style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace;font-size:10px;font-weight:600;letter-spacing:0.15em;color:#737373;text-transform:uppercase;margin:0 0 12px">${opts.label}</p>
      <h1 style="font-size:32px;font-weight:800;color:#0a0a0a;margin:0 0 24px;line-height:1.1;letter-spacing:-0.02em;text-transform:uppercase">${opts.heading}</h1>
      ${opts.body}
    </div>
    <div style="background-color:#111111;padding:24px 40px">
      <p style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace;font-size:13px;color:#737373;line-height:20px;margin:0;letter-spacing:0.01em"><a href="https://aistack.to" style="color:#a3e635;text-decoration:none">AI Stack</a> · ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>`
}

// Escape user-supplied strings before embedding in HTML to prevent XSS.
// Replaces the five characters that are meaningful in HTML/attribute contexts.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function htmlResponse(body: string, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', ...extraHeaders },
  })
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Behind Coolify's Traefik edge proxy, which APPENDS the real client IP as the
 * last X-Forwarded-For hop. Read the rightmost (trusted) hop, never the
 * client-controlled leftmost one. Same caveat as src/routes/api.stacks.$slug.tsx:
 * trustworthy only while Traefik is the sole terminating proxy; a CDN in front
 * would make the rightmost hop spoofable.
 */
function ipFromForwardedFor(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (!xff) return 'unknown'
  const hops = xff.split(',')
  for (let i = hops.length - 1; i >= 0; i--) {
    const hop = hops[i]?.trim()
    if (hop) return hop
  }
  return 'unknown'
}

/**
 * Which category this link turns off (#204).
 *
 * Absent reads as `important-updates`, and that is not a fallback: every link
 * already sitting in a sent inbox carries no category, and every one of those
 * links was shipped with a broadcast, which is an important update. The
 * newsletter did not exist when they were sent.
 */
function categoryFrom(url: URL): 'newsletter' | 'important-updates' {
  return url.searchParams.get('category') === 'newsletter'
    ? 'newsletter'
    : 'important-updates'
}

const CATEGORY_LABEL = {
  newsletter: 'the AI Stack newsletter',
  'important-updates': 'important updates from AI Stack',
} as const

export const unsubscribe = httpAction(async (ctx, request) => {
  const isPost = request.method === 'POST'
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  const category = categoryFrom(url)
  const label = CATEGORY_LABEL[category]
  const secret = process.env.BETTER_AUTH_SECRET

  // Secret guard - never 500. Without the signing secret we cannot verify any
  // token, so refuse loudly but gracefully.
  if (!secret) {
    if (isPost) return jsonError('Email service not configured', 400)
    return htmlResponse(
      brandedPage({
        label: '// Unsubscribe',
        heading: 'Unavailable',
        body: '<p style="font-size:16px;line-height:28px;color:#3d3d3d;margin:0">Unsubscribe is temporarily unavailable. Please try again later.</p>',
      }),
      400,
    )
  }

  // Verify BEFORE rate-limiting: a request whose token verifies is ALWAYS
  // honored (never 429). Only invalid/missing-token traffic is rate-limited.
  const email = token ? await verifyUnsubscribeToken(token, secret) : null

  if (email === null) {
    const ip = ipFromForwardedFor(request)
    // Namespaced, because the same table now also holds bearer-token buckets
    // (#52) and two kinds of caller must never collide.
    const rl = await ctx.runMutation(api.rateLimit.checkApiRateLimit, { key: `ip:${ip}` })
    if (!rl.allowed) {
      if (isPost) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rl.retryAfterSeconds),
          },
        })
      }
      return htmlResponse(
        brandedPage({
          label: '// Unsubscribe',
          heading: 'Too Many Requests',
          body: '<p style="font-size:16px;line-height:28px;color:#3d3d3d;margin:0">Too many requests. Please try again in a moment.</p>',
        }),
        429,
        { 'Retry-After': String(rl.retryAfterSeconds) },
      )
    }
    if (isPost) return jsonError('Invalid or expired link', 400)
    return htmlResponse(
      brandedPage({
        label: '// Unsubscribe',
        heading: 'Invalid Link',
        body: '<p style="font-size:16px;line-height:28px;color:#3d3d3d;margin:0">This unsubscribe link is invalid or has expired.</p>',
      }),
      400,
    )
  }

  // Valid token below.
  if (isPost) {
    // Mail-client one-click POSTs here directly with body
    // 'List-Unsubscribe=One-Click' - we ignore the body; the token in the URL
    // is the auth.
    await ctx.runMutation(internal.email.recordUnsubscribe, { email, category })
    return htmlResponse(
      brandedPage({
        label: '// Unsubscribe',
        heading: "You've Been Unsubscribed",
        body: `<p style="font-size:16px;line-height:28px;color:#3d3d3d;margin:0">${escapeHtml(email)} will no longer receive ${label}. Your other email preferences are unchanged.</p>${preferencesLink(token ?? '')}`,
      }),
      200,
    )
  }

  // GET on a valid token - confirm page, NO DB write.
  return htmlResponse(
    brandedPage({
      label: '// Unsubscribe',
      heading: 'Unsubscribe?',
      body: `<p style="font-size:16px;line-height:28px;color:#3d3d3d;margin:0 0 32px">Stop receiving ${label} at <strong>${escapeHtml(email)}</strong>? Your other email preferences stay as they are.</p>
      <form method="POST" action="/api/email/unsubscribe?token=${token}&amp;category=${category}">
        <button type="submit" style="display:inline-block;padding:16px 32px;background-color:#a3e635;color:#0a1f02;border:none;text-decoration:none;font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace;font-size:15px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer">Unsubscribe</button>
      </form>${preferencesLink(token ?? '')}`,
    }),
    200,
  )
})
