/**
 * `cliTokens.stackId` relink — PHASE B driver.
 *
 * Run with: pnpm tsx scripts/migrate-cli-token-stack.ts        (report only)
 *           pnpm tsx scripts/migrate-cli-token-stack.ts --apply
 *
 * Wayfinder ticket #38 (map #29). Phase A (widen `stackId` to optional) is in
 * schema.ts and must be deployed first. This links every token whose owner has
 * exactly ONE stack; tokens whose owner has zero or several are left unlinked on
 * purpose — there is no recorded intent to recover and guessing would point a
 * machine's measured layer at a stack the user never chose, permanently, since
 * snapshots are immutable.
 *
 * Idempotent: a second run reports every already-linked token as skipped.
 *
 * Phase C (narrow to required) is NOT unlocked by this script alone — see the
 * long comment in convex/migrations/20260725_cli_token_stack.ts for why the
 * field may legitimately stay optional.
 */

import { internal } from '../convex/_generated/api'
import { createAdminClient } from './lib/convexAdmin'

const APPLY = process.argv.includes('--apply')

async function main(): Promise<void> {
  const { client, url } = createAdminClient()
  console.log(`[convex] ${url}`)

  const before = await client.query(
    internal.migrations['20260725_cli_token_stack'].report,
    {},
  )
  console.log('\nBEFORE')
  console.log(`  total tokens        ${before.total}`)
  console.log(`  already linked      ${before.alreadyLinked}`)
  console.log(`  linkable (1 stack)  ${before.linkable}`)
  console.log(`  ambiguous (0 or 2+) ${before.ambiguous}`)
  console.log(`  no creator profile  ${before.noCreator}`)

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to write.')
    return
  }

  const result = await client.mutation(
    internal.migrations['20260725_cli_token_stack'].relinkUnambiguous,
    {},
  )
  console.log('\nAPPLIED')
  console.log(`  linked         ${result.linked}`)
  console.log(`  left unlinked  ${result.leftUnlinked}`)

  const after = await client.query(
    internal.migrations['20260725_cli_token_stack'].report,
    {},
  )
  console.log('\nAFTER')
  console.log(`  already linked      ${after.alreadyLinked}`)
  console.log(`  still unlinked      ${after.linkable + after.ambiguous + after.noCreator}`)

  if (after.linkable > 0) {
    console.error(
      `\nWARNING: ${after.linkable} token(s) were linkable but are still unlinked — rerun.`,
    )
    process.exitCode = 1
    return
  }
  if (after.ambiguous + after.noCreator > 0) {
    console.log(
      `\n${after.ambiguous + after.noCreator} token(s) cannot be linked automatically.\n` +
        'Those machines must re-run `aistack login` to pick a stack. Phase C\n' +
        '(narrowing stackId to required) stays blocked until then — by design.',
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
