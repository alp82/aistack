/**
 * `stacks.stackImageUrl` clear pass — PHASE B driver.
 *
 * Run with: pnpm tsx scripts/migrate-clear-stack-image-url.ts            (report only)
 *           pnpm tsx scripts/migrate-clear-stack-image-url.ts --apply
 *           pnpm tsx scripts/migrate-clear-stack-image-url.ts --apply --include-non-empty
 *
 * Unblocks a deployment whose `stacks` rows still carry `stackImageUrl` after the
 * profile-decoupling narrow (#22) dropped it from the validator — see the long
 * comment in convex/migrations/20260725_clear_stack_image_url.ts for how a
 * truthiness check let the empty string through.
 *
 * RUNBOOK — the order matters, the field is retired in two deploys:
 *
 *   Deploy A (this commit) — Phase A widening + Phase B functions:
 *     export CONVEX_SELF_HOSTED_URL=http://10.0.0.20:3210
 *     export CONVEX_SELF_HOSTED_ADMIN_KEY=convex-self-hosted...
 *     npx convex deploy                                   # schema + functions
 *     pnpm tsx scripts/migrate-clear-stack-image-url.ts   # report first
 *     pnpm tsx scripts/migrate-clear-stack-image-url.ts --apply
 *
 *   Deploy B — Phase C, once the report is clean: delete the widening from
 *   convex/schema.ts, this script, the migration, and its test; deploy again.
 *
 * Deploying the narrow before the clear has run is exactly the failure this
 * exists to repair — `convex deploy` validates the new schema against existing
 * rows, so a single dirty row rejects the whole push.
 *
 * Idempotent: a second run reports every row as clean.
 */

import { internal } from '../convex/_generated/api'
import { createAdminClient } from './lib/convexAdmin'

const APPLY = process.argv.includes('--apply')
const INCLUDE_NON_EMPTY = process.argv.includes('--include-non-empty')

async function main(): Promise<void> {
  const { client, url } = createAdminClient()
  console.log(`[convex] ${url}`)

  const fns = internal.migrations['20260725_clear_stack_image_url']

  const before = await client.query(fns.report, {})
  console.log('\nBEFORE')
  console.log(`  total stacks          ${before.total}`)
  console.log(`  clean (field absent)  ${before.clean}`)
  console.log(`  dirty, empty string   ${before.dirtyEmpty}`)
  console.log(`  dirty, real URL       ${before.dirtyNonEmpty}`)
  if (before.dirtyNonEmpty > 0) {
    console.log(`    slugs: ${before.nonEmptySlugs.join(', ')}`)
    console.log(
      '    These carry an image the avatar migration never consumed. Clearing\n' +
        '    it is unrecoverable — check them before passing --include-non-empty.',
    )
  }

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to write.')
    return
  }

  const result = await client.mutation(fns.clearEmpty, {
    includeNonEmpty: INCLUDE_NON_EMPTY,
  })
  console.log('\nAPPLIED')
  console.log(`  cleared      ${result.cleared}`)
  console.log(`  left dirty   ${result.leftDirty}`)

  const after = await client.query(fns.report, {})
  const stillDirty = after.dirtyEmpty + after.dirtyNonEmpty
  console.log('\nAFTER')
  console.log(`  clean         ${after.clean}`)
  console.log(`  still dirty   ${stillDirty}`)

  if (stillDirty > 0) {
    console.error(
      `\n${stillDirty} row(s) still carry stackImageUrl. Phase C (deleting the\n` +
        'widening from schema.ts) stays blocked until this reaches zero.',
    )
    process.exitCode = 1
    return
  }
  console.log(
    '\nClean. Phase C: delete the stackImageUrl widening from convex/schema.ts,\n' +
      'this script, convex/migrations/20260725_clear_stack_image_url.ts and its\n' +
      'test, then deploy again.',
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
