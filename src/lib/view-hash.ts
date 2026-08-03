// The pure half of view counting (#78, map #76).
//
// Split out of the server function so the rules can be tested without a request
// context. Everything here runs on the SERVER only — the raw IP and the raw
// User-Agent must never reach the browser bundle or Convex.

import { createHmac } from "node:crypto";
import { isbot } from "isbot";

export const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Length-delimited join.
 *
 * Raw concatenation lets two different input tuples collide — `("ab", "c")` and
 * `("a", "bc")` hash the same. Prefixing each part with its length removes the
 * ambiguity.
 */
export function delimitedJoin(parts: readonly string[]): string {
	return parts.map((p) => `${p.length}:${p}`).join("|");
}

export function hashSecret(): string | null {
	const secret = process.env.VIEW_HASH_SECRET;
	if (secret) return secret;
	// Dev has no secret to keep — there is no shared database and no visitor to
	// re-identify. Production without the variable counts nothing rather than
	// storing a guessable pseudonym.
	if (process.env.NODE_ENV !== "production") return "dev-view-hash-secret";
	return null;
}

/**
 * The daily visitor pseudonym.
 *
 * `IP + User-Agent` merges people behind one NAT and splits one person across
 * networks, which is why every surface calls the result **deduped daily
 * visitors** and never people. The target and the day are inside the hash, so a
 * pseudonym is useless outside the one target-day it was minted for.
 */
export function visitorHashFor(input: {
	secret: string;
	ip: string;
	userAgent: string;
	targetKind: string;
	targetId: string;
	dayStartMs: number;
}): string {
	return createHmac("sha256", input.secret)
		.update(
			delimitedJoin([
				input.ip,
				input.userAgent,
				input.targetKind,
				input.targetId,
				String(input.dayStartMs),
			]),
		)
		.digest("hex");
}

/** The per-address bucket the write path rate-limits on. No target, no day. */
export function rateKeyFor(secret: string, ip: string): string {
	return createHmac("sha256", secret)
		.update(delimitedJoin(["ratelimit", ip]))
		.digest("hex");
}

/**
 * Should this request count as a view?
 *
 * Three refusals, all of them about requests no person made:
 * - a known bot User-Agent,
 * - no User-Agent at all (every real browser sends one),
 * - `Sec-Purpose: prefetch`, which is the browser speculating, not a visitor.
 */
export function isCountableRequest(headers: {
	userAgent: string | null;
	secPurpose: string | null;
}): boolean {
	if (!headers.userAgent) return false;
	if (isbot(headers.userAgent)) return false;
	if (headers.secPurpose?.toLowerCase().includes("prefetch")) return false;
	return true;
}
