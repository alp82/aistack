import { betterAuth } from 'better-auth'
import { lastLoginMethod, magicLink } from 'better-auth/plugins'
import { createClient } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { v } from 'convex/values'
import authConfig from './auth.config'
import { query } from './_generated/server'
import type { GenericCtx } from '@convex-dev/better-auth'
import type { DataModel } from './_generated/dataModel'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { VerifyEmail } from '../src/emails/VerifyEmail'
import { ResetPasswordEmail } from '../src/emails/ResetPasswordEmail'
import { MagicLinkEmail } from '../src/emails/MagicLinkEmail'

// @ts-ignore - components will be generated after convex dev restarts
import { components, internal } from './_generated/api'
import { signupMethodFromPath } from './analytics'

const appUrl = process.env.APP_URL || process.env.BETTER_AUTH_URL!

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: appUrl,
    trustedOrigins: [process.env.APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3019'],
    database: authComponent.adapter(ctx),
    databaseHooks: {
      user: {
        create: {
          /**
           * `signup_completed` (#77, map #76). Server-side, because the browser
           * cannot honestly observe this transition - an OAuth callback and a
           * magic-link verify both create the user without the app ever seeing
           * a "signup succeeded" moment it could trust.
           *
           * The user id becomes the PostHog `distinct_id`, which is the same id
           * posthog-js identifies the browser with once authenticated. That is
           * what keeps the client and server halves of the funnel one person.
           *
           * Fails SILENTLY. A telemetry seam must never be able to fail a
           * signup, and by the time this runs the user row already exists.
           */
          after: async (user, context) => {
            try {
              const runMutation = (
                ctx as { runMutation?: (ref: unknown, args: unknown) => Promise<unknown> }
              ).runMutation
              if (typeof runMutation !== 'function') return
              await runMutation(internal.analytics.recordSignup, {
                userId: user.id,
                method: signupMethodFromPath(context?.path ?? undefined),
              })
            } catch (err) {
              console.error('[auth] signup_completed capture failed:', err)
            }
          },
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
        const resend = new Resend(process.env.RESEND_API_KEY!)
        const html = await render(
          ResetPasswordEmail({ productName: 'AI Stack', resetUrl: url })
        )
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
          to: user.email,
          subject: 'Reset your AI Stack password',
          html,
        })
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
        console.log('[auth] sendVerificationEmail called for:', user.email)
        try {
          const resend = new Resend(process.env.RESEND_API_KEY!)
          const html = await render(
            VerifyEmail({ productName: 'AI Stack', verifyUrl: url })
          )
          const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: user.email,
            subject: 'Verify your AI Stack email',
            html,
          })
          if (error) {
            console.error('[auth] Resend error sending verification email:', error)
          } else {
            console.log('[auth] Verification email sent successfully, id:', data?.id)
          }
        } catch (err) {
          console.error('[auth] Exception sending verification email:', err)
        }
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      },
      github: {
        clientId: process.env.GITHUB_OAUTH_CLIENT_ID!,
        clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET!,
      },
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }: { email: string; url: string }) => {
          console.log('[auth] sendMagicLink called for:', email)
          try {
            const resend = new Resend(process.env.RESEND_API_KEY!)
            const html = await render(
              MagicLinkEmail({ productName: 'AI Stack', magicLinkUrl: url })
            )
            const { data, error } = await resend.emails.send({
              from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
              to: email,
              subject: 'Sign in to AI Stack',
              html,
            })
            if (error) {
              console.error('[auth] Resend error sending magic link:', error)
            } else {
              console.log('[auth] Magic link email sent successfully, id:', data?.id)
            }
          } catch (err) {
            console.error('[auth] Exception sending magic link:', err)
          }
        },
      }),
      lastLoginMethod({
        customResolveMethod: (ctx) =>
          ctx.path === '/magic-link/verify' ? 'magic-link' : null,
      }),
      convex({ authConfig }),
    ],
  })
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.getAuthUser(ctx)
  },
})

/**
 * The viewer's user id - the SAME string every server-side capture uses as its
 * PostHog `distinct_id` (#77).
 *
 * It has to be this exact value and not the creator profile id: the four
 * server events are keyed on `tokenIdentifier.split('|')[1]`, and a browser
 * identified under any other id splits the funnel into two strangers.
 */
export const getViewerId = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) return null
    return user.tokenIdentifier.split('|')[1] ?? null
  },
})

/**
 * Lightweight auth-presence check used by server routes that need to gate
 * authenticated users without leaking admin-only details. Returns true iff
 * the request carries a valid Convex auth identity.
 */
export const isAuthenticated = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    return (await ctx.auth.getUserIdentity()) !== null
  },
})
