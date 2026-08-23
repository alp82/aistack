#!/usr/bin/env node
/**
 * Drive one newsletter issue from the command line (#201, map #198).
 *
 * Issues are authored in `src/newsletter/issues.ts` and there is no compose
 * page (#202), so this script plus the admin Newsletter view are the whole
 * operator surface.
 *
 *   node scripts/newsletter.ts list
 *       Every authored issue and the state of its row on prod.
 *
 *   node scripts/newsletter.ts prepare <slug>
 *       Resolve the authored URLs against the item stream into a draft row, and
 *       name every URL that is missing, unapproved, or still undrafted.
 *       Idempotent: run it again after working the inbox.
 *
 *   node scripts/newsletter.ts preview <slug> [--out FILE]
 *       Write the exact HTML the send would put on the wire to a local file.
 *       Nothing is mailed. Defaults to drafts/newsletter/<slug>.html.
 *
 *   node scripts/newsletter.ts test <slug> --to you@example.com
 *       Send one [TEST] copy. Changes nothing in the database.
 *
 *   node scripts/newsletter.ts send <slug> --yes
 *       Send the issue to the newsletter audience, once. A sent issue is never
 *       edited, and a second send is refused. `--yes` is required.
 *
 * Plain `node` runs this, with no loader: Node 24 (see .nvmrc) strips the types
 * itself. That is also why the local import below carries its `.ts` extension.
 *
 * Every command goes through scripts/convex-prod.sh, like migrations: the
 * Convex CLI runs ON THE SERVER over ssh, and the admin key is minted there per
 * call. Never point the local CLI at prod.
 *
 * The Convex functions are INTERNAL. An admin key carries no user identity, so
 * the `isAdmin` gate on the admin newsletter functions would refuse it.
 */

import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lastJsonValue } from './lib/newsDrafts.ts'
import { NEWSLETTER_ISSUES } from '../src/newsletter/issues.ts'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const CONVEX_PROD = join(ROOT, 'scripts', 'convex-prod.sh')
const PREVIEW_DIR = join(ROOT, 'drafts', 'newsletter')

/**
 * Run one Convex function on prod and return what it gave back.
 *
 * stderr is printed as it stands, because the ssh hop and the admin-key mint
 * report their own progress there and the owner should see a stall.
 */
function runOnProd(fn: string, args: Record<string, unknown>): unknown {
  const result = spawnSync(CONVEX_PROD, ['run', fn, JSON.stringify(args)], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.status !== 0) {
    throw new Error(`convex-prod.sh run ${fn} exited ${result.status}`)
  }
  // The CLI has printed the value on one stream or the other across versions.
  const value = lastJsonValue(result.stdout) ?? lastJsonValue(result.stderr)
  if (value === null) {
    throw new Error(`no value came back from ${fn}:\n${result.stdout}`)
  }
  return value
}

function knownSlug(slug: string | undefined): string {
  if (!slug) throw new Error('which issue? pass a slug, e.g. issue-1')
  if (!NEWSLETTER_ISSUES.some((issue) => issue.slug === slug)) {
    const known = NEWSLETTER_ISSUES.map((i) => i.slug).join(', ')
    throw new Error(`no issue "${slug}" is authored. Known: ${known || '(none)'}`)
  }
  return slug
}

function flagValue(argv: string[], flag: string): string | undefined {
  const at = argv.indexOf(flag)
  return at === -1 ? undefined : argv[at + 1]
}

type PrepareReport = {
  ok: boolean
  message?: string
  slug: string
  number?: number
  resolved?: number
  missing?: string[]
  notApproved?: { url: string; state: string }[]
  undrafted?: string[]
}

type SendReport = {
  success: boolean
  sent: number
  failed: number
  suppressed?: number
  message?: string
  errors?: { email: string; error: string }[]
}

