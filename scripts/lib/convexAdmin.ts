/**
 * Admin-authenticated Convex client for one-shot migration scripts.
 *
 * Extracted from scripts/migrate-icons.ts when the second migration script
 * (#38's cliTokens.stackId relink) would otherwise have copied it: two
 * divergent copies of a credential-resolution path is exactly the thing that
 * drifts into "works on my machine, silently wrong in prod".
 *
 * Resolution order:
 *   1. `CONVEX_SELF_HOSTED_URL` + `CONVEX_SELF_HOSTED_ADMIN_KEY` (or
 *      `CONVEX_URL` + `CONVEX_DEPLOY_KEY`), read from the shell or .env.local.
 *   2. The running `convex dev` anonymous backend's own config.json.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { ConvexHttpClient } from 'convex/browser'

function loadDotenvLocal(): void {
  const path = join(process.cwd(), '.env.local')
  if (!existsSync(path)) return
  const raw = readFileSync(path, 'utf-8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

function readAnonymousBackendConfig(): { url: string; adminKey: string } | null {
  const stateDir = join(homedir(), '.convex', 'anonymous-convex-backend-state')
  if (!existsSync(stateDir)) return null
  const dirs = readdirSync(stateDir, { withFileTypes: true }).filter((d) =>
    d.isDirectory(),
  )
  if (dirs.length === 0) return null
  // Prefer a directory whose name matches the project root, fall back to the only one.
  const projectName = process.cwd().split('/').pop() ?? ''
  const matching = dirs.find((d) => d.name.includes(projectName)) ?? dirs[0]
  const cfgPath = join(stateDir, matching.name, 'config.json')
  if (!existsSync(cfgPath)) return null
  try {
    const cfg = JSON.parse(readFileSync(cfgPath, 'utf-8')) as {
      ports?: { cloud?: number }
      adminKey?: string
    }
    if (!cfg.adminKey || !cfg.ports?.cloud) return null
    return {
      url: `http://127.0.0.1:${cfg.ports.cloud}`,
      adminKey: cfg.adminKey,
    }
  } catch {
    return null
  }
}

export function resolveConvexAuth(): { url: string; adminKey: string } {
  loadDotenvLocal()
  const url = process.env.CONVEX_SELF_HOSTED_URL ?? process.env.CONVEX_URL
  const adminKey =
    process.env.CONVEX_SELF_HOSTED_ADMIN_KEY ?? process.env.CONVEX_DEPLOY_KEY
  if (url && adminKey) return { url, adminKey }
  const local = readAnonymousBackendConfig()
  if (local) {
    console.log(
      `[auth] using local anonymous backend at ${local.url} (config.json adminKey)`,
    )
    return local
  }
  throw new Error(
    'No Convex credentials found. Set CONVEX_SELF_HOSTED_URL + CONVEX_SELF_HOSTED_ADMIN_KEY in .env.local or your shell, or run `npx convex dev` to start an anonymous local backend.',
  )
}

/**
 * `setAdminAuth` is a runtime method on ConvexHttpClient (visible in compiled
 * JS) but not exported in the public TS types. Same for invoking internal
 * functions: the typed `query`/`mutation` only accept public refs, but at
 * runtime the admin-auth header lets internal refs through. Cast once, here.
 */
export type AdminConvexClient = {
  setAdminAuth: (key: string) => void
  // biome-ignore lint/suspicious/noExplicitAny: internal-fn polymorphism
  query: (fn: any, args: Record<string, unknown>) => Promise<any>
  // biome-ignore lint/suspicious/noExplicitAny: internal-fn polymorphism
  mutation: (fn: any, args: Record<string, unknown>) => Promise<any>
}

export function createAdminClient(): {
  client: AdminConvexClient
  url: string
} {
  const auth = resolveConvexAuth()
  const httpClient = new ConvexHttpClient(auth.url)
  const client = httpClient as unknown as AdminConvexClient
  client.setAdminAuth(auth.adminKey)
  return { client, url: auth.url }
}
