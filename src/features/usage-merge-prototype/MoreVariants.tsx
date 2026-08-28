// PROTOTYPE. THROWAWAY. Ticket #303, round two.
//
// The owner's reaction to round one: only A had potential, but it threw away
// the value of the original overview (model rows with trails and the notch,
// harness rows, the stat grid). The subnav worked but looked ugly, and three
// podium boxes gave little insight.
//
// So every variant here KEEPS THE ORIGINAL READING BLOCK INTACT
// (`OriginalReading`, a faithful copy of section 01's `Reading`) and only
// decides where the workflow goes and how the reader reaches it:
//
//   D  Ribbon: one horizontal ribbon of every workflow row as compact tiles
//      under the reading; a tile opens its body in a drawer under the ribbon.
//   E  Ledger: the reading, then all rows as a dense fixed-height ledger that
//      scrolls inside itself; a click opens the body in a side panel.
//   F  Rail: two columns, the reading left; a numbered vertical rail on the
//      right (in the page nav's own idiom) switches row groups.
//   G  Receipt: nothing hidden. The reading, the lead and phase bar as the
//      bridge, then every row printed in full as one long receipt column.
//   H  Drawer: the first screen is the reading plus a one-line workflow ticker;
//      the whole workflow lives in a slide-over drawer named Workflow.

