/**
 * One-shot icon backfill.
 *
 * Run with: pnpm tsx scripts/migrate-icons.ts
 *
 * Behaviour per row:
 *   - skip if `iconStorageId` is already set
 *   - skip if `iconUrl` is empty
 *   - if `iconUrl.startsWith('data:')`: decode base64 -> sharp -> upload
 *     -> patch row (set iconStorageId, clear iconUrl)
 *   - else (http URL): fetch with 8s timeout -> sharp -> upload
 *     -> patch row (set iconStorageId, KEEP iconUrl as source)
 *
 * Idempotent: a second run reports every row as skipped.
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
import decodeIco from 'decode-ico'
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
  iconUrl?: string
  iconStorageId?: string
}

type Table = 'tools' | 'models' | 'bundles'

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
  const matching =
    dirs.find((d) => d.name.includes(projectName)) ?? dirs[0]
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
const client = new ConvexHttpClient(auth.url)
client.setAdminAuth(auth.adminKey)

// --- Image pipeline --------------------------------------------------------

async function toWebP(input: Buffer): Promise<Buffer> {
  const buf = isIco(input) ? await decodeIcoToSharpInput(input) : input
  return sharp(buf, { limitInputPixels: MAX_INPUT_PIXELS })
    .resize(MAX_DIM, MAX_DIM, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
}

function isIco(buf: Buffer): boolean {
  return (
    buf.length >= 6 &&
    buf[0] === 0x00 &&
    buf[1] === 0x00 &&
    buf[2] === 0x01 &&
    buf[3] === 0x00
  )
}

async function decodeIcoToSharpInput(buf: Buffer): Promise<Buffer> {
  const entries = decodeIco(buf)
  if (entries.length === 0) throw new Error('ICO contains no images')
  const largest = entries.reduce((a, b) =>
    a.width * a.height >= b.width * b.height ? a : b,
  )
  if (largest.type === 'png') {
    return Buffer.from(
      largest.data.buffer,
      largest.data.byteOffset,
      largest.data.byteLength,
    )
  }
  return await sharp(
    Buffer.from(
      largest.data.buffer,
      largest.data.byteOffset,
      largest.data.byteLength,
    ),
    { raw: { width: largest.width, height: largest.height, channels: 4 } },
  )
    .png()
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
    internal.migrations.icons.generateUploadUrl,
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

// --- Per-row + per-table processing ----------------------------------------

async function processRow(
  table: Table,
  row: Row,
): Promise<'ok' | 'skipped' | 'failed'> {
  if (row.iconStorageId) return 'skipped'
  if (!row.iconUrl) return 'skipped'

  const isDataURI = row.iconUrl.startsWith('data:')

  let inputBuffer: Buffer
  try {
    if (isDataURI) {
      const match = row.iconUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) throw new Error('Invalid data URI shape')
      inputBuffer = Buffer.from(match[2], 'base64')
    } else {
      inputBuffer = await fetchWithTimeout(row.iconUrl)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`  [${table}] ${row.name} — fetch failed: ${message}`)
    return 'failed'
  }

  let webp: Buffer
  try {
    webp = await toWebP(inputBuffer)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`  [${table}] ${row.name} — sharp failed: ${message}`)
    return 'failed'
  }

  let storageId: string
  try {
    storageId = await uploadToStorage(webp)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`  [${table}] ${row.name} — upload failed: ${message}`)
    return 'failed'
  }

  try {
    const args: {
      table: Table
      iconStorageId: Id<'_storage'>
      clearIconUrl?: boolean
      toolId?: Id<'tools'>
      modelId?: Id<'models'>
      bundleId?: Id<'bundles'>
    } = {
      table,
      iconStorageId: storageId as Id<'_storage'>,
      clearIconUrl: isDataURI,
    }
    if (table === 'tools') args.toolId = row._id as Id<'tools'>
    else if (table === 'models') args.modelId = row._id as Id<'models'>
    else args.bundleId = row._id as Id<'bundles'>
    await client.mutation(internal.migrations.icons.patchIcon, args)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`  [${table}] ${row.name} — patch failed: ${message}`)
    return 'failed'
  }

  console.log(
    `  [${table}] ${row.name} — ok (${webp.byteLength} bytes${isDataURI ? ', cleared iconUrl' : ', kept iconUrl'})`,
  )
  return 'ok'
}

async function processTable(
  table: Table,
  listFn:
    | typeof internal.migrations.icons.listToolsToMigrate
    | typeof internal.migrations.icons.listModelsToMigrate
    | typeof internal.migrations.icons.listBundlesToMigrate,
): Promise<void> {
  const rows = (await client.query(listFn, {})) as Row[]
  console.log(`\n[${table}] ${rows.length} rows`)
  let ok = 0
  let skipped = 0
  let failed = 0
  for (const row of rows) {
    const result = await processRow(table, row)
    if (result === 'ok') ok++
    else if (result === 'skipped') skipped++
    else failed++
  }
  console.log(
    `[${table}] summary — ok: ${ok}, skipped: ${skipped}, failed: ${failed}`,
  )
}

async function main(): Promise<void> {
  console.log('Icon migration starting...')
  await processTable('tools', internal.migrations.icons.listToolsToMigrate)
  await processTable('models', internal.migrations.icons.listModelsToMigrate)
  await processTable('bundles', internal.migrations.icons.listBundlesToMigrate)
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
