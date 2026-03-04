import { betterAuth } from 'better-auth'
import { magicLink } from 'better-auth/plugins'
import { createClient } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
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
import { components } from './_generated/api'

const siteUrl = process.env.SITE_URL!

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    trustedOrigins: [process.env.APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3019'],
    database: authComponent.adapter(ctx),
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
