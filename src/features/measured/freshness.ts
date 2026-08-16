/**
 * The stack page's one age window (#108, building the answer #107 locked).
 *
 * THE PAGE SPEAKS AT 48 HOURS, AND THE BOARD KEEPS SEVEN DAYS. Three windows
 * already existed around this reading, and #107 cut the page down to one:
 *
 *   - 48 hours - here. The hero dot, and the switch the section promotes.
 *   - 7 days - `isFresh` on the snapshot (`convex/measured.ts`), which the
 *     leaderboard still uses to rank a row (#82) and the owner's reconcile page
 *     still uses for its own run. Neither is this page.
 *   - 30 days - the CLI's detection gate (#100). It gates a scan, not a display.
 *
 * WHAT THE PAGE SAYS IS AN AGE, NEVER A JUDGEMENT. The word "stale" reaches no
 * surface. Every string below states when the last sync landed and what the
 * numbers cover, because an age is a fact at every threshold and a silence is
 * not a fact about the person who kept it (#40).
 *
 * THE CLOCK IS `receivedAt`, THE SERVER CLOCK, never `capturedAt` (#38). A
 * machine with a wrong clock must not be able to date this page.
 */
/** Older than this and the page names the age. #107 set the number. */
export const STALE_AFTER_HOURS = 48;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const STALE_AFTER_MS = STALE_AFTER_HOURS * HOUR;

/**
 * Past the 48-hour line, or not.
 *
 * STRICTLY GREATER. "Older than 48 hours" excludes a reading that is exactly 48
 * hours old, so the boundary itself is still current.
 */
export function isStale(receivedAt: number, now: number = Date.now()): boolean {
	return now - receivedAt > STALE_AFTER_MS;
}

/**
 * "3 days ago" - the long form the approved strings use.
 *
 * FLOORED, LIKE `timeAgo`. The hero prints "2d ago" from the same instant, and
 * a page that rounded here would carry two different ages for one sync.
 */
export function syncAgo(receivedAt: number, now: number = Date.now()): string {
	const ms = Math.max(0, now - receivedAt);
	if (ms < HOUR) return "just now";
	if (ms < DAY) {
		const hours = Math.floor(ms / HOUR);
		return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
	}
	const days = Math.floor(ms / DAY);
	return days === 1 ? "yesterday" : `${days} days ago`;
}
