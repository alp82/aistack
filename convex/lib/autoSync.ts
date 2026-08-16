/**
 * The auto-sync permission, as the SERVER holds it (#100 decision 2, #102).
 *
 * The flag used to live only in `~/.config/aistack/settings.json` plus the hook
 * files, so the web could neither read it nor revoke it. It now sits on the
 * stack, `sync --auto` asks for it before it publishes, and the local flag
 * degrades to a seed source.
 *
 * These are the pure parts - no Convex context - because both writers need
 * them: the publish path that seeds from a wire field, and the two setters
 * (the CLI route and the owner's switch).
 */

/** What a machine that never chose gets, mirroring the CLI's own default. */
export const DEFAULT_FREQUENCY_HOURS = 24

/** Once an hour is as often as any trigger is allowed to publish. */
export const MIN_FREQUENCY_HOURS = 1

/** A week. Beyond this the interval says "off" more honestly than "on". */
export const MAX_FREQUENCY_HOURS = 168

/**
 * Fold any client-supplied interval into the allowed range.
 *
 * CLAMPED, NEVER REFUSED. Every caller here is either a sync that the owner
 * already approved or a switch the owner is holding, so rejecting the whole
 * request over an out-of-range number would cost them the thing they asked for
 * - and the field it lands in is a schedule hint, not a claim about data.
 */
export function normalizeFrequencyHours(raw: number | undefined): number {
  if (raw === undefined || !Number.isFinite(raw)) return DEFAULT_FREQUENCY_HOURS
  const rounded = Math.round(raw)
  if (rounded < MIN_FREQUENCY_HOURS) return MIN_FREQUENCY_HOURS
  if (rounded > MAX_FREQUENCY_HOURS) return MAX_FREQUENCY_HOURS
  return rounded
}
