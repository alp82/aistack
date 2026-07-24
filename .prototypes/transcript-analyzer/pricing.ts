// PROTOTYPE — throwaway. Wayfinder ticket #32 (map #29).
//
// Pinned price table. Deliberately NOT fetched at runtime: a published
// "API-equivalent cost" number must name the table version it was computed
// with, so the table is a pinned artifact, not a moving target.
//
// Source: Anthropic public list prices as of 2026-07-24 (claude-api skill,
// models table cached 2026-06-24). Cache multipliers from
// https://platform.claude.com/docs/en/build-with-claude/prompt-caching:
//   5m cache write = 1.25x input, 1h cache write = 2x input, cache read = 0.1x input.

export const PRICING_TABLE_VERSION = "anthropic-list-2026-07-24";

// CAVEAT for the wire format (#33): this table is not time-invariant.
// `claude-sonnet-5` is inside an introductory pricing window that ends
// 2026-08-31, after which the same tokens reprice from $2/$10 to $3/$15 per
// MTok. A published "API-equivalent cost" is therefore only meaningful
// alongside the table version it was computed with — and a later table must
// never silently restate an earlier published figure.
export const PRICING_TABLE_NOTES =
  "claude-sonnet-5 priced at its introductory $2/$10 per MTok (in effect through 2026-08-31)";

export const CACHE_WRITE_5M_MULTIPLIER = 1.25;
export const CACHE_WRITE_1H_MULTIPLIER = 2.0;
export const CACHE_READ_MULTIPLIER = 0.1;

/** USD per million tokens. */
type Price = { input: number; output: number };

const PRICES: Record<string, Price> = {
  "claude-fable-5": { input: 10, output: 50 },
  "claude-mythos-5": { input: 10, output: 50 },
  "claude-opus-5": { input: 5, output: 25 },
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-opus-4-7": { input: 5, output: 25 },
  "claude-opus-4-6": { input: 5, output: 25 },
  // Introductory rate, in effect through 2026-08-31 (post-intro: $3 / $15).
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
  // Fast mode (research preview) — Opus 5 / Opus 4.8 only.
  "claude-opus-5#fast": { input: 10, output: 50 },
  "claude-opus-4-8#fast": { input: 10, output: 50 },
};

/**
 * Normalize an observed `message.model` into a pricing key.
 * Handles the dated-suffix variants (`claude-haiku-4-5-20251001`).
 * The `#fast` suffix is appended by the caller from `usage.speed`.
 */
export function normalizeModel(model: string): string {
  const [base, suffix] = model.split("#");
  const stripped = base.replace(/-\d{8}$/, "");
  return suffix ? `${stripped}#${suffix}` : stripped;
}

export type TokenCounts = {
  input: number;
  output: number;
  cacheWrite5m: number;
  cacheWrite1h: number;
  /** cache_creation_input_tokens not covered by the TTL breakdown; priced at the 5m rate. */
  cacheWriteUnsplit: number;
  cacheRead: number;
};

/** Returns null for a model with no pinned price — the caller must surface that, not zero it. */
export function apiEquivalentCost(
  modelKey: string,
  t: TokenCounts,
): number | null {
  const p = PRICES[modelKey];
  if (!p) return null;
  const M = 1_000_000;
  return (
    (t.input * p.input +
      t.output * p.output +
      (t.cacheWrite5m + t.cacheWriteUnsplit) *
        p.input *
        CACHE_WRITE_5M_MULTIPLIER +
      t.cacheWrite1h * p.input * CACHE_WRITE_1H_MULTIPLIER +
      t.cacheRead * p.input * CACHE_READ_MULTIPLIER) /
    M
  );
}
