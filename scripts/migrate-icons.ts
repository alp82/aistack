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
 * Auth: the script calls internal mutations/queries via `npx convex run`,
 * which uses the local convex deploy credentials managed by the user's
 * running `convex dev`. No separate admin key is required.
 */

import { execFileSync } from 'node:child_process'
import decodeIco from 'decode-ico'
import sharp from 'sharp'
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

// Targets whichever deployment `convex` is configured to talk to:
//   • dev — the running `convex dev` process pushes code automatically.
//   • prod — set CONVEX_DEPLOYMENT=prod:<deploy-name> (or pass `--prod` via
//     CONVEX_RUN_ARGS), and `npx convex deploy --prod` first to ensure the
//     migration functions are present.
const EXTRA_ARGS = process.env.CONVEX_RUN_ARGS
  ? process.env.CONVEX_RUN_ARGS.split(/\s+/).filter(Boolean)
  : []

function runConvex(fn: string, args: Record<string, unknown>): unknown {
  const stdout = execFileSync(
    'npx',
    ['convex', 'run', ...EXTRA_ARGS, fn, JSON.stringify(args)],
    {
      stdio: ['ignore', 'pipe', 'inherit'],
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024 * 64,
    },
  )
  // `convex run` prints setup lines (e.g. "✔ Convex functions ready!") before
  // the function's return value. The return value is JSON, possibly multi-line
  // (indented arrays/objects). Find the first line starting with [, {, ", or a
  // bareword JSON literal, then parse from that offset to the end of stdout.
  const firstJsonLineRe = /^[ \t]*[\[{"]|^[ \t]*(true|false|null|-?\d)/m
  const match = firstJsonLineRe.exec(stdout)
  if (!match) {
    return null
  }
  const candidate = stdout.slice(match.index).trim()
  try {
    return JSON.parse(candidate)
  } catch {
    return null
  }
}

function isIco(buf: Buffer): boolean {
  // ICONDIR header: reserved=0x0000, type=0x0001 (icon), count >= 1
  return (
    buf.length >= 6 &&
    buf[0] === 0x00 &&
    buf[1] === 0x00 &&
    buf[2] === 0x01 &&
    buf[3] === 0x00
  )
}

async function decodeIcoToSharpInput(buf: Buffer): Promise<Buffer> {
  // decode-ico returns one entry per stored size; pick the largest by area.
  const entries = decodeIco(buf)
  if (entries.length === 0) throw new Error('ICO contains no images')
  const largest = entries.reduce((a, b) =>
    a.width * a.height >= b.width * b.height ? a : b,
  )
  // PNG-typed entries are already PNG-encoded; raw is RGBA pixels.
  if (largest.type === 'png') {
    return Buffer.from(largest.data.buffer, largest.data.byteOffset, largest.data.byteLength)
  }
  return await sharp(Buffer.from(largest.data.buffer, largest.data.byteOffset, largest.data.byteLength), {
    raw: { width: largest.width, height: largest.height, channels: 4 },
  })
    .png()
    .toBuffer()
}

async function toWebP(input: Buffer): Promise<Buffer> {
  const buf = isIco(input) ? await decodeIcoToSharpInput(input) : input
  return sharp(buf, { limitInputPixels: MAX_INPUT_PIXELS })
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
  const uploadUrl = runConvex('migrations/icons:generateUploadUrl', {}) as string
  if (typeof uploadUrl !== 'string') {
    throw new Error(`generateUploadUrl returned ${JSON.stringify(uploadUrl)}`)
  }
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

async function processRow(table: Table, row: Row): Promise<'ok' | 'skipped' | 'failed'> {
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
    const patchArgs: Record<string, unknown> = {
      table,
      iconStorageId: storageId,
      clearIconUrl: isDataURI,
    }
    if (table === 'tools') patchArgs.toolId = row._id
    else if (table === 'models') patchArgs.modelId = row._id
    else patchArgs.bundleId = row._id
    runConvex('migrations/icons:patchIcon', patchArgs)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`  [${table}] ${row.name} — patch failed: ${message}`)
    return 'failed'
  }

  console.log(`  [${table}] ${row.name} — ok (${webp.byteLength} bytes${isDataURI ? ', cleared iconUrl' : ', kept iconUrl'})`)
  return 'ok'
}

async function processTable(table: Table, listFn: string): Promise<void> {
  const rows = runConvex(`migrations/icons:${listFn}`, {}) as Row[]
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
  console.log(`[${table}] summary — ok: ${ok}, skipped: ${skipped}, failed: ${failed}`)
}

async function main(): Promise<void> {
  console.log('Icon migration starting...')
  await processTable('tools', 'listToolsToMigrate')
  await processTable('models', 'listModelsToMigrate')
  await processTable('bundles', 'listBundlesToMigrate')
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
