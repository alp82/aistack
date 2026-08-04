/**
 * PROTOTYPE — throwaway. Wayfinder ticket #84 (map #76).
 *
 * Formatters only. Each variant writes its OWN row phrasing, because "what a
 * row says" is one of the questions the prototype has to answer. Sharing the
 * numbers is fine. Sharing the sentence would decide the question by accident.
 */

export function fmtTokens(n: number): string {
	const abs = Math.abs(n);
	if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
	if (abs >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
	if (abs >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
	return String(n);
}

export function fmtDelta(n: number): string {
	return `${n >= 0 ? "+" : "−"}${fmtTokens(Math.abs(n))}`;
}

/** Short relative time. The feed lives or dies on this feeling true. */
export function fmtAgo(minutes: number): string {
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${Math.round(minutes)}m ago`;
	const hours = minutes / 60;
	if (hours < 24) return `${Math.round(hours)}h ago`;
	const days = hours / 24;
	if (days < 7) return `${Math.round(days)}d ago`;
	return `${Math.round(days / 7)}w ago`;
}

/** Fixed-width variant for a time gutter — no "ago", it is implied by the column. */
export function fmtGutter(minutes: number): string {
	if (minutes < 60) return `${Math.round(minutes)}m`;
	if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
	return `${Math.round(minutes / 1440)}d`;
}

const HARNESS_NAMES: Record<string, string> = {
	"claude-code": "Claude Code",
	codex: "Codex",
	cursor: "Cursor",
};

export function harnessName(slug: string): string {
	return HARNESS_NAMES[slug] ?? slug;
}

export function harnessList(slugs: readonly string[]): string {
	const names = slugs.map(harnessName);
	if (names.length <= 1) return names[0] ?? "";
	return `${names.slice(0, -1).join(", ")} + ${names[names.length - 1]}`;
}

/** Calendar bucket for a row, used by the variants that group. */
export function dayBucket(minutesAgo: number, now: number): string {
	const then = new Date(now - minutesAgo * 60_000);
	const today = new Date(now);
	const startOf = (d: Date) =>
		new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
	const daysBack = Math.round((startOf(today) - startOf(then)) / 86_400_000);
	if (daysBack === 0) return "TODAY";
	if (daysBack === 1) return "YESTERDAY";
	return then
		.toLocaleDateString("en-US", {
			weekday: "short",
			day: "2-digit",
			month: "short",
		})
		.toUpperCase();
}

export const MONO_LABEL =
	"font-mono text-[11px] font-semibold uppercase tracking-[0.25em]";

/** Whole-percent, no decimals. A share is never shown as a completeness score (#42). */
export function fmtPercent(share: number): string {
	return `${Math.round(share * 100)}%`;
}

/** Thousands separators for counts that get large (sessions, projects). */
export function fmtCount(n: number): string {
	return n.toLocaleString("en-US");
}
