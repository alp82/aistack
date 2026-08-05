/**
 * PROTOTYPE (#107) — the freshness fixtures and the copy drafts.
 *
 * Throwaway. Delete this folder when #107 is decided.
 *
 * WHAT THIS FILE IS FOR. The three variants disagree about WHERE the state
 * sits and about whether the visitor and the owner read one element or two.
 * They must not also disagree about WHAT it says, or the owner would be
 * judging six things at once. So every sentence lives here, once, and the
 * variants only place it.
 *
 * THE THRESHOLD (#107): no sync at all, or a last sync older than 48 hours.
 * Two other windows already exist in the repo and neither is this one:
 *
 *   - 7 days — `isFresh` on every harness (`convex/measured.ts:432`), which
 *     draws the orange per-harness footnote at the bottom of the section, and
 *     the leaderboard's living/quiet split (`convex/leaderboard.ts:39`).
 *   - 30 days — the CLI's detection gate from #100: a harness counts when its
 *     newest transcript is inside the rolling 30 days. It gates the scan, not
 *     a display.
 *
 * The copy below therefore never says "stale" and never says "active". It
 * says WHEN the last sync landed and what the numbers cover. An age is a fact
 * at every threshold, so it cannot blur two windows (#40: positive claims
 * only).
 */

export const STALE_AFTER_HOURS = 48;

const HOUR = 60 * 60 * 1000;

export const FRESHNESS_STATES = ["fresh", "stale", "quiet", "never"] as const;
export type FreshnessKey = (typeof FRESHNESS_STATES)[number];

export const FRESHNESS_LABELS: Record<FreshnessKey, string> = {
	fresh: "Fresh · 5h",
	stale: "Stale · 3d",
	quiet: "Quiet · 19d",
	never: "No sync ever",
};

/** How old the last sync is in each state, in hours. Null is "never synced". */
const AGE_HOURS: Record<FreshnessKey, number | null> = {
	fresh: 5,
	stale: 74,
	quiet: 19 * 24,
	never: null,
};

export const VIEWERS = ["visitor", "owner-off", "owner-on"] as const;
export type ViewerKey = (typeof VIEWERS)[number];

export const VIEWER_LABELS: Record<ViewerKey, string> = {
	visitor: "Visitor",
	"owner-off": "Owner · auto off",
	"owner-on": "Owner · auto on",
};

export function isOwner(viewer: ViewerKey): boolean {
	return viewer !== "visitor";
}

export type Freshness = {
	readonly state: FreshnessKey;
	/** The server clock at the last sync, or null when there has never been one. */
	readonly lastSyncAt: number | null;
	/** True past the 48-hour line. False for a stack that never synced. */
	readonly isStale: boolean;
	readonly ago: string;
	readonly day: string;
};

/** "3 days ago" — the same shape `timeAgo` prints, computed from the fixture. */
function agoLabel(hours: number): string {
	if (hours < 1) return "just now";
	if (hours < 24) return `${Math.round(hours)} hours ago`;
	const days = Math.round(hours / 24);
	return days === 1 ? "yesterday" : `${days} days ago`;
}

function dayLabel(at: number): string {
	return new Date(at).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
}

export function freshness(state: FreshnessKey, now: number): Freshness {
	const hours = AGE_HOURS[state];
	if (hours === null) {
		return {
			state,
			lastSyncAt: null,
			isStale: false,
			ago: "never",
			day: "—",
		};
	}
	const lastSyncAt = now - hours * HOUR;
	return {
		state,
		lastSyncAt,
		isStale: hours > STALE_AFTER_HOURS,
		ago: agoLabel(hours),
		day: dayLabel(lastSyncAt),
	};
}

/* ------------------------------------------------------------------ copy -- */

/**
 * THE VISITOR SENTENCE. An age and a coverage claim, and nothing else.
 *
 * It never says the stack went quiet, was abandoned or stopped working — a
 * reader who has not synced in three days may be on holiday, and #40 forbids
 * the page from reading a silence as a fact about its author.
 */
export function visitorLine(f: Freshness, windowDays: number): string {
	return `Last synced ${f.ago}. These numbers cover the ${windowDays} days up to ${f.day}.`;
}

/**
 * THE OWNER SENTENCE WITH AUTO-SYNC OFF — the same fact, then the remedy.
 *
 * The remedy is one clause, not a second paragraph: the switch below is the
 * control, and this is the nudge toward it.
 */
export function ownerOffLine(f: Freshness): string {
	return `Last synced ${f.ago}. Auto-sync keeps this page current without you running anything.`;
}

/**
 * WHAT AUTO-SYNC IS, in the CLI's own terms.
 *
 * The CLI says: "a silent daily sync when a Claude Code session starts", and
 * on enable "about every 24h when a Claude Code session starts. Turn it off
 * any time: npx @use-aistack/cli sync --auto off". This keeps all three facts
 * — the trigger, the ceiling, the revoke — and drops the harness name, which
 * the web does not know for this reader.
 */
export const AUTO_SYNC_EXPLAINER =
	"It publishes when a session starts on a machine you have linked, at most once a day. Turning it off revokes it everywhere, from this switch or with `npx @use-aistack/cli sync --auto off`.";

