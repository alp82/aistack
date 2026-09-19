/**
 * PROTOTYPE - throwaway (#463, map #462). The blocks the three layouts share.
 *
 * A block answers one question, in the model breakdown's form: a solid
 * full-width bar, the figure at the right edge, a hatched notch for the
 * previous period. No block prints a sentence.
 *
 * COLOR: a categorical set (harnesses, models, phases) wears the validated
 * palette and the color follows the entity. A single series (skills, MCP
 * servers, languages, the heatmap, lines changed) wears the page accent.
 */
import type { ReactNode } from "react";
import { CHART_PAINTS } from "@/features/charts";
import { fmtShare, fmtTokens } from "@/features/measured/copy";
import {
	fmtCount,
	fmtLines,
	fmtMinutes,
	fmtPercent,
	fmtSeconds,
	hourLabel,
	MONO_LABEL,
	PHASE_PAINT,
	type WorkflowView,
	weekdayLabel,
} from "@/features/workflow/copy";
import {
	EFFORT_SHOWN,
	effortShares,
	heatCells,
	languages,
	namedPhaseMix,
	playbookOf,
	type Ranked,
	routing,
	startProfile,
	sumBy,
	thinkingByHarness,
	turnHistogram,
} from "@/features/workflow/derive";
import { heatPaint, Tip } from "@/features/workflow/parts";
import { cn } from "@/lib/utils";
import {
	CONTEXT_PAINT,
	type ContextHarness,
	fmtWholeShare,
	type WaffleCell,
	waffleCells,
} from "../context";
import type { UsageReading } from "../copy";
import { HARNESS_LABELS, harnessLabel } from "../HarnessShareRows";

const ACCENT = "var(--accent-lime)";
const NOTCH =
	"repeating-linear-gradient(135deg, var(--fg-primary) 0 2px, var(--bg-canvas) 2px 4px)";

/** A harness keeps one palette slot on every stack: the color follows the entity. */
const HARNESS_ORDER = Object.keys(HARNESS_LABELS);
export function harnessPaint(name: string): string {
	const index = HARNESS_ORDER.indexOf(name);
	return CHART_PAINTS[
		(index < 0 ? HARNESS_ORDER.length : index) % CHART_PAINTS.length
	] as string;
}

// ---------------------------------------------------------------------------
// Frame.
// ---------------------------------------------------------------------------

/** The visible marker on a figure the server cannot fold yet. */
export function Stub({ what = "previous period" }: { what?: string }) {
	return (
		<span
			title={`Stub: the server has no fold for the ${what} yet.`}
			className="border border-dashed border-orange-400 px-1 font-mono text-[9px] uppercase tracking-wider text-orange-400"
		>
			stub
		</span>
	);
}

