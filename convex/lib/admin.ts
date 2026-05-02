/**
 * Centralized admin allowlist + isAdmin helper.
 * Imported by convex/admin.ts, convex/iconStorage.ts, convex/iconReports.ts.
 */

export const ADMIN_EMAILS = ['alportac@gmail.com']

export async function isAdmin(ctx: {
  auth: { getUserIdentity: () => Promise<{ email?: string } | null> }
}): Promise<boolean> {
  const user = await ctx.auth.getUserIdentity()
  if (!user) return false
  if (user.email && ADMIN_EMAILS.includes(user.email)) return true
  // Dev-only admin access via Convex IS_DEV env var
  // (process.env.NODE_ENV is always 'production' in Convex runtime, even during local dev)
  if (user.email === 'dev-admin@example.com' && process.env.IS_DEV === 'true') {
    return true
  }
  return false
}
