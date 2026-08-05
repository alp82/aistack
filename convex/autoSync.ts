import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'
import { internalMutation, mutation, query } from './_generated/server'
import { AutoSyncState } from './schema'
import { normalizeFrequencyHours } from './lib/autoSync'
import { requireStackOwner } from './measured'

/**
 * The auto-sync permission — wayfinder #102 (map #76), from #100 decision 2.
 *
 * The permission used to live on the machine: a flag in
 * `~/.config/aistack/settings.json` plus a SessionStart hook. The web could
 * neither see it nor take it away, so "turn auto-sync off" was a sentence only
 * the machine that turned it on could say.
 *
 * IT NOW LIVES ON THE STACK, and there are three ways to write it:
 *
 *   - the SEED, once, from a machine that opted in before the move
 *     (`publishForToken` in measured.ts, so it rides the sync it arrived on);
 *   - a MACHINE, over `POST /api/cli/auto-sync` — the opt-in ask and
 *     `sync --auto on/off` (#103);
 *   - the OWNER, from the switch in the owner box (#104).
 *
 * The last two land here, on one mutation, so the two surfaces cannot drift.
 */

/** What both setters return: the flag as it now stands, plus the stamp. */
const AutoSyncView = v.object({
  autoSync: AutoSyncState,
  /** The newest automatic sync, or null when no machine has ever fired one. */
  lastAutoSyncAt: v.union(v.number(), v.null()),
})

/**
 * Write the flag.
 *
 * AN ABSENT INTERVAL KEEPS THE STORED ONE. Off is a revoke and not a reset, so
 * turning it back on must not silently move a machine that chose six hours onto
 * the default. Only a stack that has never had a flag falls back to the default.
 */
async function writeFlag(
  ctx: MutationCtx,
  stack: Doc<'stacks'>,
  enabled: boolean,
  frequencyHours: number | undefined,
): Promise<{ autoSync: { enabled: boolean; frequencyHours: number }; lastAutoSyncAt: number | null }> {
  const autoSync = {
    enabled,
    frequencyHours: normalizeFrequencyHours(
      frequencyHours ?? stack.autoSync?.frequencyHours,
    ),
  }
  await ctx.db.patch(stack._id, { autoSync })
  // The stamp is a fact about what happened and survives a revoke. The switch
  // reads the pair: on with no stamp is on-but-never-fired.
  return { autoSync, lastAutoSyncAt: stack.lastAutoSyncAt ?? null }
}

/**
 * The machine's setter, behind the CLI bearer (`POST /api/cli/auto-sync`).
 *
 * The token's owner must STILL own the bound stack, the same check
 * `publishForToken` makes: a stack can change hands between link time and send
 * time, and a permission written to the wrong stack lets a stranger's machine
 * publish into it on a timer.
 */
export const setForToken = internalMutation({
  args: {
    tokenId: v.id('cliTokens'),
    enabled: v.boolean(),
    frequencyHours: v.optional(v.number()),
  },
  returns: AutoSyncView,
  handler: async (ctx, args) => {
    const token = await ctx.db.get(args.tokenId)
    if (!token) throw new Error('Token not found')
    if (!token.stackId) {
      throw new Error(
        'This machine is not linked to a stack. Run `aistack login` again to pick one.'
      )
    }
    const stack = await ctx.db.get(token.stackId)
    if (!stack) throw new Error('Linked stack no longer exists')
    const creator = await ctx.db.get(stack.creatorId)
    if (!creator || creator.userId !== token.userId) {
      throw new Error('Token is no longer authorized for its linked stack')
    }
    return await writeFlag(ctx, stack, args.enabled, args.frequencyHours)
  },
})

/** The owner's setter, behind the session — the switch in the owner box (#104). */
export const set = mutation({
  args: {
    stackId: v.id('stacks'),
    enabled: v.boolean(),
    frequencyHours: v.optional(v.number()),
  },
  returns: AutoSyncView,
  handler: async (ctx, args) => {
    const stack = await requireStackOwner(ctx, args.stackId)
    return await writeFlag(ctx, stack, args.enabled, args.frequencyHours)
  },
})

/**
 * What the owner's switch renders (#104): the flag and the stamp, together.
 *
 * OWNER-ONLY, because the pair says when this person's machines are running —
 * a schedule nobody else has a reason to read. A stack that has never had a
 * flag answers `autoSync: null`, which the switch draws as off.
 */
export const get = query({
  args: { stackId: v.id('stacks') },
  returns: v.object({
    autoSync: v.union(AutoSyncState, v.null()),
    lastAutoSyncAt: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, args) => {
    const stack = await requireStackOwner(ctx, args.stackId)
    return {
      autoSync: stack.autoSync ?? null,
      lastAutoSyncAt: stack.lastAutoSyncAt ?? null,
    }
  },
})
