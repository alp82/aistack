import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../convex/_generated/api";

/**
 * The activity feed's read model, exactly as Convex returns it, plus the
 * formatters both surfaces share.
 *
 * The server owns every figure and every exclusion. This module only decides
 * how a figure reads on screen - and the row GRAMMAR, which #84 locked:
 * movement leads, the total is demoted, the stack name is the link.
 */

export type Band = FunctionReturnType<typeof api.activityFeed.band>;
export type Stream = FunctionReturnType<typeof api.activityFeed.stream>;
export type FeedRow = Band["rows"][number];
export type DayPoint = Band["points"][number];
export type FeedFilter =
	| "all"
	| NonNullable<Stream["rows"][number]["event"]>["type"];

export const MONO_LABEL =
	"font-mono text-[11px] font-semibold uppercase tracking-[0.25em]";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Short scale, two decimals at billions where the difference is money. */
export function fmtTokens(n: number): string {
	const abs = Math.abs(n);
	if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
	if (abs >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
	if (abs >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
	return String(n);
}

/** A movement always carries its sign, because a fall is real (#84). */
export function fmtDelta(n: number): string {
	return `${n >= 0 ? "+" : "−"}${fmtTokens(Math.abs(n))}`;
}

export function fmtCount(n: number): string {
	return n.toLocaleString("en-US");
}

/**
 * Relative time. The feed lives or dies on this feeling true, so it is computed
 * against a clock that ticks - never baked into the HTML and left there.
 */
export function relativeLabel(at: number, now: number): string {
	const ms = Math.max(0, now - at);
	if (ms < MINUTE_MS) return "just now";
	// FLOOR, never round. Rounding overstates age at every boundary - it prints
	// "60m ago" instead of "1h ago", and it puts "2d ago" on a row the day
	// kicker above it calls YESTERDAY.
	if (ms < HOUR_MS) return `${Math.floor(ms / MINUTE_MS)}m ago`;
	if (ms < DAY_MS) return `${Math.floor(ms / HOUR_MS)}h ago`;
	const days = Math.floor(ms / DAY_MS);
	if (days < 7) return `${days}d ago`;
	return `${Math.floor(days / 7)}w ago`;
}

/** The calendar kicker over a group of rows: TODAY, YESTERDAY, WED 05 AUG. */
export function dayBucket(at: number, now: number): string {
	const startOf = (ms: number) => {
		const d = new Date(ms);
		return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
	};
	const daysBack = Math.round((startOf(now) - startOf(at)) / DAY_MS);
	if (daysBack === 0) return "TODAY";
	if (daysBack === 1) return "YESTERDAY";
	// `WED 05 AUG`, assembled part by part: the locale's own short date puts a
	// comma in ("Wed, Aug 05") and orders it the other way.
	const d = new Date(at);
	const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
	const month = d.toLocaleDateString("en-US", { month: "short" });
	const day = String(d.getDate()).padStart(2, "0");
	return `${weekday} ${day} ${month}`.toUpperCase();
}

const HARNESS_LABELS: Record<string, string> = {
	"claude-code": "Claude Code",
	codex: "Codex",
	// Lowercase brands: the wire name is the label, but each is an explicit
	// row so a rename cannot silently leak a raw slug (#130).
	opencode: "opencode",
	"pi-mono": "pi-mono",
};

/** Wire names in words. An unknown harness keeps its wire spelling. */
export function harnessLabel(name: string): string {
	return HARNESS_LABELS[name] ?? name;
}

export function harnessList(names: readonly string[]): string {
	const labels = names.map(harnessLabel);
	if (labels.length <= 1) return labels[0] ?? "";
	return `${labels.slice(0, -1).join(", ")} + ${labels[labels.length - 1]}`;
}

/**
 * Days the watermark actually has a reading for. Below three there is no shape
 * to draw, so the band drops the watermark rather than drawing a straight line
 * through days nobody measured (#80, #84).
 */
export function liveDays(points: readonly DayPoint[]): number {
	return points.filter((p) => p.value > 0).length;
}

/** Total tokens a sync reported, summed over the harnesses in its batch. */
export function syncTokens(row: FeedRow): number {
	if (row.event.type !== "sync.landed") return 0;
	return row.event.harnesses.reduce((sum, h) => sum + h.totalTokens, 0);
}

/** `alp/ai-stack-ab12` - the compact identity a one-line surface has room for. */
export function rowHandle(row: FeedRow): string {
	return `${row.stack.creator}/${row.stack.slug}`;
}

/**
 * The event in a few words, for surfaces that demote the feed to a single
 * line (the landing hero's `latest:`). Same grammar as the full row: movement
 * leads, and nothing claims a movement it could not measure (#84, #129).
 */
export function rowSummary(row: FeedRow): string {
	const event = row.event;
	if (event.type === "sync.landed") {
		if (row.firstReading) {
			return `first reading - ${fmtTokens(syncTokens(row))}`;
		}
		const delta = row.deltaTokens;
		return delta === null
			? `${fmtTokens(syncTokens(row))} measured`
			: `${fmtDelta(delta)} measured`;
	}
	if (event.type === "stack.published") {
		return `joined with ${event.toolCount} ${
			event.toolCount === 1 ? "tool" : "tools"
		}`;
	}
	const added = event.added[0]?.name;
	const removed = event.removed[0]?.name;
	if (added && removed) return `picked up ${added} · dropped ${removed}`;
	if (added) return `picked up ${added}`;
	if (removed) return `dropped ${removed}`;
	return "changed composition";
}

/**
 * The facts under a sync row - EVENT-ONLY, all three of them (#84, #96).
 * Anything richer needs the snapshot join, and the band already pays for that
 * once; paying per row turns a four-row strip into forty document reads.
 */
export function syncFacts(row: FeedRow): string[] {
	if (row.event.type !== "sync.landed") return [];
	const harnesses = row.event.harnesses;
	const sessions = harnesses.reduce((sum, h) => sum + h.sessions, 0);
	const windowDays = harnesses[0]?.windowDays ?? 30;
	return [
		harnessList(harnesses.map((h) => h.harness)),
		`${fmtTokens(syncTokens(row))} over ${windowDays} days`,
		`${fmtCount(sessions)} ${sessions === 1 ? "session" : "sessions"}`,
	];
}
