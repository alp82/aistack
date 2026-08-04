/**
 * PROTOTYPE - Variant B: THE LOG. Wayfinder ticket #80.
 *
 * List-first, and deliberately CHART-FREE as the primary object. The bet: at 2
 * to 8 readings a line chart is decoration, and what actually proves the page
 * is alive is seeing that it was checked seven times in five days. A log reads
 * correctly at n=1 and still reads correctly at n=130.
 *
 * The only chart is a sparkline in the header strip, as texture.
 */
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { cn } from "@/lib/utils";
import { MONO_LABEL } from "../copy";
import { Sparkline } from "./charts";
import {
	fmtDelta,
	fmtStamp,
	fmtTokens,
	fmtUSD,
	harnessLabel,
	type ProtoPoint,
} from "./fixtures";

export const VARIANT_B_NAME = "The log: every reading, newest first";

const DAY = 86_400_000;
const MAX_ROWS = 12;

type Row = {
	point: ProtoPoint;
	prev: ProtoPoint | null;
	checks: number;
};

/**
 * Rows, newest first. Above ~20 readings the log collapses to one row per UTC
 * day - the same grain the nightly GC will eventually enforce anyway - and says
 * how many checks that day held.
 */
function buildRows(points: ProtoPoint[]): { rows: Row[]; collapsed: boolean } {
	const collapsed = points.length > 20;
	if (!collapsed) {
		const rows = points.map((p, i) => ({
			point: p,
			prev: i > 0 ? points[i - 1] : null,
			checks: 1,
		}));
		return { rows: rows.reverse(), collapsed };
	}
	const byDay = new Map<number, ProtoPoint[]>();
	for (const p of points) {
		const d = Math.floor(p.at / DAY);
		const list = byDay.get(d);
		if (list) list.push(p);
		else byDay.set(d, [p]);
	}
	const days = [...byDay.entries()].sort((a, b) => a[0] - b[0]);
	const rows: Row[] = days.map(([, list], i) => ({
		point: list[list.length - 1],
		prev: i > 0 ? days[i - 1][1].slice(-1)[0] : null,
		checks: list.length,
	}));
	return { rows: rows.reverse(), collapsed };
}

/** The two biggest share moves between two readings, as words. */
function movers(now: ProtoPoint, prev: ProtoPoint | null): string[] {
	if (!prev) return [];
	const out: { label: string; d: number }[] = [];
	for (const m of now.mix) {
		const before = prev.mix.find((x) => x.id === m.id);
		if (!before) {
			if (m.share >= 0.01)
				out.push({ label: `${m.label} appears`, d: m.share });
			continue;
		}
		const d = m.share - before.share;
		if (Math.abs(d) >= 0.01) {
			out.push({
				label: `${m.label} ${d > 0 ? "↑" : "↓"}${Math.abs(Math.round(d * 100))}pt`,
				d: Math.abs(d),
			});
		}
	}
	return out
		.sort((a, b) => b.d - a.d)
		.slice(0, 2)
		.map((x) => x.label);
}

