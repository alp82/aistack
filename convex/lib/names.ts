/**
 * What a client-supplied string in the measured layer may be.
 *
 * Wayfinder ticket #45 (map #29).
 *
 * All filtering of WHICH names publish stays client-side, on the machine, before
 * the send (#33 decisions 2-4, #42 decision 1) - the server deliberately never
 * re-checks a name against the curated list, because the whole point of the
 * per-user opt-in is that the user may publish names the server has never heard
 * of. This module is the other question: not whether a name is allowed, but
 * whether the STRING is a name at all.
 *
 * Under the pre-#42 design only vetted strings could reach the database, so this
 * bound was incidentally true and unwritten. #42 made arbitrary user-supplied
 * names a designed feature, which makes the bound something the server has to
 * state.
 *
 * There is ONE policy, not two: `packages/cli/src/transcripts/analyzer.ts`
 * applies exactly this bar to every observed name on the way in (`cleanName` /
 * `isDisplaySafeName`). The client cleans, the server asserts.
 */

/**
 * Characters that cannot be rendered safely anywhere.
 *
 * Control characters move a terminal cursor, and an unterminated bidi override
 * (U+202E) reorders the rest of the rendered line - including the share printed
 * beside the name. Both survive `JSON.stringify`, which escapes C0 but not bidi.
 * See CVE-2021-42574 ("Trojan Source").
 */
const UNSAFE_NAME_RE =
  // biome-ignore lint/suspicious/noControlCharactersInRegex: refusing them is the point
  /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/

export const NAME_MAX = 64

/**
 * The bar on a user-chosen name: a skill, an MCP server, a subagent type, a
 * slash command, a built-in tool.
 *
 * Deliberately NOT the curated list's charset. A curated entry is ours and
 * conventional; a published name is the user's own string and may legitimately
 * carry parentheses, accents or CJK (`CURATED_NAME_RE` rejects `(default)`,
 * which is itself on the curated list). Refusing those would refuse names people
 * genuinely run. What is refused is only what cannot be rendered safely.
 */
export function isDisplaySafeName(s: string): boolean {
  if (s.trim().length === 0) return false
  if (s.length > NAME_MAX) return false
  return !UNSAFE_NAME_RE.test(s)
}

export const MODEL_ID_MAX = 64

/**
 * The bar on a vendor-assigned model id, mirroring what `sanitizeModelId` in
 * packages/cli/src/transcripts/payload.ts guarantees on the way out.
 *
 * A model id is a different trust class from a name: it is exempt from the
 * allowlist (#33 decision 3) because fail-closing a model the day it ships would
 * make its tokens silently vanish and understate cost with no visible cause.
 * Exempt is not unchecked - the id becomes a lookup key against the models
 * catalog and a rendered string, so it gets the tighter machine charset a vendor
 * id actually uses.
 *
 * Leading and trailing hyphens are accepted even though the client's sanitizer
 * strips them. That stripping is cosmetic, and it does not survive the
 * sanitizer's own truncation step, so asserting it here would reject payloads
 * the client considers valid - coupling the server to a detail that is not a
 * bound.
 */
export function isSanitizedModelId(s: string): boolean {
  if (s.length === 0 || s.length > MODEL_ID_MAX) return false
  return /^[A-Za-z0-9._:-]+$/.test(s)
}
