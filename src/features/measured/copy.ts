/**
 * Every user-facing string and number format for the public measured display.
 *
 * Wayfinder ticket #46 (map #29), building the H2 + section-02 design locked by
 * #40. The rules below are decisions, not preferences - each one was checked
 * against the owner's real payload in #40 and must not be relaxed here:
 *
 *   - A dollar figure NEVER renders without its pricing table version, so
 *     `totalUSD` returns null when no table cites it (#33 decision 11).
 *   - A dollar figure is a LOWER BOUND and reads as one, with the share of
 *     tokens it covers beside it (#93).
 *   - `catalogSlug: null` is not an error. The raw vendor id renders, because
 *     that row may be the largest one (#33 decision 3).
 *   - Freshness reads `receivedAt`, the server clock, never `capturedAt` (#38).
 *   - POSITIVE CLAIMS ONLY. Nothing here may say a listed thing went unused -
 *     that needs an adapter seam covering every harness the user runs (#40).
 *
 * Public voice, distinct from the owner-facing voice in
 * `src/features/reconcile/copy.ts`: the reader is a stranger, so it is "from
 * this machine", not "from your machine".
 */
import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../convex/_generated/api";

export type MeasuredSnapshot = NonNullable<
	FunctionReturnType<typeof api.measured.getCurrentByStackSlug>
>;
export type MeasuredModel = MeasuredSnapshot["models"][number];
/** One harness's own section (#66 decision 2) - the pre-#67 snapshot shape. */
export type HarnessSnapshot = MeasuredSnapshot["harnesses"][number];

/** The anchor section 02 mounts on, and the hero strip links down to. */
export const MEASURED_ANCHOR = "section-measured";

export const KICKER = "// sync";
export const TITLE = "Actual Usage";
export const HARNESS = "Claude Code";

/**
 * The one command the site teaches, verbatim (#57 made the npx form the
 * documented default). Since #74 the CLI starts the login flow inline when the
 * machine is unlinked, so honest teaching is this single command.
 */
export const SYNC_CMD = "npx @use-aistack/cli sync";
export const SYNC_CMD_COMMENT = "link, scan, review, approve";

/** Shared mono label treatment, matching the journey's section kickers. */
export const MONO_LABEL =
	"font-mono text-[11px] font-semibold uppercase tracking-[0.25em]";

export function fmtTokens(n: number): string {
	if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
	if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
	if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
	return String(n);
}

export function fmtUSD(n: number): string {
	return `$${Math.round(n).toLocaleString("en-US")}`;
}

export function fmtShare(share: number): string {
	return `${(share * 100).toFixed(1)}%`;
}

/**
 * A move, signed. A rolling window is a LEVEL, so a minus sign here is ordinary
 * - the window forgot a busy day at its far end - and the wording around it must
 * never dress a fall as a fault.
 */
export function fmtDelta(n: number, fmt: (v: number) => string): string {
	const sign = n > 0 ? "+" : n < 0 ? "−" : "±";
	return `${sign}${fmt(Math.abs(n))}`;
}

/** "Jul 30" - a reading's day, always read as UTC. */
export function fmtDay(at: number): string {
	return new Date(at).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
}

/** "7 readings since Jul 30" - how alive the page is, in one line. */
export function readingsLine(count: number, firstAt: number): string {
	return `${count} ${count === 1 ? "reading" : "readings"} since ${fmtDay(firstAt)}`;
}

/** The delta chip beside the headline. Null on a first reading. */
export function lastCheckLine(
	delta: number | null,
	fmt: (v: number) => string,
): string | null {
	if (delta === null) return null;
	return `${fmtDelta(delta, fmt)} since the last check`;
}

/** The kicker over the model rows, and the note that explains the notch. */
export const MIX_KICKER = "where the tokens went";
export function notchNote(firstAt: number): string {
	return `the notch marks where each share stood on ${fmtDay(firstAt)}`;
}

/** The captions under the two headline numbers. */
export const TOKENS_CAPTION = (days: number) => `tokens · last ${days} days`;
export const COST_CAPTION = "at least, at api list prices";
export const COST_PRIVATE = "kept private";
export const COST_PRIVATE_CAPTION = "cost not published";
/** The hover swap under the number, and the accessible name of the control. */
export const DECK_HINT = "random fun fact";
export const DECK_LABEL = "Show another way to picture these tokens";

/**
 * The dollars the whole window cost at API prices, or null.
 *
 * A LOWER BOUND, never an equality (#93). The server fills the gaps a stale CLI
 * price table left behind, and both facts the wire loses - the cache-write TTL
 * split and the per-response timestamps - resolve downward. Tokens no table can
 * price are simply missing from it, which is what `coverageLine` reports.
 *
 * Null in two cases, and the display treats both the same way: the owner has
 * cost publishing off, or nothing in the window carries a citable price. The
 * empty-table guard is the stricter rule - a price the reader cannot date is a
 * price we do not print.
 */
export function totalUSD(s: {
	cost: {
		lowerBoundUSD: number;
		pricingTables: string[];
	} | null;
}): number | null {
	if (!s.cost || s.cost.pricingTables.length === 0) return null;
	return s.cost.lowerBoundUSD;
}

/** The catalog name, falling back to the raw vendor id the client published. */
export function modelLabel(m: MeasuredModel): string {
	return m.catalogName ?? m.id;
}

/** "Claude Fable 5 leads at 35%" - the hero's one model fact. */
export function leadModelLine(s: MeasuredSnapshot): string | null {
	const lead = [...s.models].sort((a, b) => b.tokenShare - a.tokenShare)[0];
	if (!lead) return null;
	return `${modelLabel(lead)} leads at ${(lead.tokenShare * 100).toFixed(0)}%`;
}

export function sessionsLine(s: MeasuredSnapshot): string {
	const n = s.activity.sessions;
	return `${n.toLocaleString("en-US")} ${n === 1 ? "session" : "sessions"}`;
}

export function activeDaysLine(s: MeasuredSnapshot): string {
	return `${s.activity.activeDays} of the last ${s.window.days} days`;
}

export const NEVER_SYNCED_TITLE = "This stack has not been measured yet.";
export const NEVER_SYNCED_BODY = `Stacks can publish what actually ran on the machine they are built on: sessions, models, tokens, and cost at API prices, read from ${HARNESS}.`;

/**
 * The owner's never-measured box (#58/#59): the site teaches the two commands
 * inline, on the page where the owner meets the gap. The visitor never sees
 * this - their variant stays the invitation above (#40: invite the reader,
 * never judge the author).
 */
export const OWNER_NOT_MEASURED_TITLE = "Your stack has not been measured yet.";
export const OWNER_NOT_MEASURED_BODY = `One command reads your ${HARNESS} history on your machine, shows you the full summary first, and publishes only what you approve.`;
export const PRIVACY_FOOTNOTE =
	"runs on your machine · you see everything before it sends · cancel sends nothing";

/**
 * The one mention automation gets before a first sync exists (#107 decision 3).
 *
 * A stack that never synced is NOT a quiet stack - it may be hand-curated and
 * complete - so this box carries no age and no warning. And it cannot offer the
 * switch as a fix: `enableAutoSync` refuses a machine that is not linked, and
 * the CLI's own answer there is "Run `npx @use-aistack/cli sync` first". So the
 * box teaches the one command, and this line says what becomes possible after
 * it.
 */
export const NEVER_SYNCED_AUTO_NOTE =
	"After that first sync, this stack can keep itself current on a schedule.";
