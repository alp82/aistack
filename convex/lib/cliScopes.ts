import { v } from 'convex/values'

/**
 * What a CLI bearer token is allowed to do (#52, decided in #49's grilling).
 *
 * TWO SCOPES, AND EVERY TOKEN IS MINTED WITH BOTH. Nothing is refused today,
 * and that is deliberate: what this buys now is the enforcement point, the
 * test, and a line on `/settings/machines`. A narrower token later then needs
 * no server change.
 *
 * A grant picker on `/cli/auth` was rejected in the same grilling — a
 * permissions checklist is a question most users cannot answer, and it trains
 * people to click through.
 *
 * The concrete narrow-token case is gone: #49 decided the MCP server presents
 * the SAME token, because a second credential in the same `credentials.json`
 * under the same user does not survive a shell the agent already has.
 */
export const CliTokenScope = v.union(v.literal('collect'), v.literal('sync'))

export type CliTokenScope = 'collect' | 'sync'

/** What every newly minted token gets. Order is stable so tests can compare. */
export const FULL_CLI_TOKEN_SCOPES: CliTokenScope[] = ['collect', 'sync']

/**
 * Plain-language names for `/settings/machines`.
 *
 * The page speaks the reconcile vocabulary #39 locked, so neither string says
 * "scope" — the user is being told what a machine can reach, not read a grant
 * table.
 */
export const CLI_SCOPE_LABELS: Record<CliTokenScope, string> = {
  collect: 'read and update your stack',
  sync: 'publish what it measured',
}