export function VariantB({
	index,
	anchor,
	points,
}: {
	index: number;
	anchor: string;
	points: ProtoPoint[];
}) {
	const now = points[points.length - 1];
	const priced = now.usd !== null;
	const { rows, collapsed } = buildRows(points);
	const shown = rows.slice(0, MAX_ROWS);
	const trend = points.map((p) => (priced ? (p.usd ?? 0) : p.tokens));

	return (
		<Section index={index} id={anchor}>
			<SectionHeader
				index={String(index).padStart(2, "0")}
				kicker="// sync"
				title="Actual Usage"
				meta={`checked ${points.length}×`}
			/>

			{/* The current reading, compact, with the trend as texture only. */}
			<div className="flex flex-wrap items-end gap-x-10 gap-y-5 border-b border-stroke-subtle pb-8">
				<div>
					<p className="font-mono text-5xl font-black leading-none text-fg-primary md:text-6xl">
						{now.usd !== null ? `≈${fmtUSD(now.usd)}` : fmtTokens(now.tokens)}
					</p>
					<p className="mt-2 text-sm text-fg-muted">
						{priced
							? `at API prices, over the last ${now.windowDays} days`
							: `tokens over the last ${now.windowDays} days`}
					</p>
				</div>
				{points.length > 1 && (
					<div className="flex items-end gap-3 pb-1">
						<Sparkline values={trend} width={120} height={34} />
						<span className={cn(MONO_LABEL, "pb-1 text-fg-muted")}>
							{points.length} readings
						</span>
					</div>
				)}
				<p className="max-w-sm pb-1 text-sm leading-relaxed text-fg-muted">
					This is a rolling {now.windowDays}-day reading, not a running total.
					It moves every time it is checked, because the window moves with it.
				</p>
			</div>

			<p className={cn(MONO_LABEL, "mt-8 mb-3 text-accent-lime")}>
				{collapsed ? "one row per day" : "every reading"}
			</p>

			<ol className="list-none space-y-px border border-stroke-subtle bg-stroke-subtle p-0">
				{shown.map((row) => (
					<LogRow key={row.point.at} row={row} priced={priced} />
				))}
			</ol>

			{rows.length > shown.length && (
				<p className={cn(MONO_LABEL, "mt-3 text-fg-muted")}>
					+ {rows.length - shown.length} older {collapsed ? "days" : "readings"}
				</p>
			)}

			<div className="mt-6 space-y-1">
				{now.harnesses.map((h) => (
					<p key={h.name} className={cn(MONO_LABEL, "text-fg-muted")}>
						read from {harnessLabel(h.name)}
					</p>
				))}
			</div>
		</Section>
	);
}

function LogRow({ row, priced }: { row: Row; priced: boolean }) {
	const { point: p, prev } = row;
	const moved = movers(p, prev);
	const tokenDelta = prev ? p.tokens - prev.tokens : null;
	const usdDelta =
		prev && p.usd !== null && prev.usd !== null ? p.usd - prev.usd : null;

	return (
		<li className="grid grid-cols-2 items-center gap-x-6 gap-y-2 bg-bg-canvas px-4 py-3 md:grid-cols-[10rem_1fr_7rem_7rem_5rem]">
			<span className={cn(MONO_LABEL, "text-fg-primary")}>
				{fmtStamp(p.at)}
				{row.checks > 1 && (
					<span className="ml-2 normal-case tracking-normal text-fg-muted">
						{row.checks} checks
					</span>
				)}
			</span>

			<span className="col-span-2 flex flex-wrap items-center gap-2 md:col-span-1">
				{p.harnesses.map((h) => (
					<span
						key={h.name}
						className="border border-stroke-subtle px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-muted"
					>
						{harnessLabel(h.name)}
					</span>
				))}
				{moved.map((m) => (
					<span key={m} className="font-mono text-[11px] text-fg-muted">
						{m}
					</span>
				))}
				{!prev && (
					<span className="font-mono text-[11px] text-accent-lime">
						first reading
					</span>
				)}
			</span>

			<span className="text-right font-mono text-sm text-fg-primary">
				{fmtTokens(p.tokens)}
				{tokenDelta !== null && tokenDelta !== 0 && (
					<span className="ml-2 text-[11px] text-fg-muted">
						{fmtDelta(tokenDelta, fmtTokens)}
					</span>
				)}
			</span>

			<span className="text-right font-mono text-sm text-fg-primary">
				{priced && p.usd !== null ? fmtUSD(p.usd) : "-"}
				{usdDelta !== null && Math.round(usdDelta) !== 0 && (
					<span className="ml-2 text-[11px] text-fg-muted">
						{fmtDelta(usdDelta, fmtUSD)}
					</span>
				)}
			</span>

			<span className="text-right font-mono text-sm text-fg-muted">
				{p.sessions.toLocaleString("en-US")}
				<span className="ml-1 text-[10px] uppercase tracking-wider">sess</span>
			</span>
		</li>
	);
}
