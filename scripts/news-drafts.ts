#!/usr/bin/env node
/**
 * The two ends of a news drafting run (#233, map #198).
 *
 * Spec: the Drafting section of docs/specs/news-pipeline.md. Decision:
 * docs/adr/0003-news-drafting-in-the-owner-session.md. The skill that sits
 * between these two commands is .claude/skills/news-draft.
 *
 *   node scripts/news-drafts.ts list [--limit 20]
 *       Print the undrafted inbox items and the topic list, as JSON. The
 *       drafting skill reads this and writes one file per item.
 *
 *   node scripts/news-drafts.ts apply [--dry-run]
 *       Write every merged draft file into its inbox row, print a per-item
 *       report, and delete the files that were applied.
 *
 * Plain `node` runs this, with no loader: Node 24 (see .nvmrc) strips the types
 * itself. That is also why the local import below carries its `.ts` extension.
 *
 * Both commands go through scripts/convex-prod.sh, like migrations: the Convex
 * CLI runs ON THE SERVER over ssh, and the admin key is minted there per call.
 * Never point the local CLI at prod.
 *
 * The Convex functions are INTERNAL. An admin key carries no user identity, so
 * the isAdmin gate on the public news functions would refuse it.
 */

import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  type ApplyReport,
  type ParsedDraft,
  type RejectedDraft,
  lastJsonValue,
  parseDraftFile,
  renderReport,
} from './lib/newsDrafts.ts'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const DRAFT_DIR = join(ROOT, 'drafts', 'news')
const CONVEX_PROD = join(ROOT, 'scripts', 'convex-prod.sh')

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

function commandList(limit: number | null): void {
  const batch = runOnProd(
    'newsDrafting:undrafted',
    limit === null ? {} : { limit },
  )
  process.stdout.write(`${JSON.stringify(batch, null, 2)}\n`)
}

function readDrafts(): {
  good: ParsedDraft[]
  bad: RejectedDraft[]
} {
  const good: ParsedDraft[] = []
  const bad: RejectedDraft[] = []
  if (!existsSync(DRAFT_DIR)) return { good, bad }
  const files = readdirSync(DRAFT_DIR)
    .filter((name) => name.endsWith('.md'))
    .sort()
  for (const file of files) {
    const parsed = parseDraftFile(
      readFileSync(join(DRAFT_DIR, file), 'utf-8'),
      file,
    )
    if (parsed.ok) good.push(parsed)
    else bad.push(parsed)
  }
  return { good, bad }
}

/**
 * Apply every merged draft, then delete the files that landed.
 *
 * A file is deleted ONLY on the `applied` outcome. A skip leaves the file where
 * it is, so the owner can read what the run would have written and decide.
 *
 * A malformed file never stops the batch. It is reported and left in place.
 */
function commandApply(dryRun: boolean): number {
  const { good, bad } = readDrafts()

  for (const rejected of bad) {
    process.stdout.write(`refused         ${rejected.file}: ${rejected.error}\n`)
  }
  if (good.length === 0) {
    process.stdout.write('no drafts to apply\n')
    return bad.length > 0 ? 1 : 0
  }

  if (dryRun) {
    for (const draft of good) {
      process.stdout.write(
        `would apply     ${draft.headline ?? draft.itemId} [${draft.topic}]\n`,
      )
    }
    process.stdout.write(`${good.length} would apply, 0 written\n`)
    return bad.length > 0 ? 1 : 0
  }

  const report = runOnProd('newsDrafting:applyDrafts', {
    drafts: good.map((draft) => ({
      itemId: draft.itemId,
      summary: draft.summary,
      topic: draft.topic,
    })),
  }) as ApplyReport

  const byItemId = new Map(good.map((draft) => [draft.itemId, draft]))
  for (const result of report.results) {
    if (result.outcome !== 'applied') continue
    const draft = byItemId.get(result.itemId)
    if (draft) rmSync(join(DRAFT_DIR, draft.file))
  }

  for (const line of renderReport(report)) process.stdout.write(`${line}\n`)
  return bad.length > 0 ? 1 : 0
}

function main(): number {
  const argv = process.argv.slice(2)
  const command = argv[0]
  if (command === 'list') {
    const at = argv.indexOf('--limit')
    commandList(at === -1 ? null : Number(argv[at + 1]))
    return 0
  }
  if (command === 'apply') {
    return commandApply(argv.includes('--dry-run'))
  }
  process.stderr.write(
    'usage: news-drafts.ts list [--limit N] | apply [--dry-run]\n',
  )
  return 2
}

process.exit(main())