import { useNavigate, useSearch } from "@tanstack/react-router";
import { ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { RelativeTime } from "@/components/RelativeTime";
import {
	fmtShare,
	fmtTokens,
	KICKER,
	lastCheckLine,
	MEASURED_ANCHOR,
	type MeasuredSnapshot,
	MIX_KICKER,
	MONO_LABEL,
	notchNote,
	TITLE,
	totalUSD,
} from "@/features/measured/copy";
import {
	modelTrails,
	tokenDelta,
	tokenTrail,
} from "@/features/measured/history";
import { MetricBlock } from "@/features/measured/MetricBlock";
import { ModelShareRows } from "@/features/measured/ModelShareRows";
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { RowBody } from "@/features/workflow/components";
import type { WorkflowRow, WorkflowView } from "@/features/workflow/copy";
import { rowHead } from "@/features/workflow/heads";
import { Lead } from "@/features/workflow/Lead";
import { cn } from "@/lib/utils";
import {
	ControlBar,
	Delta,
	ExpandRow,
	type Proto,
	WorkflowEmpty,
} from "./UsageMergePrototype";

// ---------------------------------------------------------------------------
// The original reading, untouched in substance. Copied from
// `MeasuredSection.Reading` so the variants can place it freely.
// ---------------------------------------------------------------------------

const HARNESS_LABELS: Record<string, string> = {
	"claude-code": "Claude Code",
	codex: "Codex",
	opencode: "opencode",
	"pi-mono": "Pi",
};
const SOURCE_PAINTS = [
	"var(--source-1)",
	"var(--source-2)",
	"var(--source-3)",
] as const;

export function OriginalReading({
	p,
	stackToolSlugs,
	split = true,
}: {
	p: Proto;
	stackToolSlugs: string[];
	/** False stacks the two halves instead of the 22rem / 1fr grid. */
	split?: boolean;
}) {
	const s = p.snapshot;
	if (!s) return null;
	const points = p.points;
	const trails = modelTrails(s.models, points);
	const firstAt = points.length > 0 ? points[0].at : null;
	const sinceLast = lastCheckLine(tokenDelta(points), fmtTokens);
	const notMeasured = p.window !== "30d";

	return (
		<div
			className={cn(
				"grid gap-10",
				split && "md:grid-cols-[minmax(0,22rem)_1fr]",
			)}
		>
			<div>
				{notMeasured ? (
					<div className="border border-dashed border-stroke-strong px-4 py-6">
						<p className="font-mono text-3xl font-black text-fg-muted">
							not measured
						</p>
						<p className="mt-1 text-sm text-fg-muted">
							Usage for {p.window} arrives with per-day rows. The 30-day figure
							is {fmtTokens(s.activity.totalTokens)} tokens.
						</p>
					</div>
				) : (
					<>
						<MetricBlock
							tokens={s.activity.totalTokens}
							usd={totalUSD(s)}
							windowDays={s.window.days}
							trail={tokenTrail(points)}
						/>
						<p className="mt-2 px-3">
							<Delta value={s.activity.totalTokens} window={p.window} />
						</p>
						{sinceLast && (
							<p className="mt-3 px-3">
								<span
									className={cn(
										MONO_LABEL,
										"inline-flex items-center border border-stroke-subtle px-1.5 py-0.5 text-[10px] tracking-wider text-fg-muted",
									)}
								>
									{sinceLast}
								</span>
							</p>
						)}
					</>
				)}
			</div>
			<div className={cn(notMeasured && "opacity-40")}>
				<div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
					<p className={cn(MONO_LABEL, "text-accent-lime")}>{MIX_KICKER}</p>
					{firstAt !== null && points.length > 1 && (
						<p className="font-mono text-[11px] text-fg-muted">
							{notchNote(firstAt)}
						</p>
					)}
				</div>
				<ModelShareRows trails={trails} firstAt={firstAt} />
				<HarnessShareRows snapshot={s} stackToolSlugs={stackToolSlugs} />
				<div className="mt-8 grid grid-cols-2 gap-px border border-stroke-subtle bg-stroke-subtle sm:grid-cols-5">
					<Stat
						label="sessions"
						value={s.activity.sessions.toLocaleString("en-US")}
					/>
					<Stat
						label="active days"
						value={`${s.activity.activeDays.value} of ${s.window.days}`}
					/>
					<Stat
						label="project workspaces"
						value={s.activity.projects.value.toLocaleString("en-US")}
					/>
					<Stat
						label="cache hits"
						value={`${Math.round(s.activity.cacheHitShare * 100)}%`}
					/>
					<Stat
						label="run by subagents"
						value={`${Math.round(s.activity.subagentShare * 100)}%`}
					/>
				</div>
			</div>
		</div>
	);
}

export function HarnessShareRows({
	snapshot,
	stackToolSlugs,
}: {
	snapshot: MeasuredSnapshot;
	stackToolSlugs: string[];
}) {
	const byHarness = new Map<string, number>();
	for (const h of snapshot.harnesses) {
		byHarness.set(
			h.harness.name,
			(byHarness.get(h.harness.name) ?? 0) + h.activity.totalTokens,
		);
	}
	const rows = [...byHarness.entries()]
		.map(([name, tokens]) => ({
			name,
			label: HARNESS_LABELS[name] ?? name,
			tokens,
			share:
				snapshot.activity.totalTokens > 0
					? tokens / snapshot.activity.totalTokens
					: 0,
			extra: !stackToolSlugs.includes(name),
		}))
		.sort((a, b) =>
			a.name === "claude-code"
				? -1
				: b.name === "claude-code"
					? 1
					: a.name.localeCompare(b.name),
		);
	if (rows.length < 2) return null;
	return (
		<div className="mt-4">
			<p className={cn(MONO_LABEL, "mb-2 text-fg-muted")}>by harness</p>
			<ul className="divide-y divide-stroke-subtle border-y border-stroke-subtle">
				{rows.map((row, i) => (
					<li key={row.name} className="flex items-center gap-3 py-2">
						<span
							className={cn(
								"w-40 shrink-0 truncate text-sm text-fg-secondary",
								row.extra && "opacity-50",
							)}
						>
							{row.label}
						</span>
						<span className="h-3 flex-1 bg-bg-panel">
							<span
								className={cn("block h-full", row.extra && "opacity-50")}
								style={{
									width: `${Math.max(1, row.share * 100)}%`,
									background: SOURCE_PAINTS[i % SOURCE_PAINTS.length],
								}}
							/>
						</span>
						<span className="w-14 shrink-0 text-right font-mono text-xs font-bold text-fg-secondary">
							{fmtShare(row.share)}
						</span>
						<span className="w-14 shrink-0 text-right font-mono text-[11px] text-fg-muted">
							{fmtTokens(row.tokens)}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

export function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-bg-canvas px-4 py-4">
			<p className="font-mono text-xl font-black text-fg-primary">{value}</p>
			<p className={cn(MONO_LABEL, "mt-1 text-fg-muted")}>{label}</p>
		</div>
	);
}

type VariantProps = {
	index: number;
	p: Proto;
	slug: string;
	stackToolSlugs: string[];
};

function Header({ index, p }: { index: number; p: Proto }) {
	return (
		<SectionHeader
			index={String(index).padStart(2, "0")}
			kicker={KICKER}
			title={TITLE}
			metaAlwaysVisible
			meta={<ControlBar p={p} />}
		/>
	);
}

function ready(p: Proto): p is Proto & { view: WorkflowView } {
	return !!p.view && p.view.window.days > 0;
}

// ---------------------------------------------------------------------------
// D: the ribbon.
// ---------------------------------------------------------------------------

export const VariantD = {
	name: "Ribbon of tiles + drawer below",
	Component: function D({ index, p, stackToolSlugs }: VariantProps) {
		const [open, setOpen] = useState<string | null>(null);
		const view = p.view;
		const openRow = view?.rows.find((r) => r.rowId === open);
		return (
			<Section index={index} id={MEASURED_ANCHOR}>
				<Header index={index} p={p} />
				<OriginalReading p={p} stackToolSlugs={stackToolSlugs} />
				<div className="mt-12 flex items-baseline justify-between">
					<p className={cn(MONO_LABEL, "text-accent-lime")}>how the work ran</p>
					<p className="font-mono text-[11px] text-fg-muted">
						{view ? `${view.rows.length} measures · scroll →` : ""}
					</p>
				</div>
				{ready(p) ? (
					<>
						<div className="mt-3 flex gap-px overflow-x-auto border border-stroke-subtle bg-stroke-subtle">
							{p.view.rows.map((row) => {
								const head = rowHead(row, p.view);
								const on = open === row.rowId;
								return (
									<button
										key={row.rowId}
										type="button"
										onClick={() => setOpen(on ? null : row.rowId)}
										aria-expanded={on}
										className={cn(
											"flex w-[176px] shrink-0 flex-col gap-1.5 p-4 text-left",
											on
												? "bg-bg-panel/90 outline outline-1 outline-accent-lime"
												: "bg-bg-canvas hover:bg-bg-panel/60",
										)}
									>
										<span className={cn(MONO_LABEL, "truncate text-fg-muted")}>
											{row.name}
										</span>
										<span className="font-mono text-2xl font-black leading-none text-accent-lime">
											{head.figure}
										</span>
										<span className="line-clamp-2 text-[12px] leading-snug text-fg-secondary">
											{head.caption}
										</span>
										<span className="mt-auto pt-1">{head.picture(false)}</span>
									</button>
								);
							})}
						</div>
						{openRow && (
							<div className="border border-t-0 border-stroke-subtle p-5">
								<div className="mb-3 flex items-center justify-between">
									<p className="text-sm text-fg-primary">{openRow.name}</p>
									<button
										type="button"
										onClick={() => setOpen(null)}
										aria-label="close"
										className="text-fg-muted hover:text-fg-primary"
									>
										<X className="size-4" />
									</button>
								</div>
								<RowBody rowId={openRow.rowId} view={p.view} />
							</div>
						)}
					</>
				) : (
					<div className="mt-3">
						<WorkflowEmpty p={p} />
					</div>
				)}
			</Section>
		);
	},
};

// ---------------------------------------------------------------------------
// E: the ledger with a side panel.
// ---------------------------------------------------------------------------

export const VariantE = {
	name: "Scrolling ledger + side panel",
	Component: function E({ index, p, stackToolSlugs }: VariantProps) {
		const [open, setOpen] = useState<string | null>(null);
		const openRow = p.view?.rows.find((r) => r.rowId === open);
		return (
			<Section index={index} id={MEASURED_ANCHOR}>
				<Header index={index} p={p} />
				<OriginalReading p={p} stackToolSlugs={stackToolSlugs} />
				{ready(p) ? (
					<div
						className={cn(
							"mt-12 grid gap-px border border-stroke-subtle bg-stroke-subtle",
							openRow && "md:grid-cols-[1fr_minmax(0,28rem)]",
						)}
					>
						<div className="max-h-[44vh] overflow-y-auto bg-bg-canvas">
							<div className="sticky top-0 grid grid-cols-[200px_96px_1fr_76px] items-center gap-x-7 border-b border-stroke-subtle bg-bg-canvas px-4 py-2">
								<span className={cn(MONO_LABEL, "text-fg-muted")}>measure</span>
								<span className={cn(MONO_LABEL, "text-fg-muted")}>figure</span>
								<span className={cn(MONO_LABEL, "text-fg-muted")}>
									in words · {p.window}
								</span>
								<span />
							</div>
							{p.view.rows.map((row) => {
								const head = rowHead(row, p.view);
								const on = open === row.rowId;
								return (
									<button
										key={row.rowId}
										type="button"
										onClick={() => setOpen(on ? null : row.rowId)}
										className={cn(
											"grid w-full grid-cols-[200px_96px_1fr_76px] items-center gap-x-7 border-b border-stroke-subtle px-4 py-2.5 text-left hover:bg-bg-panel/60",
											on && "bg-bg-panel/90",
										)}
									>
										<span className="truncate text-sm text-fg-primary">
											{row.name}
										</span>
										<span className="font-mono text-base font-black text-accent-lime">
											{head.figure}
										</span>
										<span className="truncate text-[13px] text-fg-secondary">
											{head.caption}{" "}
											<Delta value={row.value} window={p.window} />
										</span>
										<span>{head.picture(false)}</span>
									</button>
								);
							})}
						</div>
						{openRow && (
							<aside className="bg-bg-canvas p-5">
								<div className="mb-3 flex items-center justify-between">
									<p className="text-sm text-fg-primary">{openRow.name}</p>
									<button
										type="button"
										onClick={() => setOpen(null)}
										aria-label="close"
										className="text-fg-muted hover:text-fg-primary"
									>
										<X className="size-4" />
									</button>
								</div>
								<RowBody rowId={openRow.rowId} view={p.view} />
							</aside>
						)}
					</div>
				) : (
					<div className="mt-12">
						<WorkflowEmpty p={p} />
					</div>
				)}
			</Section>
		);
	},
};

// ---------------------------------------------------------------------------
// F: the numbered rail.
// ---------------------------------------------------------------------------

const GROUPS: { id: string; label: string; rows: string[] }[] = [
	{
		id: "rhythm",
		label: "Rhythm",
		rows: [
			"component:activity-heatmap",
			"component:start-hours",
			"metric:late-night-commits",
			"component:phase-playbook",
			"metric:turn-duration",
		],
	},
	{
		id: "code",
		label: "Code",
		rows: [
			"component:git-ledger",
			"component:coding-languages",
			"metric:parallel-projects",
		],
	},
	{
		id: "models",
		label: "Models",
		rows: [
			"component:model-routing",
			"metric:effort-levels",
			"metric:thinking-share",
		],
	},
	{
		id: "kit",
		label: "Kit",
		rows: [
			"component:kit",
			"component:delegation",
			"metric:question-back-share",
			"metric:web-searches-per-active-day",
		],
	},
];

function groupRows(view: WorkflowView, ids: string[]): WorkflowRow[] {
	const byId = new Map(view.rows.map((r) => [r.rowId, r]));
	return ids.map((id) => byId.get(id)).filter((r): r is WorkflowRow => !!r);
}

export const VariantF = {
	name: "Numbered rail, nav idiom",
	Component: function F({ index, p, stackToolSlugs }: VariantProps) {
		const [group, setGroup] = useState<string | null>(null);
		const view = p.view;
		const active = GROUPS.find((g) => g.id === group);
		return (
			<Section index={index} id={MEASURED_ANCHOR}>
				<Header index={index} p={p} />
				<OriginalReading p={p} stackToolSlugs={stackToolSlugs} />
				{ready(p) ? (
					<div className="mt-12 grid gap-8 md:grid-cols-[minmax(0,22rem)_1fr]">
						{/* The rail, in the page nav's idiom: numbered rows with a stat. */}
						<nav
							aria-label="Workflow groups"
							className="self-start border border-stroke-subtle"
						>
							{GROUPS.map((g, i) => {
								const rows = groupRows(p.view, g.rows);
								if (rows.length === 0) return null;
								const lead = rowHead(rows[0], p.view);
								const on = group === g.id;
								return (
									<button
										key={g.id}
										type="button"
										aria-current={on ? "true" : undefined}
										onClick={() => setGroup(on ? null : g.id)}
										className={cn(
											"flex w-full items-center gap-4 border-b border-stroke-subtle px-4 py-3.5 text-left last:border-b-0 hover:bg-bg-panel/60",
											on && "bg-bg-panel/90",
										)}
									>
										<span className="font-mono text-sm text-fg-muted">
											{String(i + 1).padStart(2, "0")}
										</span>
										<span
											className={cn(
												"flex-1 font-semibold",
												on ? "text-accent-lime" : "text-fg-primary",
											)}
										>
											{g.label}
										</span>
										<span className="font-mono text-[11px] uppercase tracking-wider text-fg-muted">
											{lead.figure} · {rows[0].name}
										</span>
										<ChevronRight
											className={cn(
												"size-4 text-fg-muted transition-transform",
												on && "rotate-90",
											)}
										/>
									</button>
								);
							})}
						</nav>
						<div>
							{active ? (
								<div className="divide-y divide-stroke-subtle border-y border-stroke-subtle">
									{groupRows(p.view, active.rows).map((row) => (
										<ExpandRow
											key={row.rowId}
											row={row}
											view={p.view}
											window={p.window}
										/>
									))}
								</div>
							) : (
								<div className="border border-dashed border-stroke-subtle px-6 py-10 text-sm text-fg-muted">
									Pick a group on the left. {view?.rows.length} measures across
									four groups, read <RelativeTime at={p.view.receivedAt} />.
								</div>
							)}
						</div>
					</div>
				) : (
					<div className="mt-12">
						<WorkflowEmpty p={p} />
					</div>
				)}
			</Section>
		);
	},
};

// ---------------------------------------------------------------------------
// G: the receipt. Nothing hidden.
// ---------------------------------------------------------------------------

export const VariantG = {
	name: "Receipt, nothing hidden",
	Component: function G({ index, p, stackToolSlugs }: VariantProps) {
		return (
			<Section index={index} id={MEASURED_ANCHOR}>
				<Header index={index} p={p} />
				<OriginalReading p={p} stackToolSlugs={stackToolSlugs} />
				{ready(p) ? (
					<div className="mt-14 border-t border-stroke-strong pt-8">
						<Lead view={p.view} />
						<div className="mx-auto max-w-3xl">
							{p.view.rows.map((row) => {
								const head = rowHead(row, p.view);
								return (
									<article
										key={row.rowId}
										className="border-b border-dashed border-stroke-subtle py-6"
									>
										<div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
											<h3 className={cn(MONO_LABEL, "text-fg-muted")}>
												{row.name}
											</h3>
											<Delta value={row.value} window={p.window} />
										</div>
										<p className="mt-1 flex items-baseline gap-3">
											<span className="font-mono text-3xl font-black text-accent-lime">
												{head.figure}
											</span>
											<span className="text-sm text-fg-secondary">
												{head.caption}
											</span>
										</p>
										{!row.flat && (
											<div className="mt-4">
												<RowBody rowId={row.rowId} view={p.view} />
											</div>
										)}
									</article>
								);
							})}
						</div>
					</div>
				) : (
					<div className="mt-12">
						<WorkflowEmpty p={p} />
					</div>
				)}
			</Section>
		);
	},
};

// ---------------------------------------------------------------------------
// H: the ticker and the drawer named Workflow.
// ---------------------------------------------------------------------------

export const VariantH = {
	name: "Ticker line + Workflow drawer",
	Component: function H({ index, p, slug, stackToolSlugs }: VariantProps) {
		const search = useSearch({ strict: false }) as { view?: string };
		const navigate = useNavigate();
		const open = search.view === "workflow";
		const setOpen = (on: boolean) =>
			navigate({
				to: "/stacks/$slug",
				params: { slug },
				search: (prev: Record<string, unknown>) => ({
					...prev,
					view: on ? "workflow" : undefined,
				}),
				replace: true,
			});
		return (
			<Section index={index} id={MEASURED_ANCHOR}>
				<Header index={index} p={p} />
				<OriginalReading p={p} stackToolSlugs={stackToolSlugs} />
				{ready(p) ? (
					<button
						type="button"
						onClick={() => setOpen(true)}
						className="mt-8 flex w-full items-center gap-4 border border-stroke-subtle px-4 py-3 text-left hover:border-accent-lime"
					>
						<span className={cn(MONO_LABEL, "shrink-0 text-accent-lime")}>
							workflow
						</span>
						<span className="min-w-0 flex-1 truncate font-mono text-[12px] text-fg-secondary">
							{p.view.rows
								.slice(0, 7)
								.map((row) => {
									const head = rowHead(row, p.view);
									return `${head.figure} ${row.name.toLowerCase()}`;
								})
								.join("  ·  ")}
						</span>
						<span className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-fg-muted">
							open <ChevronRight className="inline size-3" />
						</span>
					</button>
				) : (
					<div className="mt-8">
						<WorkflowEmpty p={p} />
					</div>
				)}
				{open && ready(p) && (
					<>
						<button
							type="button"
							aria-label="close workflow"
							onClick={() => setOpen(false)}
							className="fixed inset-0 z-[80] bg-black/60"
						/>
						<aside className="fixed inset-y-0 right-0 z-[90] w-full max-w-3xl overflow-y-auto border-l border-stroke-strong bg-bg-canvas p-6 md:p-8">
							<div className="mb-6 flex items-start justify-between gap-4">
								<div>
									<p className={cn(MONO_LABEL, "text-accent-lime")}>
										{"// actual usage"}
									</p>
									<h3 className="mt-1 font-mono text-3xl font-black text-fg-primary">
										Workflow
									</h3>
								</div>
								<button
									type="button"
									onClick={() => setOpen(false)}
									aria-label="close"
									className="text-fg-muted hover:text-fg-primary"
								>
									<X className="size-5" />
								</button>
							</div>
							<div className="mb-6">
								<ControlBar p={p} />
							</div>
							<Lead view={p.view} />
							<div className="divide-y divide-stroke-subtle border-y border-stroke-subtle">
								{p.view.rows.map((row) => (
									<ExpandRow
										key={row.rowId}
										row={row}
										view={p.view}
										window={p.window}
									/>
								))}
							</div>
						</aside>
					</>
				)}
			</Section>
		);
	},
};
