/**
 * Profile-first decoupling migration (Phase B).
 *
 * Run with: pnpm tsx scripts/migrate-profile-decoupling.ts [--give-up]
 *
 * Per creator: moves the most-recently-updated stack avatar onto the creator,
 * merges stack personalPageUrls into creators.personalPages, and clears the
 * dying stack identity fields. Creators with no storage-backed avatar but a
 * legacy `stackImageUrl` get an SSRF-guarded fetch → sharp → 512 WebP →
 * Convex storage upload folded in (finishing the deferred stack-image
 * backfill).
 *
 * Behaviour per creator:
 *   - most-recent stack avatarStorageId wins; creator avatar is skip-if-set
 *   - a failed image fetch still calls applyForCreator WITHOUT an upload:
 *     personalPages merge and the stack-avatar move proceed, but the stack
 *     keeps `stackImageUrl` as the retry source (the creator shows the Google
 *     avatarUrl fallback meanwhile). Rerunning retries exactly those rows.
 *   - exits non-zero while any creator remains failed, so the prod checklist
 *     run makes dirtiness obvious. Phase C's schema narrow self-gates on it.
 *
 * Escape hatch (--give-up): permanently dead hosts (404, DNS-gone) would keep
 * rows dirty forever. A run with --give-up clears `stackImageUrl` WITHOUT an
 * upload for every creator whose fetch fails — logged loudly per creator. Use
 * only after normal reruns have stopped making progress, right before the
 * Phase C narrow.
 *
 * Idempotent: a second run reports every migrated creator as skipped.
 *
 * Auth: talks to Convex over HTTP via ConvexHttpClient with admin auth.
 *   - Self-hosted: set CONVEX_SELF_HOSTED_URL + CONVEX_SELF_HOSTED_ADMIN_KEY.
 *   - Local anonymous (`convex dev`): the script auto-reads
 *     `~/.convex/anonymous-convex-backend-state/<deployment>/config.json`
 *     when those env vars aren't set.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
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

const GIVE_UP = process.argv.includes('--give-up')

type Row = {
  creatorId: string
  name: string
  hasCreatorAvatar: boolean
  winningStackAvatarId: string | null
  fallbackImageUrl: string | null
  needsWork: boolean
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
    internal.migrations.profileDecoupling.generateUploadUrl,
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

/**
 * Fetch + convert + upload the fallback stackImageUrl. A data URI is decoded
 * inline; an http(s) URL goes through the SSRF-guarded fetch. Returns null on
 * failure (the creator stays retryable).
 */
async function tryUploadFallback(row: Row): Promise<string | null> {
  const url = row.fallbackImageUrl
  if (!url) return null
  try {
    let inputBuffer: Buffer
    if (url.startsWith('data:')) {
      const match = url.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) throw new Error('Invalid data URI shape')
      inputBuffer = Buffer.from(match[2], 'base64')
    } else {
      inputBuffer = await fetchWithTimeout(url)
    }
    const webp = await toWebP(inputBuffer)
    return await uploadToStorage(webp)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`  ${row.name} — image fetch/upload failed: ${message}`)
    return null
  }
}

// --- Per-creator processing -------------------------------------------------

async function processRow(
  row: Row,
): Promise<'ok' | 'skipped' | 'failed' | 'gave-up'> {
  if (!row.needsWork && row.hasCreatorAvatar) return 'skipped'
  if (!row.needsWork && !row.fallbackImageUrl) return 'skipped'

  let uploadedStorageId: string | null = null
  let fetchFailed = false
  if (row.fallbackImageUrl) {
    uploadedStorageId = await tryUploadFallback(row)
    fetchFailed = uploadedStorageId === null
  }

  const giveUpThisRow = fetchFailed && GIVE_UP
  if (giveUpThisRow) {
    console.warn(
      `  ${row.name} — GIVING UP on dead stackImageUrl (${row.fallbackImageUrl}); clearing without an avatar`,
    )
  }

  try {
    await client.mutation(internal.migrations.profileDecoupling.applyForCreator, {
      creatorId: row.creatorId as Id<'creators'>,
      ...(uploadedStorageId
        ? { uploadedStorageId: uploadedStorageId as Id<'_storage'> }
        : {}),
      ...(giveUpThisRow ? { giveUpImageUrl: true } : {}),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`  ${row.name} — applyForCreator failed: ${message}`)
    return 'failed'
  }

  if (giveUpThisRow) return 'gave-up'
  if (fetchFailed) {
    // personalPages merge + stack-avatar move went through, but the creator
    // keeps stackImageUrl as the retry source — rerun to retry.
    return 'failed'
  }
  console.log(`  ${row.name} — ok`)
  return 'ok'
}

async function main(): Promise<void> {
  console.log(
    `Profile-decoupling migration starting${GIVE_UP ? ' (--give-up: dead stackImageUrls will be cleared)' : ''}...`,
  )
  const rows = (await client.query(
    internal.migrations.profileDecoupling.listCreatorsToMigrate,
    {},
  )) as Row[]
  console.log(`[creators] ${rows.length} creators total`)
  let ok = 0
  let skipped = 0
  let failed = 0
  let gaveUp = 0
  const failedNames: string[] = []
  for (const row of rows) {
    const result = await processRow(row)
    if (result === 'ok') ok++
    else if (result === 'skipped') skipped++
    else if (result === 'gave-up') gaveUp++
    else {
      failed++
      failedNames.push(row.name)
    }
  }
  console.log(
    `[creators] summary — ok: ${ok}, skipped: ${skipped}, failed: ${failed}, gave-up: ${gaveUp}`,
  )
  if (failed > 0) {
    console.error(
      `\nFAILED creators (stackImageUrl kept as retry source — rerun to retry, or use --give-up for permanently dead hosts):`,
    )
    for (const name of failedNames) console.error(`  - ${name}`)
    process.exit(1)
  }
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