export function Block({
	title,
	figure,
	note,
	children,
	className,
}: {
	title: string;
	/** The block's one headline figure, at the right edge of the title line. */
	figure?: ReactNode;
	/** Mono, muted, beside the title. Counts only. */
	note?: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	return (
		<section className={cn("min-w-0", className)}>
			<header className="mb-4 flex items-baseline gap-3">
				<h3 className={cn(MONO_LABEL, "text-accent-lime")}>{title}</h3>
				{note && (
					<span className="font-mono text-[11px] text-fg-muted">{note}</span>
				)}
				{figure && (
					<span className="ml-auto font-mono text-sm font-bold text-fg-primary">
						{figure}
					</span>
				)}
			</header>
			{children}
		</section>
	);
}

// ---------------------------------------------------------------------------
// Share rows: the model breakdown's form, for any ranked set.
// ---------------------------------------------------------------------------

export type ShareRow = {
	key: string;
	label: string;
	paint: string;
	/** Bar width, 0..1. */
	share: number;
	/** Where the bar stood in the previous period, 0..1. "stub" draws a marked fake. */
	first?: number | "stub" | null;
	/** Bold figure at the right edge. */
	figure: string;
	/** Muted figure after it. */
	sub?: string;
	dim?: boolean;
	tip?: ReactNode;
	/** The part of the fill, 0..1, drawn hatched at its right end. */
	inset?: number;
};

export function ShareRows({
	rows,
	slim = false,
	labelWidth = "w-40",
}: {
	rows: readonly ShareRow[];
	slim?: boolean;
	labelWidth?: string;
}) {
	return (
		<ul className="divide-y divide-stroke-subtle border-y border-stroke-subtle">
			{rows.map((row) => {
				const stub = row.first === "stub";
				// A stubbed notch sits at a fixed fake offset so the form can be judged.
				const at = stub ? row.share * 0.85 : row.first;
				const moved =
					typeof at === "number" && Math.abs(at - row.share) >= 0.005;
				const drift = typeof at === "number" ? (row.share - at) * 100 : 0;
				return (
					<li
						key={row.key}
						className={cn("flex items-center gap-3", slim ? "py-2" : "py-3")}
					>
						<span
							aria-hidden="true"
							className={cn("size-3 shrink-0", row.dim && "opacity-50")}
							style={{ background: row.paint }}
						/>
						<span
							className={cn(
								labelWidth,
								"shrink-0 truncate text-sm text-fg-primary",
								row.dim && "opacity-50",
							)}
							title={row.label}
						>
							{row.label}
						</span>
						<Tip className="flex min-w-0 flex-1" label={row.tip ?? row.label}>
							<span
								className={cn(
									"relative block w-full bg-bg-panel",
									slim ? "h-5" : "h-7",
								)}
							>
								<span
									className={cn(
										"absolute inset-y-0 left-0",
										row.dim && "opacity-50",
									)}
									style={{
										width: `${Math.min(100, Math.max(1, row.share * 100))}%`,
										background: row.paint,
									}}
								/>
								{row.inset !== undefined && row.inset > 0 && (
									<span
										aria-hidden="true"
										className="absolute inset-y-0"
										style={{
											left: `${row.share * (1 - row.inset) * 100}%`,
											width: `${row.share * row.inset * 100}%`,
											backgroundImage:
												"repeating-linear-gradient(135deg, transparent 0 3px, var(--bg-canvas) 3px 5px)",
										}}
									/>
								)}
								{moved && (
									<span
										aria-hidden="true"
										className={cn(
											"absolute -top-1 -bottom-1 w-[6px] -translate-x-1/2",
											stub && "outline outline-1 outline-orange-400",
										)}
										style={{
											left: `${Math.min(100, Math.max(0, (at as number) * 100))}%`,
											backgroundImage: NOTCH,
										}}
									/>
								)}
							</span>
						</Tip>
						<span className="w-14 shrink-0 text-right font-mono text-sm font-bold text-fg-primary">
							{row.figure}
						</span>
						{row.sub !== undefined && (
							<span className="w-16 shrink-0 text-right font-mono text-[11px] text-fg-muted">
								{row.sub}
							</span>
						)}
						<span className="w-9 shrink-0 text-right font-mono text-[11px] text-fg-muted">
							{stub ? (
								<Stub />
							) : moved && Math.abs(drift) >= 0.5 ? (
								`${drift > 0 ? "↑" : "↓"}${Math.abs(Math.round(drift))}`
							) : (
								"-"
							)}
						</span>
					</li>
				);
			})}
		</ul>
	);
}

// ---------------------------------------------------------------------------
// Tiles.
// ---------------------------------------------------------------------------

export type TileSpec = {
	key: string;
	label: string;
	value: string;
	/** Real previous-period value, "stub", or null for none. */
	previous?: { current: number; previous: number } | "stub" | null;
	/** A 0..1 fill under the number, for a share. */
	meter?: number;
};

export function Tile({ tile, big = false }: { tile: TileSpec; big?: boolean }) {
	const prev = tile.previous;
	let chip: ReactNode = null;
	if (prev === "stub") chip = <Stub />;
	else if (prev && prev.previous > 0) {
		const ratio = (prev.current - prev.previous) / prev.previous;
		const pct = Math.round(Math.abs(ratio) * 100);
		chip = (
			<span
				className={cn(
					"font-mono text-[11px]",
					ratio > 0 ? "text-accent-lime" : "text-fg-muted",
				)}
			>
				{pct === 0 ? "±0%" : `${ratio > 0 ? "▲" : "▼"} ${pct}%`}
			</span>
		);
	}
	return (
		<div className="flex min-w-0 flex-col gap-1.5 border border-stroke-subtle bg-bg-panel p-4">
			<span
				className={cn(
					"font-mono font-black leading-none text-fg-primary",
					big ? "text-4xl" : "text-[28px]",
				)}
			>
				{tile.value}
			</span>
			{tile.meter !== undefined && (
				<span className="block h-1.5 w-full bg-bg-canvas">
					<span
						className="block h-full"
						style={{
							width: `${Math.max(1, tile.meter * 100)}%`,
							background: ACCENT,
						}}
					/>
				</span>
			)}
			<span className="flex items-baseline justify-between gap-2">
				<span className="truncate font-mono text-[11px] uppercase tracking-wider text-fg-muted">
					{tile.label}
				</span>
				{chip}
			</span>
		</div>
	);
}

/** Every tile candidate, in the starting tiering's order. */
export function tileSpecs(
	current: UsageReading,
	previous: UsageReading | null,
	view: WorkflowView | null,
	days: number,
): TileSpec[] {
	const cmp = (pick: (r: UsageReading) => number) =>
		previous ? { current: pick(current), previous: pick(previous) } : null;
	const tiles: TileSpec[] = [
		{
			key: "active-days",
			label: "active days",
			value: `${current.activeDays}/${days}`,
			previous: cmp((r) => r.activeDays),
			meter: current.activeDays / days,
		},
		{
			key: "sessions",
			label: "sessions",
			value: current.sessions.toLocaleString("en-US"),
			previous: cmp((r) => r.sessions),
		},
		{
			key: "cache-hits",
			label: "cache hits",
			value: fmtPercent(current.cacheHitShare),
			previous: cmp((r) => r.cacheHitShare),
			meter: current.cacheHitShare,
		},
		{
			key: "subagents",
			label: "run by subagents",
			value: fmtPercent(current.subagentShare),
			previous: cmp((r) => r.subagentShare),
			meter: current.subagentShare,
		},
	];
	if (view) {
		const playbook = playbookOf(view);
		if (playbook) {
			tiles.push({
				key: "session-length",
				label: "median session",
				value: fmtMinutes(playbook.splitMinutes),
				previous: "stub",
			});
		}
		const thinking = thinkingShare(view);
		if (thinking !== null) {
			tiles.push({
				key: "thinking",
				label: "thinking share",
				value: fmtPercent(thinking),
				previous: "stub",
				meter: thinking,
			});
		}
	}
	return tiles;
}

export function thinkingShare(view: WorkflowView): number | null {
	let thinking = 0;
	let response = 0;
	for (const h of view.section.harnesses) {
		thinking += h.thinking?.thinkingTokens ?? 0;
		response += h.thinking?.responseTokens ?? 0;
	}
	return response > 0 ? thinking / response : null;
}

// ---------------------------------------------------------------------------
// Row builders.
// ---------------------------------------------------------------------------

export function harnessRows(
	current: UsageReading,
	previous: UsageReading | null,
	stackToolSlugs: readonly string[],
): ShareRow[] {
	const total = sumBy(current.harnesses, (h) => h.totalTokens);
	const before = previous ? sumBy(previous.harnesses, (h) => h.totalTokens) : 0;
	return [...current.harnesses]
		.filter((h) => total > 0 && fmtShare(h.totalTokens / total) !== "0.0%")
		.sort((a, b) => b.totalTokens - a.totalTokens)
		.map((h) => {
			const was = previous?.harnesses.find((p) => p.harness === h.harness);
			return {
				key: h.harness,
				label: harnessLabel(h.harness),
				paint: harnessPaint(h.harness),
				share: h.totalTokens / total,
				first: previous
					? before > 0
						? (was?.totalTokens ?? 0) / before
						: 0
					: null,
				figure: fmtShare(h.totalTokens / total),
				sub: `${h.sessions.toLocaleString("en-US")} ses`,
				dim: !stackToolSlugs.includes(h.harness),
				tip: `${harnessLabel(h.harness)} · ${fmtTokens(h.totalTokens)} tokens · ${h.sessions.toLocaleString("en-US")} sessions`,
			};
		});
}

/** A kit list (skills, MCP servers, subagent types) with absolute calls. */
export function kitRows(
	view: WorkflowView,
	kind: "skills" | "mcpServers" | "subagents",
	max = 8,
): { rows: ShareRow[]; hidden: number; withheld: number } {
	const byName = new Map<string, { share: number; calls: number | null }>();
	for (const harness of view.kit) {
		for (const atom of harness[kind]) {
			const held = byName.get(atom.name) ?? { share: 0, calls: 0 };
			byName.set(atom.name, {
				share: held.share + atom.callShare,
				calls:
					held.calls === null || atom.calls === null
						? null
						: held.calls + atom.calls,
			});
		}
	}
	const ranked = [...byName.entries()]
		.filter(([, v]) => v.share > 0)
		.sort((a, b) => b[1].share - a[1].share || a[0].localeCompare(b[0]));
	const widest = ranked[0]?.[1].share ?? 1;
	const norm = sumBy(ranked, ([, v]) => v.share) || 1;
	return {
		rows: ranked.slice(0, max).map(([name, v]) => ({
			key: name,
			label: name,
			paint: ACCENT,
			share: v.share / widest,
			first: "stub" as const,
			figure: fmtPercent(v.share / norm),
			sub: v.calls === null ? "" : `${fmtCount(v.calls)}×`,
		})),
		hidden: Math.max(0, ranked.length - max),
		withheld: sumBy(view.kit, (h) => h.withheld[kind]),
	};
}

export function KitFoot({
	hidden,
	withheld,
}: {
	hidden: number;
	withheld: number;
}) {
	if (hidden === 0 && withheld === 0) return null;
	return (
		<p className="mt-2 font-mono text-[11px] text-fg-muted">
			{[
				hidden > 0 ? `+${hidden} more` : null,
				withheld > 0 ? `${withheld} withheld` : null,
			]
				.filter(Boolean)
				.join(" · ")}
		</p>
	);
}

export function languageRows(view: WorkflowView, max = 6): ShareRow[] {
	const { rows, total } = languages(view);
	const widest = rows[0]?.value ?? 1;
	return rows.slice(0, max).map((row) => ({
		key: row.name,
		label: row.name,
		paint: ACCENT,
		share: row.value / widest,
		first: "stub" as const,
		figure: fmtPercent(total > 0 ? row.value / total : 0),
		sub: fmtLines(row.value),
	}));
}

/** Which models the subagents run on, as share rows. */
export function subagentModelRows(
	view: WorkflowView,
	modelPaint: (id: string) => string,
	modelLabel: (id: string) => string,
): ShareRow[] {
	const r = routing(view);
	return r.subagents.slice(0, 5).map((row: Ranked) => ({
		key: row.name,
		label: modelLabel(row.name),
		paint: modelPaint(row.name),
		share: r.subagentTokens > 0 ? row.value / r.subagentTokens : 0,
		first: "stub" as const,
		figure: fmtShare(r.subagentTokens > 0 ? row.value / r.subagentTokens : 0),
		sub: fmtTokens(row.value),
	}));
}

// ---------------------------------------------------------------------------
// Context waffle.
// ---------------------------------------------------------------------------

const CELL: Record<WaffleCell, React.CSSProperties> = {
	harness: { background: CONTEXT_PAINT.harness },
	instructions: { background: CONTEXT_PAINT.instructions },
	usualChat: { background: CONTEXT_PAINT.usualChat },
	longChat: {
		background: "transparent",
		boxShadow: "inset 0 0 0 1px var(--stroke-strong)",
	},
	free: { background: "var(--bg-panel-muted)" },
};

export function Waffle({
	h,
	cols = 20,
	className,
}: {
	h: ContextHarness;
	/** 20 columns is a square-ish grid; 40 is a band. */
	cols?: 20 | 40;
	className?: string;
}) {
	if (h.window === null) {
		return (
			<p className="font-mono text-2xl font-black text-fg-primary">
				{fmtTokens(h.medianCall)}
			</p>
		);
	}
	const cells = waffleCells(h, h.window);
	return (
		<div
			role="img"
			aria-label={`${harnessLabel(h.harness)}: a typical call uses ${fmtTokens(h.medianCall)} of a ${fmtTokens(h.window)} window`}
			className={cn("grid gap-[3px]", className)}
			style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
		>
			{cells.map((cell, i) => (
				<span
					// biome-ignore lint/suspicious/noArrayIndexKey: cells are positional
					key={i}
					className="block aspect-square w-full"
					style={
						cell === "usualChat" && h.breakdownAvailable === false
							? { background: ACCENT }
							: CELL[cell]
					}
				/>
			))}
		</div>
	);
}

export function WaffleHead({ h }: { h: ContextHarness }) {
	return (
		<p className="mb-2 flex items-baseline gap-2">
			<b className="text-sm text-fg-primary">{harnessLabel(h.harness)}</b>
			<span className="ml-auto font-mono text-lg font-black leading-none text-fg-primary">
				{h.window === null
					? fmtTokens(h.medianCall)
					: fmtWholeShare(h.medianCall / h.window)}
			</span>
			{h.window !== null && (
				<span className="font-mono text-[11px] text-fg-muted">
					{fmtTokens(h.medianCall)} / {fmtTokens(h.window)}
				</span>
			)}
		</p>
	);
}

export function WaffleLegend() {
	const entries = [
		["harness", CONTEXT_PAINT.harness],
		["instructions", CONTEXT_PAINT.instructions],
		["usual chat", CONTEXT_PAINT.usualChat],
	] as const;
	return (
		<p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-fg-muted">
			{entries.map(([label, paint]) => (
				<span key={label} className="inline-flex items-center gap-1.5">
					<i className="block size-2.5" style={{ background: paint }} />
					{label}
				</span>
			))}
			<span className="inline-flex items-center gap-1.5">
				<i className="block size-2.5 shadow-[inset_0_0_0_1px_var(--stroke-strong)]" />
				1 in 10 chats
			</span>
		</p>
	);
}

// ---------------------------------------------------------------------------
// The week.
// ---------------------------------------------------------------------------

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const WEEKDAY_ROWS = [1, 2, 3, 4, 5, 6, 0];

export function Heat({
	view,
	startMarginal = false,
	cell = "h-6",
}: {
	view: WorkflowView;
	/** Draw session starts per hour as a bar strip over the grid. */
	startMarginal?: boolean;
	cell?: string;
}) {
	const cells = heatCells(view, "sessions");
	const busiest = cells.size > 0 ? Math.max(...cells.values()) : 0;
	const starts = startProfile(view);
	const mostStarts = Math.max(...starts, 0);
	if (cells.size === 0) return <Empty>no event clock</Empty>;
	return (
		<div>
			{startMarginal && mostStarts > 0 && (
				<div className="mb-1 flex h-10 items-end gap-0.5">
					<span className="w-9 shrink-0 self-end font-mono text-[9px] leading-none text-fg-muted">
						starts
					</span>
					{HOURS.map((hour) => (
						<Tip
							key={hour}
							className="flex h-full min-w-0 flex-1 items-end"
							label={`${hourLabel(hour)} · ${fmtCount(starts[hour] ?? 0)} session starts`}
						>
							<i
								className="block w-full"
								style={{
									height: `${((starts[hour] ?? 0) / mostStarts) * 100}%`,
									minHeight: (starts[hour] ?? 0) > 0 ? 1 : 0,
									background: "var(--fg-muted)",
								}}
							/>
						</Tip>
					))}
				</div>
			)}
			{WEEKDAY_ROWS.map((weekday) => (
				<div key={weekday} className="flex items-stretch gap-0.5 pb-0.5">
					<span className="flex w-9 shrink-0 items-center font-mono text-[10px] text-fg-muted">
						{weekdayLabel(weekday)}
					</span>
					{HOURS.map((hour) => {
						const count = cells.get(`${weekday}-${hour}`) ?? 0;
						return (
							<Tip
								key={hour}
								className="flex min-w-0 flex-1"
								label={`${weekdayLabel(weekday)} ${hourLabel(hour)} · ${fmtCount(count)} events`}
							>
								<span
									className={cn("block w-full", cell)}
									style={{ background: heatPaint(count, busiest) }}
								/>
							</Tip>
						);
					})}
				</div>
			))}
			<div className="flex items-center gap-0.5">
				<span className="w-9 shrink-0" />
				{HOURS.map((hour) => (
					<span
						key={hour}
						className="flex-1 text-center font-mono text-[9px] text-fg-muted"
					>
						{hour % 6 === 0 ? hour : ""}
					</span>
				))}
			</div>
		</div>
	);
}

/** Session starts per hour, on its own: the dead histogram, revived to judge it. */
export function StartHoursBars({ view }: { view: WorkflowView }) {
	const starts = startProfile(view);
	const most = Math.max(...starts, 0);
	if (most === 0) return <Empty>no session starts</Empty>;
	return (
		<div>
			<div className="flex h-24 items-end gap-0.5">
				{HOURS.map((hour) => (
					<Tip
						key={hour}
						className="flex h-full min-w-0 flex-1 items-end"
						label={`${hourLabel(hour)} · ${fmtCount(starts[hour] ?? 0)} starts`}
					>
						<i
							className="block w-full"
							style={{
								height: `${((starts[hour] ?? 0) / most) * 100}%`,
								background: ACCENT,
							}}
						/>
					</Tip>
				))}
			</div>
			<div className="mt-1 flex gap-0.5">
				{HOURS.map((hour) => (
					<span
						key={hour}
						className="flex-1 text-center font-mono text-[9px] text-fg-muted"
					>
						{hour % 6 === 0 ? hour : ""}
					</span>
				))}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Lines changed per day.
// ---------------------------------------------------------------------------

function nextDate(date: string): string {
	const next = new Date(`${date}T00:00:00Z`);
	next.setUTCDate(next.getUTCDate() + 1);
	return next.toISOString().slice(0, 10);
}

export function LinesPerDay({
	view,
	height = "h-36",
}: {
	view: WorkflowView;
	height?: string;
}) {
	const days = view.section.gitDays;
	const byDate = new Map(days.map((day) => [day.date, day]));
	const slots: string[] = [];
	for (
		let date = view.window.from;
		date <= view.window.to && slots.length < 62;
		date = nextDate(date)
	) {
		slots.push(date);
	}
	// The baseline sits where the data puts it: each half gets the height its
	// own tallest bar needs, on one shared scale.
	const topAdd = Math.max(...days.map((d) => d.additions), 0);
	const topRem = Math.max(...days.map((d) => d.removals), 0);
	const up = Math.max(0.15, Math.min(0.85, topAdd / (topAdd + topRem || 1)));
	// The lines the whole height stands for, so both halves share one scale.
	const full = Math.max(topAdd / up, topRem / (1 - up)) || 1;
	if (view.section.git.commits === 0) return <Empty>no commits</Empty>;
	return (
		<div>
			<div className={cn("flex items-stretch gap-0.5", height)}>
				{slots.map((date) => {
					const day = byDate.get(date);
					const empty = !day || day.commits === 0;
					return (
						<Tip
							key={date}
							className="flex min-w-0 flex-1"
							label={
								day
									? `${date} · +${fmtCount(day.additions)} -${fmtCount(day.removals)} · ${fmtCount(day.commits)} commits`
									: `${date} · no measured day`
							}
						>
							<span className="flex h-full w-full flex-col">
								<span className="flex items-end" style={{ flex: up }}>
									{!empty && (
										<i
											className="block min-h-px w-full"
											style={{
												height: `${(day.additions / (full * up)) * 100}%`,
												background: ACCENT,
											}}
										/>
									)}
								</span>
								<i
									className="block h-px w-full shrink-0"
									style={{
										background: empty
											? "var(--stroke-strong)"
											: "var(--fg-muted)",
									}}
								/>
								<span className="flex items-start" style={{ flex: 1 - up }}>
									{!empty && (
										<i
											className="block min-h-px w-full"
											style={{
												height: `${(day.removals / (full * (1 - up))) * 100}%`,
												background: "var(--destructive-fill)",
											}}
										/>
									)}
								</span>
							</span>
						</Tip>
					);
				})}
			</div>
			<p className="mt-1 flex justify-between font-mono text-[9px] text-fg-muted">
				<span>{view.window.from.slice(5)}</span>
				<span>{view.window.to.slice(5)}</span>
			</p>
		</div>
	);
}

export function LinesFigure({ view }: { view: WorkflowView }) {
	const git = view.section.git;
	return (
		<span className="flex items-baseline gap-3">
			<span>+{fmtLines(git.additions)}</span>
			<span className="text-fg-muted">-{fmtLines(git.removals)}</span>
			<span className="text-[11px] font-normal text-fg-muted">
				{fmtCount(git.commits)} commits
			</span>
		</span>
	);
}

// ---------------------------------------------------------------------------
// Phases, effort, thinking, turn length.
// ---------------------------------------------------------------------------

type Seg = { key: string; label: string; paint: string; value: number };

/** One stacked strip at the standard's bar height, with a legend that carries the figures. */
export function SegStrip({
	segments,
	legend = true,
}: {
	segments: readonly Seg[];
	legend?: boolean;
}) {
	const total = sumBy(segments, (s) => s.value) || 1;
	return (
		<div>
			<div className="flex h-7 w-full gap-0.5 bg-bg-panel">
				{segments
					.filter((s) => s.value > 0)
					.map((s) => (
						<span
							key={s.key}
							className="flex min-w-0"
							style={{ flexGrow: s.value, flexBasis: 0 }}
						>
							<Tip
								className="flex min-w-0 flex-1"
								label={`${s.label} · ${fmtPercent(s.value / total)}`}
							>
								<span
									className="block h-full w-full"
									style={{ background: s.paint }}
								/>
							</Tip>
						</span>
					))}
			</div>
			{legend && (
				<p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-fg-muted">
					{segments.map((s) => (
						<span key={s.key} className="inline-flex items-center gap-1.5">
							<i className="block size-2.5" style={{ background: s.paint }} />
							{s.label}
							<b className="text-fg-primary">{fmtPercent(s.value / total)}</b>
						</span>
					))}
				</p>
			)}
		</div>
	);
}

export function phaseSegments(view: WorkflowView): Seg[] {
	return namedPhaseMix(view).map((row) => ({
		key: row.phase,
		label: row.phase,
		paint: PHASE_PAINT[row.phase],
		value: row.share,
	}));
}

/** The playbook's two tracks as two strips: the revived phase playbook. */
export function PhaseTracks({ view }: { view: WorkflowView }) {
	const playbook = playbookOf(view);
	if (!playbook) return null;
	return (
		<div className="mt-4 grid gap-3 sm:grid-cols-2">
			{playbook.tracks.map((track) => (
				<div key={track.id}>
					<p className="mb-1 flex items-baseline justify-between font-mono text-[11px] text-fg-muted">
						<span>
							{track.label} · {track.sessions}
						</span>
						<b className="text-fg-primary">{fmtMinutes(track.medianMinutes)}</b>
					</p>
					<SegStrip
						legend={false}
						segments={(["scout", "build", "verify", "handoff"] as const).map(
							(phase) => ({
								key: phase,
								label: phase,
								paint: PHASE_PAINT[phase],
								value: track.phaseShare[phase],
							}),
						)}
					/>
				</div>
			))}
		</div>
	);
}

/** Effort is an ordered scale, so it wears one hue, light to dark. */
export function effortSegments(view: WorkflowView): Seg[] {
	const shares = effortShares(view);
	const mix = { low: 30, medium: 60, high: 100 } as const;
	return EFFORT_SHOWN.map((level) => ({
		key: level,
		label: level,
		paint: `color-mix(in oklab, var(--accent-lime) ${mix[level as keyof typeof mix]}%, var(--bg-panel))`,
		value: shares[level],
	}));
}

export function thinkingRows(view: WorkflowView): ShareRow[] {
	return thinkingByHarness(view)
		.filter(
			(row): row is { harness: string; share: number } => row.share !== null,
		)
		.sort((a, b) => b.share - a.share)
		.map((row) => ({
			key: row.harness,
			label: harnessLabel(row.harness),
			paint: harnessPaint(row.harness),
			share: row.share,
			first: "stub" as const,
			figure: fmtPercent(row.share),
		}));
}

export function TurnBars({ view }: { view: WorkflowView }) {
	const histogram = turnHistogram(view);
	const most = Math.max(...histogram.buckets.map((b) => b.turns), 0);
	if (most === 0) return <Empty>no turn clock</Empty>;
	return (
		<div>
			<div className="flex h-24 items-end gap-0.5">
				{histogram.buckets.map((bucket, i) => (
					<Tip
						key={bucket.bucket}
						className="flex h-full min-w-0 flex-1 items-end"
						label={`${bucket.label} · ${fmtCount(bucket.turns)} turns`}
					>
						<i
							className="block w-full"
							style={{
								height: `${(bucket.turns / most) * 100}%`,
								background:
									i === histogram.median ? "var(--fg-primary)" : ACCENT,
							}}
						/>
					</Tip>
				))}
			</div>
			<div className="mt-1 flex gap-0.5">
				{histogram.buckets.map((bucket, i) => (
					<span
						key={bucket.bucket}
						className="flex-1 truncate text-center font-mono text-[9px] text-fg-muted"
					>
						{i % 2 === 0 ? bucket.label : ""}
					</span>
				))}
			</div>
		</div>
	);
}

export function turnMedian(view: WorkflowView): string | null {
	const seconds = turnHistogram(view).medianSeconds;
	return seconds === undefined ? null : fmtSeconds(seconds);
}

export function Empty({ children }: { children: ReactNode }) {
	return (
		<p className="border border-dashed border-stroke-subtle px-3 py-4 font-mono text-[11px] text-fg-muted">
			{children}
		</p>
	);
}

// ---------------------------------------------------------------------------
// A v2: every block but the model breakdown gets a form of its own, so the
// model breakdown stays recognizable.
// ---------------------------------------------------------------------------

/** Subagent routing: the models' own colors, bars half the standard's height, no rules. */
export function HalfRows({ rows }: { rows: readonly ShareRow[] }) {
	return (
		<ul className="space-y-2">
			{rows.map((row) => (
				<li key={row.key} className="flex items-center gap-3">
					<span className="w-[11.5rem] shrink-0 truncate pl-6 text-[13px] text-fg-secondary">
						{row.label}
					</span>
					<span className="block h-3.5 flex-1 bg-bg-panel">
						<span
							className="block h-full"
							style={{
								width: `${Math.min(100, Math.max(0.5, row.share * 100))}%`,
								background: row.paint,
							}}
						/>
					</span>
					<span className="w-14 shrink-0 text-right font-mono text-xs font-bold text-fg-primary">
						{row.figure}
					</span>
					<span className="w-12 shrink-0 text-right font-mono text-[11px] text-fg-muted">
						{row.sub}
					</span>
				</li>
			))}
		</ul>
	);
}

/**
 * Harness shares as a pie. The thin outer ring is the previous period, so the
 * notch's job survives the change of form.
 */
export function HarnessPie({ rows }: { rows: readonly ShareRow[] }) {
	const R = 20;
	const C = 2 * Math.PI * R;
	const RING = 46;
	const RC = 2 * Math.PI * RING;
	const hasPrevious = rows.some((row) => typeof row.first === "number");
	let at = 0;
	let ringAt = 0;
	return (
		<div className="flex items-center gap-6">
			<svg
				viewBox="0 0 100 100"
				className="size-44 shrink-0 -rotate-90"
				role="img"
				aria-label="Harness token shares"
			>
				{rows.map((row) => {
					const length = row.share * C;
					const node = (
						<circle
							key={row.key}
							cx="50"
							cy="50"
							r={R}
							fill="none"
							stroke={row.paint}
							strokeWidth={R * 2}
							strokeDasharray={`${Math.max(0.4, length - 0.5)} ${C}`}
							strokeDashoffset={-at}
							opacity={row.dim ? 0.5 : 1}
						>
							<title>{`${row.label} ${row.figure}`}</title>
						</circle>
					);
					at += length;
					return node;
				})}
				{hasPrevious &&
					rows.map((row) => {
						const share = typeof row.first === "number" ? row.first : 0;
						const length = share * RC;
						const node = (
							<circle
								key={row.key}
								cx="50"
								cy="50"
								r={RING}
								fill="none"
								stroke={row.paint}
								strokeWidth="3"
								strokeDasharray={`${Math.max(0, length - 0.8)} ${RC}`}
								strokeDashoffset={-ringAt}
								opacity={0.55}
							>
								<title>{`${row.label} before: ${fmtShare(share)}`}</title>
							</circle>
						);
						ringAt += length;
						return node;
					})}
			</svg>
			<ul className="min-w-0 flex-1 space-y-2.5">
				{rows.map((row) => (
					<li key={row.key} className="flex items-baseline gap-2">
						<i
							className={cn(
								"block size-3 shrink-0 self-center",
								row.dim && "opacity-50",
							)}
							style={{ background: row.paint }}
						/>
						<span
							className={cn(
								"truncate text-sm text-fg-primary",
								row.dim && "opacity-50",
							)}
						>
							{row.label}
						</span>
						<b className="ml-auto font-mono text-sm text-fg-primary">
							{row.figure}
						</b>
						<span className="w-14 text-right font-mono text-[11px] text-fg-muted">
							{row.sub}
						</span>
					</li>
				))}
				{hasPrevious && (
					<li className="pt-1 font-mono text-[10px] text-fg-muted">
						outer ring: the 30 days before
					</li>
				)}
			</ul>
		</div>
	);
}

export type KitItem = { name: string; share: number; calls: number | null };

/** A kit list with normalized shares and absolute calls. */
export function kitItems(
	view: WorkflowView,
	kind: "skills" | "mcpServers" | "subagents",
): { items: KitItem[]; withheld: number } {
	const byName = new Map<string, { share: number; calls: number | null }>();
	for (const harness of view.kit) {
		for (const atom of harness[kind]) {
			const held = byName.get(atom.name) ?? { share: 0, calls: 0 };
			byName.set(atom.name, {
				share: held.share + atom.callShare,
				calls:
					held.calls === null || atom.calls === null
						? null
						: held.calls + atom.calls,
			});
		}
	}
	const total = sumBy([...byName.values()], (v) => v.share) || 1;
	return {
		items: [...byName.entries()]
			.filter(([, v]) => v.share > 0)
			.map(([name, v]) => ({ name, share: v.share / total, calls: v.calls }))
			.sort((a, b) => b.share - a.share || a.name.localeCompare(b.name)),
		withheld: sumBy(view.kit, (h) => h.withheld[kind]),
	};
}

/**
 * Skills as one proportional strip of name plates. A plate wide enough holds
 * its own name; the rest line up under the strip. One hue, stepped lightness,
 * so neighbors separate without a second color meaning anything.
 */
export function PlateStrip({
	items,
	withheld,
}: {
	items: readonly KitItem[];
	withheld: number;
}) {
	const steps = [100, 78, 60, 46, 36, 28];
	const paint = (i: number) =>
		`color-mix(in oklab, var(--accent-lime) ${steps[Math.min(i, steps.length - 1)]}%, var(--bg-panel))`;
	const inside = (item: KitItem) => item.share >= 0.09;
	const rest = items.filter((item) => !inside(item));
	return (
		<div>
			<div className="flex h-20 w-full gap-0.5 overflow-hidden">
				{items.map((item, i) => (
					<span
						key={item.name}
						className="flex min-w-0"
						style={{ flexGrow: item.share, flexBasis: 0 }}
					>
						<Tip
							className="min-w-0 flex-1"
							label={`${item.name} · ${fmtPercent(item.share)}${item.calls === null ? "" : ` · ${fmtCount(item.calls)}×`}`}
						>
							<span
								className={cn(
									"flex h-full w-full min-w-0 flex-col justify-between overflow-hidden",
									inside(item) && "p-2",
								)}
								style={{ background: paint(i) }}
							>
								{inside(item) && (
									<>
										<span
											className={cn(
												"truncate text-[13px] font-bold",
												i < 3 ? "text-accent-lime-contrast" : "text-fg-primary",
											)}
										>
											{item.name}
										</span>
										<span
											className={cn(
												"font-mono text-lg font-black leading-none",
												i < 3 ? "text-accent-lime-contrast" : "text-fg-primary",
											)}
										>
											{fmtPercent(item.share)}
										</span>
									</>
								)}
							</span>
						</Tip>
					</span>
				))}
			</div>
			{(rest.length > 0 || withheld > 0) && (
				<p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-fg-muted">
					{rest.map((item) => (
						<span key={item.name}>
							{item.name}{" "}
							<b className="text-fg-primary">{fmtPercent(item.share)}</b>
						</span>
					))}
					{withheld > 0 && <span>{withheld} withheld</span>}
				</p>
			)}
		</div>
	);
}

/** Subagent types as count columns: the call count leads, a thin rule carries the share. */
export function CountColumns({ items }: { items: readonly KitItem[] }) {
	return (
		<div
			className="grid gap-6"
			style={{
				gridTemplateColumns: `repeat(${Math.min(4, items.length)}, minmax(0, 1fr))`,
			}}
		>
			{items.slice(0, 4).map((item) => (
				<div key={item.name} className="min-w-0">
					<p className="font-mono text-3xl font-black leading-none text-fg-primary">
						{item.calls === null
							? fmtPercent(item.share)
							: fmtCount(item.calls)}
						{item.calls !== null && (
							<span className="text-base text-fg-muted">×</span>
						)}
					</p>
					<span className="mt-2 block h-1 w-full bg-bg-panel">
						<span
							className="block h-full"
							style={{
								width: `${Math.max(1, item.share * 100)}%`,
								background: ACCENT,
							}}
						/>
					</span>
					<p className="mt-1.5 flex items-baseline justify-between gap-2">
						<span className="truncate text-sm text-fg-primary">
							{item.name}
						</span>
						<span className="font-mono text-[11px] text-fg-muted">
							{fmtPercent(item.share)}
						</span>
					</p>
				</div>
			))}
		</div>
	);
}

/** Languages as the thin repository bar every developer already reads, with a dot legend. */
export function LanguageBar({
	view,
	max = 6,
}: {
	view: WorkflowView;
	max?: number;
}) {
	const { rows, total } = languages(view);
	if (rows.length === 0 || total <= 0) return null;
	const kept = rows.slice(0, max);
	const other = total - sumBy(kept, (row) => row.value);
	const parts = [
		...kept.map((row, i) => ({
			name: row.name,
			value: row.value,
			paint: CHART_PAINTS[i % CHART_PAINTS.length] as string,
		})),
		...(other > 0
			? [{ name: "other", value: other, paint: "var(--bg-panel-elevated)" }]
			: []),
	];
	return (
		<div>
			<div className="flex h-3 w-full gap-0.5">
				{parts.map((part) => (
					<i
						key={part.name}
						title={`${part.name} ${fmtPercent(part.value / total)}`}
						className="block h-full"
						style={{
							flexGrow: part.value,
							flexBasis: 0,
							background: part.paint,
						}}
					/>
				))}
			</div>
			<ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
				{parts.map((part) => (
					<li key={part.name} className="flex items-baseline gap-2">
						<i
							className="block size-2.5 shrink-0 self-center"
							style={{ background: part.paint }}
						/>
						<span className="truncate text-fg-primary">{part.name}</span>
						<span className="ml-auto font-mono text-xs font-bold text-fg-primary">
							{fmtPercent(part.value / total)}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}