/** The command, verbatim from `copy.ts` and the CLI. */
export const AUTO_ON_CMD = "npx @use-aistack/cli sync --auto on";
export const SYNC_CMD = "npx @use-aistack/cli sync";

/**
 * THE OWNER SENTENCE WITH AUTO-SYNC ON. No CTA, because there is nothing to
 * turn on: the switch is already the answer, and a callout that promoted it
 * again would be the "two features" failure the ticket names.
 */
export function ownerOnLine(f: Freshness): string {
	return `Last synced ${f.ago}. Auto-sync is on, so the next session on a linked machine publishes a new reading.`;
}

/**
 * THE NO-SYNC STATE IS NOT A STALE STATE. A stack that never synced may be
 * hand-curated and complete. So the empty box keeps the wording that already
 * ships (`NEVER_SYNCED_*`, `OWNER_NOT_MEASURED_*` in `copy.ts`) and no variant
 * puts an age or a warning on it.
 *
 * AND IT CANNOT OFFER AUTO-SYNC. `enableAutoSync` needs a linked machine —
 * the CLI's own words are "This machine is not linked to an aistack account,
 * and the auto-sync permission lives on your stack. Run `npx @use-aistack/cli
 * sync` first." So the owner's empty box teaches the one command, and the
 * line below is the only mention automation gets before a first sync exists.
 */
export const NEVER_SYNCED_AUTO_NOTE =
	"After that first sync, this stack can keep itself current on a schedule.";

/* --------------------------------------------------------------- windows -- */

/**
 * THE SECOND QUESTION, made visible (asked by the owner at the C answer).
 *
 * The 48-hour line does not arrive on an empty page. The stack page already
 * carries a hero dot that turns orange at 7 days and a per-harness footnote
 * that says "going stale" at 7 days, and the leaderboard ranks living stacks
 * and lists quiet ones below, split at 7 days.
 *
 *   page — the page speaks with one window. The dot follows the stamp at 48
 *          hours and the 7-day footnote is deleted. The board keeps 7 days,
 *          because that rule ranks rows and #82 set it.
 *   all  — the same page, and the board splits at 48 hours too.
 *   both — the stamp at 48 hours, the dot and the footnote at 7 days.
 */
export const WINDOW_MODES = ["page", "all", "both"] as const;
export type WindowMode = (typeof WINDOW_MODES)[number];

export const WINDOW_LABELS: Record<WindowMode, string> = {
	page: "Page 48h · board 7d",
	all: "48h everywhere",
	both: "Keep both · 48h + 7d",
};

const SEVEN_DAYS_HOURS = 7 * 24;

/** The hero dot: lime while fresh, orange past the window this mode uses. */
export function dotIsStale(f: Freshness, mode: WindowMode): boolean {
	if (f.lastSyncAt === null) return false;
	const hours = (Date.now() - f.lastSyncAt) / HOUR;
	return hours > (mode === "both" ? SEVEN_DAYS_HOURS : STALE_AFTER_HOURS);
}

/** The per-harness footnote that ships today. Deleted in the one-window modes. */
export function footnoteShown(f: Freshness, mode: WindowMode): boolean {
	if (mode !== "both" || f.lastSyncAt === null) return false;
	return (Date.now() - f.lastSyncAt) / HOUR > SEVEN_DAYS_HOURS;
}

export function footnoteLine(f: Freshness): string {
	return `Last checked ${f.ago} — this reading is going stale.`;
}

/**
 * THE BOARD, with the four real stacks and the real last syncs #92 recorded on
 * 2026-08-04. Every one of them is older than 48 hours, which is what makes
 * the board question concrete: at 48 hours nothing ranks today.
 */
export const BOARD = [
	{ name: "OrcDev", tokens: "291.35B", ageHours: 3 * 24, day: "Aug 2" },
	{ name: "GVASTE", tokens: "5.88B", ageHours: 4 * 24, day: "Aug 1" },
	{ name: "Brilliant Insane", tokens: "4.77B", ageHours: 3 * 24, day: "Aug 2" },
	{
		name: "Alper's Agent Stack",
		tokens: "4.71B",
		ageHours: 2 * 24,
		day: "Aug 3",
	},
] as const;

export function boardRanks(ageHours: number, mode: WindowMode): boolean {
	return ageHours <= (mode === "all" ? STALE_AFTER_HOURS : SEVEN_DAYS_HOURS);
}

/* --------------------------------------------------------------- reading -- */

/** One plausible reading, so the variants are judged at real density. */
export const READING = {
	tokens: 4_712_000_000,
	usd: 6042,
	windowDays: 30,
	sessions: 577,
	activeDays: 24,
	cacheHits: 0.94,
	subagents: 0.31,
	pricingTable: "2026-08-01",
	readings: 7,
	firstDay: "Jul 30",
	models: [
		{ name: "Claude Opus 5", share: 0.4 },
		{ name: "gpt-5.6-sol", share: 0.33 },
		{ name: "Claude Fable 5", share: 0.19 },
		{ name: "claude-haiku-4-5", share: 0.08 },
	],
} as const;
