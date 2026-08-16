// Server-side PostHog capture (#77, map #76).
//
// Four of the seven product events fire on transitions the browser cannot
// honestly observe - a signup completing, a CLI storing a token, a first sync
// landing, a machine turning auto-sync on. Keeping them client-side would ship
// four wrong numbers, and a funnel with a wrong number is worse than a funnel
// with fewer steps.
//
// The CLI gets no PostHog SDK. It reports state to the aistack backend, which
// it already talks to, and Convex emits the event. One network destination.
//
// Convex mutations are deterministic and cannot call `fetch`, so a mutation
// SCHEDULES the capture rather than performing it. Nothing here is ever read
// back by the app: PostHog is the funnel, not a data source.

import { v } from 'convex/values'
import { internalAction, internalMutation } from './_generated/server'
import { internal } from './_generated/api'
import type { MutationCtx } from './_generated/server'

/**
 * The four events the server owns. Closed on purpose - the three client events
 * (`stack_created`, `stack_published`, `leaderboard_stack_clicked`) go through
 * posthog-js in the browser and never reach here.
 */
export const ServerEvent = v.union(
  v.literal('signup_completed'),
  v.literal('cli_login_completed'),
  v.literal('first_sync_completed'),
  v.literal('auto_sync_enabled')
)

export type ServerEventName =
  | 'signup_completed'
  | 'cli_login_completed'
  | 'first_sync_completed'
  | 'auto_sync_enabled'

const PropertyValue = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
  v.array(v.string())
)

const Properties = v.record(v.string(), PropertyValue)

export type EventProperties = Record<
  string,
  string | number | boolean | null | string[]
>

/**
 * Fire a product event from inside a mutation.
 *
 * `distinctId` MUST be the same user id posthog-js identifies the browser with,
 * or the funnel breaks into two strangers. The web calls
 * `posthog.identify(userId)` once authenticated, which aliases the pre-signup
 * anonymous id, and every server capture reuses that id.
 *
 * Scheduled at delay 0, so it rides the mutation's transaction: a mutation that
 * throws never emits, and a mutation that commits always does.
 */
export async function captureServerEvent(
  ctx: MutationCtx,
  event: ServerEventName,
  distinctId: string,
  properties: EventProperties = {}
): Promise<void> {
  await ctx.scheduler.runAfter(0, internal.analytics.capture, {
    event,
    distinctId,
    properties,
  })
}

/**
 * Signup, from the better-auth user-create hook.
 *
 * A mutation and not a direct capture, because the hook holds an auth context
 * rather than a Convex mutation context - this is the seam that turns one into
 * the other.
 *
 * `method` is derived from the request path, so a provider added later reports
 * its own name without a code change here.
 */
export const recordSignup = internalMutation({
  args: { userId: v.string(), method: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await captureServerEvent(ctx, 'signup_completed', args.userId, {
      method: args.method,
    })
    return null
  },
})

/**
 * Name the signup method from the better-auth request path.
 *
 * `/sign-up/email` → `email`, `/callback/google` → `google`,
 * `/magic-link/verify` → `magic-link`. An unrecognized path reports `unknown`
 * rather than guessing, because a wrong label in a funnel is worse than a
 * missing one.
 */
export function signupMethodFromPath(path: string | undefined): string {
  if (!path) return 'unknown'
  const segments = path.split('/').filter(Boolean)
  if (segments[0] === 'sign-up' && segments[1]) return segments[1]
  if (segments[0] === 'callback' && segments[1]) return segments[1]
  if (segments[0] === 'sign-in' && segments[1]) return segments[1]
  if (segments[0] === 'magic-link') return 'magic-link'
  return 'unknown'
}

/**
 * POST one event to PostHog.
 *
 * A failure LOGS and returns. It never throws, because a dropped analytics
 * event must not retry-loop a scheduled function, and the mutation that
 * scheduled it has already committed - there is nothing left to undo.
 */
export const capture = internalAction({
  args: {
    event: ServerEvent,
    distinctId: v.string(),
    properties: Properties,
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const key = process.env.POSTHOG_PROJECT_API_KEY
    const host = process.env.POSTHOG_HOST
    if (!key || !host) {
      // Not configured - local dev and the test backend both land here. Say so
      // once per event rather than failing a real user action over telemetry.
      console.log(
        `[analytics] POSTHOG_PROJECT_API_KEY/POSTHOG_HOST unset, dropping ${args.event}`
      )
      return null
    }

    try {
      const response = await fetch(`${host.replace(/\/+$/, '')}/i/v0/e/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: key,
          event: args.event,
          distinct_id: args.distinctId,
          properties: args.properties,
          timestamp: new Date().toISOString(),
        }),
      })
      if (!response.ok) {
        console.error(
          `[analytics] PostHog rejected ${args.event}: ${response.status}`
        )
      }
    } catch (err) {
      console.error(`[analytics] PostHog capture failed for ${args.event}:`, err)
    }
    return null
  },
})
