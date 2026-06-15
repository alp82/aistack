/**
 * One-shot stack-avatar backfill.
 *
 * Run with: pnpm tsx scripts/migrate-stack-images.ts
 *
 * Migrates the legacy user-controlled `stackImageUrl` column into a
 * storage-backed `avatarStorageId` so the read path never server-fetches an
 * attacker-controlled URL (SSRF close-out).
 *
 * Behaviour per row:
 *   - skip if `avatarStorageId` is already set
 *   - skip if `stackImageUrl` is empty
 *   - if `stackImageUrl.startsWith('data:')`: decode base64 -> sharp -> upload
 *     -> patch row (set avatarStorageId, clear stackImageUrl)
 *   - else (http(s) URL): guarded fetch (SSRF-safe, 8s timeout) -> sharp
 *     -> upload -> patch row (set avatarStorageId, clear stackImageUrl)
 *   - fetch failure: log + leave the row untouched (avatarStorageId stays null)
 *
 * Idempotent: a second run reports every migrated row as skipped.
 *
 * DEPLOY ORDERING (two-phase): deploy the widen-phase code FIRST, then run this
 * backfill PROMPTLY. The read resolvers (getBySlug/listPublished) no longer fall
 * back to `stackImageUrl` (to keep the SSRF closed), so between the widen deploy
 * and this backfill, stacks with a legacy `stackImageUrl` show the creator-avatar
 * /initials fallback instead of their uploaded image. The narrow phase (dropping
 * the `stackImageUrl` column) runs only after this backfill completes.
 *
 * Auth: talks to Convex over HTTP via ConvexHttpClient with admin auth.
 *   - Self-hosted: set CONVEX_SELF_HOSTED_URL + CONVEX_SELF_HOSTED_ADMIN_KEY.
 *   - Local anonymous (`convex dev`): the script auto-reads
 *     `~/.convex/anonymous-convex-backend-state/<deployment>/config.json`
 *     when those env vars aren't set.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { ConvexHttpClient } from 'convex/browser'
import sharp from 'sharp'
import { internal } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { assertSafePublicUrl } from '../src/lib/ssrfGuard'

const MAX_DIM = 512
const WEBP_QUALITY = 80
const MAX_INPUT_PIXELS = 4096 * 4096
const FETCH_TIMEOUT_MS = 8000
const MAX_REDIRECTS = 3

type Row = {
  _id: string
  name: string
  stackImageUrl?: string
  avatarStorageId?: string
}

// --- Env / auth resolution --------------------------------------------------

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
  const dirs = readdirSync(stateDir, { withFileTypes: true }).filter(
    (d) => d.isDirectory(),
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

function resolveAuth(): { url: string; adminKey: string } {
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

const auth = resolveAuth()
const httpClient = new ConvexHttpClient(auth.url)
// `setAdminAuth` is a runtime method on ConvexHttpClient (visible in compiled
// JS) but not exported in the public TS types. Same for invoking internal
// functions: the typed `query`/`mutation` only accept public refs, but at
// runtime the admin-auth header lets internal refs through. Cast once.
const client = httpClient as unknown as {
  setAdminAuth: (key: string) => void
  // biome-ignore lint/suspicious/noExplicitAny: internal-fn polymorphism
  query: (fn: any, args: Record<string, unknown>) => Promise<any>
  // biome-ignore lint/suspicious/noExplicitAny: internal-fn polymorphism
  mutation: (fn: any, args: Record<string, unknown>) => Promise<any>
}
client.setAdminAuth(auth.adminKey)

// --- Image pipeline --------------------------------------------------------

async function toWebP(input: Buffer): Promise<Buffer> {
  return sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
    .resize(MAX_DIM, MAX_DIM, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
}

async function fetchWithTimeout(rawUrl: string): Promise<Buffer> {
  let currentUrl = rawUrl
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await assertSafePublicUrl(currentUrl)
    const response = await fetch(currentUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'manual',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; AIStack-iconbot/1.0; +https://aistack.to)',
        Accept: 'image/*,*/*;q=0.8',
      },
    })
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) {
        throw new Error(`Redirect ${response.status} without Location header`)
      }
      currentUrl = new URL(location, currentUrl).toString()
      continue
    }
    if (!response.ok) {
      throw new Error(
        `${response.status} ${response.statusText} — ${currentUrl.slice(0, 80)}`,
      )
    }
    const ab = await response.arrayBuffer()
    return Buffer.from(ab)
  }
  throw new Error(`Too many redirects (max ${MAX_REDIRECTS})`)
}

async function uploadToStorage(webpBuffer: Buffer): Promise<string> {
  const uploadUrl = await client.mutation(
    internal.migrations.stackImages.generateUploadUrl,
    {},
  )
  const resp = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'image/webp' },
    body: new Uint8Array(webpBuffer),
  })
  if (!resp.ok) {
    throw new Error(`Storage POST failed: ${resp.status} ${resp.statusText}`)
  }
  const data = (await resp.json()) as { storageId?: string }
  if (!data.storageId) throw new Error('Storage POST missing storageId')
  return data.storageId
}

// --- Per-row processing -----------------------------------------------------

async function processRow(row: Row): Promise<'ok' | 'skipped' | 'failed'> {
  if (row.avatarStorageId) return 'skipped'
  if (!row.stackImageUrl) return 'skipped'

  const isDataURI = row.stackImageUrl.startsWith('data:')

  let inputBuffer: Buffer
  try {
    if (isDataURI) {
      const match = row.stackImageUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) throw new Error('Invalid data URI shape')
      inputBuffer = Buffer.from(match[2], 'base64')
    } else {
      inputBuffer = await fetchWithTimeout(row.stackImageUrl)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`  ${row.name} — fetch failed: ${message}`)
    return 'failed'
  }

  let webp: Buffer
  try {
    webp = await toWebP(inputBuffer)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`  ${row.name} — sharp failed: ${message}`)
    return 'failed'
  }

  let storageId: string
  try {
    storageId = await uploadToStorage(webp)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`  ${row.name} — upload failed: ${message}`)
    return 'failed'
  }

  try {
    await client.mutation(internal.migrations.stackImages.patchStackAvatar, {
      stackId: row._id as Id<'stacks'>,
      avatarStorageId: storageId as Id<'_storage'>,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`  ${row.name} — patch failed: ${message}`)
    return 'failed'
  }

  console.log(`  ${row.name} — ok (${webp.byteLength} bytes, cleared stackImageUrl)`)
  return 'ok'
}

async function main(): Promise<void> {
  console.log('Stack-image migration starting...')
  const rows = (await client.query(
    internal.migrations.stackImages.listStacksToMigrate,
    {},
  )) as Row[]
  console.log(`[stacks] ${rows.length} rows to migrate`)
  let ok = 0
  let skipped = 0
  let failed = 0
  for (const row of rows) {
    const result = await processRow(row)
    if (result === 'ok') ok++
    else if (result === 'skipped') skipped++
    else failed++
  }
  console.log(`[stacks] summary — ok: ${ok}, skipped: ${skipped}, failed: ${failed}`)
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