function commandList(): number {
  const rows = runOnProd('newsletter:listIssuesInternal', {}) as Array<{
    slug: string
    number: number
    subject: string
    status: string | null
    resolvedItems: number
    authoredItems: number
    sentAt?: number
    sentCount?: number
  }>
  if (rows.length === 0) {
    process.stdout.write('no issues authored in src/newsletter/issues.ts\n')
    return 0
  }
  for (const row of rows) {
    const state = row.status ?? 'not prepared'
    const sent = row.sentAt
      ? ` sent ${new Date(row.sentAt).toISOString().slice(0, 10)} to ${row.sentCount}`
      : ''
    process.stdout.write(
      `#${row.number} ${row.slug.padEnd(12)} ${state.padEnd(13)} ${row.resolvedItems}/${row.authoredItems} items${sent}\n  ${row.subject}\n`,
    )
  }
  return 0
}

function commandPrepare(slug: string): number {
  const report = runOnProd('newsletter:prepareIssue', { slug }) as PrepareReport
  if (report.message) process.stdout.write(`${report.message}\n`)
  process.stdout.write(
    `prepared #${report.number ?? '?'} ${report.slug}: ${report.resolved ?? 0} items resolved\n`,
  )
  for (const url of report.missing ?? []) {
    process.stdout.write(`  not collected  ${url}\n`)
  }
  for (const row of report.notApproved ?? []) {
    process.stdout.write(`  ${row.state.padEnd(14)} ${row.url}\n`)
  }
  for (const url of report.undrafted ?? []) {
    process.stdout.write(`  no summary     ${url}\n`)
  }
  return report.ok ? 0 : 1
}

function commandPreview(slug: string, out: string | undefined): number {
  const result = runOnProd('newsletter:renderIssueHtml', { slug }) as {
    found: boolean
    html?: string
  }
  if (!result.found || !result.html) {
    process.stderr.write(`no draft row for ${slug}. Run prepare first.\n`)
    return 1
  }
  const html = result.html
  const path = out ?? join(PREVIEW_DIR, `${slug}.html`)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, html, 'utf-8')
  process.stdout.write(`wrote ${path}\n`)
  return 0
}

function renderSend(report: SendReport): number {
  if (report.message) process.stdout.write(`${report.message}\n`)
  process.stdout.write(
    `sent ${report.sent}, failed ${report.failed}${
      typeof report.suppressed === 'number'
        ? `, opted out ${report.suppressed}`
        : ''
    }\n`,
  )
  for (const err of report.errors ?? []) {
    process.stdout.write(`  failed  ${err.email}: ${err.error}\n`)
  }
  return report.success ? 0 : 1
}

function commandTest(slug: string, to: string | undefined): number {
  if (!to) {
    process.stderr.write('which address? pass --to you@example.com\n')
    return 2
  }
  return renderSend(
    runOnProd('newsletter:sendIssue', { slug, testTo: to }) as SendReport,
  )
}

function commandSend(slug: string, confirmed: boolean): number {
  if (!confirmed) {
    process.stderr.write(
      'This mails every subscriber, and a sent issue is never edited.\n' +
        `Re-run with: node scripts/newsletter.ts send ${slug} --yes\n`,
    )
    return 2
  }
  return renderSend(runOnProd('newsletter:sendIssue', { slug }) as SendReport)
}

function main(): number {
  const argv = process.argv.slice(2)
  const command = argv[0]
  try {
    if (command === 'list') return commandList()
    if (command === 'prepare') return commandPrepare(knownSlug(argv[1]))
    if (command === 'preview') {
      return commandPreview(knownSlug(argv[1]), flagValue(argv, '--out'))
    }
    if (command === 'test') {
      return commandTest(knownSlug(argv[1]), flagValue(argv, '--to'))
    }
    if (command === 'send') {
      return commandSend(knownSlug(argv[1]), argv.includes('--yes'))
    }
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    return 1
  }
  process.stderr.write(
    'usage: newsletter.ts list\n' +
      '       newsletter.ts prepare <slug>\n' +
      '       newsletter.ts preview <slug> [--out FILE]\n' +
      '       newsletter.ts test <slug> --to you@example.com\n' +
      '       newsletter.ts send <slug> --yes\n',
  )
  return 2
}

process.exit(main())
