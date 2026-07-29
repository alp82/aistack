/**
 * `cliTokens` hash + scopes narrow — the PHASE B driver.
 *
 * Run with: pnpm tsx scripts/migrate-cli-token-narrow.ts          (report only)
 *           pnpm tsx scripts/migrate-cli-token-narrow.ts --apply
 *
 * Wayfinder ticket #52 (map #29). This is the step BETWEEN two deploys, and it
 * exists because Convex validates every existing document against the new
 * schema on push: a row carrying a field the schema no longer declares, or
 * missing one it now requires, fails the whole push.
 *
 * WHY A SCRIPT AND NOT `npx convex run`. Production is self-hosted, and the
 * repo's documented path for reaching it is a `scripts/migrate-*.ts` driver over
 * `createAdminClient()` — the same shape as `migrate-cli-token-stack.ts` and
 * `migrate-icons.ts`. The CLI's `run` subcommand is the dev-backend path.
 *
 * DEPLOY ORDER, and none of it is optional:
 *
 *   1. Deploy the PRE-NARROW revision (commit 00fbdf0). It widens the schema so
 *      old rows still validate, and it is what puts the four functions below on
 *      the backend — you cannot run a migration that is not deployed.
 *   2. Run this script with --apply.
 *   3. Deploy the NARROW revision (commit 5efdc9a).
 *
 * The four steps run in a FIXED order:
 *
 *   hash backfill    the digest is derived FROM the plaintext
 *   scopes backfill  every pre-scopes token held a full grant already
 *   clearPlaintext   blanks `token` so the narrow can drop it
 *   purge keyless    clears pre-rename `apiRateLimits` rows
 *
 * Clearing before hashing would destroy the only input the digest can be
 * derived from and log every machine out permanently. `clearPlaintext` refuses
 * while any row is still unhashed for exactly that reason, so the order is
 * enforced on the server too, not just here.
 *
 * IDEMPOTENT. A second run reports everything already done and writes nothing.
 */

import { internal } from '../convex/_generated/api'
import { createAdminClient } from './lib/convexAdmin'

const APPLY = process.argv.includes('--apply')

const HASH = internal.migrations['20260729_cli_token_hash']
const SCOPES = internal.migrations['20260729_cli_token_scopes']

async function main(): Promise<void> {
  const { client, url } = createAdminClient()
  console.log(`[convex] ${url}`)

  const hashBefore = await client.query(HASH.report, {})
  const scopesBefore = await client.query(SCOPES.report, {})
  console.log('\nBEFORE')
  console.log(`  tokens total     ${hashBefore.total}`)
  console.log(`  hashed           ${hashBefore.hashed}`)
  console.log(`  unhashed         ${hashBefore.unhashed}`)
  console.log(`  scoped           ${scopesBefore.scoped}`)
  console.log(`  unscoped         ${scopesBefore.unscoped}`)

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to write.')
    return
  }

  // 1. The digest, derived from the plaintext. An ACTION, because
  //    `crypto.subtle` lives in the action runtime.
  const hashed = await client.action(HASH.backfill, {})
  console.log(`\n1. hash backfill      patched ${hashed.patched} in ${hashed.rounds} round(s)`)

  // 2. Scopes. Every existing token was issued when there was nothing to
  //    restrict, so it gets the FULL set — anything narrower would revoke
  //    access the user never asked to revoke.
  const scoped = await client.mutation(SCOPES.backfill, {})
  console.log(`2. scopes backfill    patched ${scoped.patched}, remaining ${scoped.remaining}`)

  // 3. The clear pass. Refuses on its own if step 1 left anything unhashed.
  const cleared = await client.mutation(HASH.clearPlaintext, {})
  if (cleared.unhashed > 0) {
    console.error(
      `\nREFUSED: ${cleared.unhashed} token(s) are still unhashed, so the plaintext\n` +
        'was NOT cleared — clearing one of those would leave a token that can never\n' +
        'authenticate and can never be repaired. Rerun step 1 and try again.',
    )
    process.exitCode = 1
    return
  }
  console.log(`3. clear plaintext    cleared ${cleared.cleared}, remaining ${cleared.remaining}`)

  // 4. `apiRateLimits.ip` -> `key`. These rows are dead 60 seconds after they
  //    are written and the hourly cron would drain them anyway; this only saves
  //    the narrow from having to wait for it.
  const purged = await client.mutation(SCOPES.purgeKeylessRateLimits, {})
  console.log(`4. purge keyless      deleted ${purged.deleted}, remaining ${purged.remaining}`)

  const hashAfter = await client.query(HASH.report, {})
  const scopesAfter = await client.query(SCOPES.report, {})
  console.log('\nAFTER')
  console.log(`  unhashed         ${hashAfter.unhashed}`)
  console.log(`  unscoped         ${scopesAfter.unscoped}`)

  const blockers: string[] = []
  if (hashAfter.unhashed > 0) blockers.push(`${hashAfter.unhashed} token(s) unhashed`)
  if (scopesAfter.unscoped > 0) blockers.push(`${scopesAfter.unscoped} token(s) unscoped`)
  if (cleared.remaining > 0) blockers.push(`${cleared.remaining} token(s) still hold plaintext`)
  if (purged.remaining > 0) blockers.push(`${purged.remaining} rate-limit row(s) without a key`)

  if (blockers.length > 0) {
    console.error(`\nNOT READY TO NARROW:\n  ${blockers.join('\n  ')}`)
    console.error('\nThe narrow push would be refused. Rerun this script.')
    process.exitCode = 1
    return
  }

  console.log('\nReady. Deploy the narrow revision now.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
