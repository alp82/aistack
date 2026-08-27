// PROTOTYPE. THROWAWAY. Wayfinder ticket #303 (map #302).
//
// Three variants of ONE merged measured section (Actual Usage 01 absorbing
// Workflow 04), mounted on the real `/stacks/$slug` route behind `?variant=`.
// The route swaps sections 01 and 04 for this module when the param is set.
//
// What the variants disagree on (structure, not paint):
//   A  "Podium + subviews": first screen = headline + three fixed picks as a
//      podium; the rest lives in SUBVIEWS inside the section (a subnav row).
//      Pins survive as the podium's owner override.
//   B  "Rail + page": first screen = a dense stat rail with previous-period
//      deltas and one strip; the rest lives on a DEDICATED PAGE (simulated as
//      a takeover under `?view=all`). Pins and hides are gone.
//   C  "Rows, expand in place": first screen = headline beside four fixed pick
//      rows; the rest EXPANDS IN PLACE below a "show N more" bar. Hides
//      survive, pins do not.
//
// Every variant carries the one control bar (30d / 7d / 24h + machine) and
// places it differently.
//
// STUBS, stated plainly: previous-period comparison figures are FAKE. No
// per-day usage rows exist yet (#305, #306), so `fakeDelta` derives a
// deterministic number from the figure itself. Every stub prints with a dotted
// underline so nobody mistakes it for a measurement. Usage figures on 7d/24h
// read "not measured" (the settled rule for a snapshot-only stack).

import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { ChevronDown, ChevronUp, EyeOff, Pin } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import {
	fmtShare,
	fmtTokens,
	fmtUSD,
	KICKER,
	MEASURED_ANCHOR,
	type MeasuredSnapshot,
	MONO_LABEL,
	modelLabel,
	TITLE,
	totalUSD,
} from "@/features/measured/copy";
import {
	type MeasuredHistoryPoint,
	tokenTrail,
} from "@/features/measured/history";
import { MeasuredSection } from "@/features/measured/MeasuredSection";
import { MetricBlock } from "@/features/measured/MetricBlock";
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { RowBody } from "@/features/workflow/components";
import {
	WINDOWS,
	type WindowId,
	type WorkflowRow,
	type WorkflowView,
} from "@/features/workflow/copy";
import { rowHead } from "@/features/workflow/heads";
import { Lead } from "@/features/workflow/Lead";
import { WorkflowSection } from "@/features/workflow/WorkflowSection";
import { cn, timeAgo } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
	VariantD,
	VariantE,
	VariantF,
	VariantG,
	VariantH,
} from "./MoreVariants";
import {
	VariantT,
	VariantU,
	VariantV,
	VariantW,
	VariantX,
	VariantY,
} from "./RoundFive";
import { VariantN, VariantP, VariantQ, VariantR, VariantS } from "./RoundFour";
import { VariantI, VariantJ, VariantK, VariantL, VariantM } from "./RoundThree";

// ---------------------------------------------------------------------------
// Data. One hook, all variants.
// ---------------------------------------------------------------------------

export type Proto = {
	window: WindowId;
	setWindow: (w: WindowId) => void;
	machine: number | null;
	setMachine: (m: number | null) => void;
	snapshot: MeasuredSnapshot | null | undefined;
	view: WorkflowView | null | undefined;
	trail: ReturnType<typeof tokenTrail>;
	points: MeasuredHistoryPoint[];
};

function useProtoData(slug: string): Proto {
	const [window, setWindow] = useState<WindowId>("30d");
	const [machine, setMachine] = useState<number | null>(null);
	const snapshot = useQuery(
		api.measured.getCurrentByStackSlug,
		machine === null ? { slug } : { slug, machineOrdinal: machine },
	);
	const history = useQuery(api.measured.getHistoryByStackSlug, {
		slug,
		...(machine === null ? {} : { machineOrdinal: machine }),
	});
	const view = useQuery(api.workflow.getWorkflowByStackSlug, {
		slug,
		window,
		...(machine === null ? {} : { machineOrdinal: machine }),
	});
	return {
		window,
		setWindow,
		machine,
		setMachine,
		snapshot,
		view,
		trail: tokenTrail(history?.points ?? []),
		points: history?.points ?? [],
	};
}

/** FAKE previous-period delta: deterministic from the figure. Prototype only. */
function fakeDelta(value: number): number {
	const seed = Math.abs(Math.floor(value)) % 37;
	return ((seed - 18) / 18) * 0.35;
}

const PREV_LABEL: Record<WindowId, string> = {
	"30d": "vs 60-30 days ago",
	"7d": "vs the 7 days before",
	"24h": "vs yesterday",
};

export function Delta({ value, window }: { value: number; window: WindowId }) {
	const d = fakeDelta(value);
	const up = d >= 0;
	return (
		<span
			title="PROTOTYPE stub: no per-day usage rows exist yet"
			className={cn(
				"font-mono text-[11px] underline decoration-dotted underline-offset-4",
				up ? "text-accent-lime" : "text-fg-muted",
			)}
		>
			{up ? "▲" : "▼"} {Math.abs(Math.round(d * 100))}%{" "}
			<span className="text-fg-muted">{PREV_LABEL[window]}</span>
		</span>
	);
}

// ---------------------------------------------------------------------------
// Shared bits: the control bar, the picks, small atoms.
// ---------------------------------------------------------------------------

export function ControlBar({ p, className }: { p: Proto; className?: string }) {
	const machines = p.view?.machines ?? [];
	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-3 normal-case tracking-normal",
				className,
			)}
		>
			<fieldset className="inline-flex border border-stroke-subtle">
				<legend className="sr-only">Range</legend>
				{WINDOWS.map((o) => (
					<button
						key={o.id}
						type="button"
						aria-pressed={p.window === o.id}
						onClick={() => p.setWindow(o.id)}
						className={cn(
							"border-r border-stroke-subtle px-2.5 py-1 font-mono text-[11px] last:border-r-0",
							p.window === o.id
								? "bg-accent-lime font-bold text-accent-lime-contrast"
								: "text-fg-muted hover:text-fg-primary",
						)}
					>
						{o.label}
					</button>
				))}
			</fieldset>
			<select
				aria-label="Machine"
				value={p.machine ?? ""}
				onChange={(e) =>
					p.setMachine(e.target.value === "" ? null : Number(e.target.value))
				}
				className="border border-stroke-subtle bg-bg-canvas px-2 py-1 font-mono text-[11px] text-fg-primary"
			>
				<option value="">all machines (usage) · current (workflow)</option>
				{machines.map((m) => (
					<option key={m.machineOrdinal} value={String(m.machineOrdinal)}>
						{m.machine ?? `machine ${String(m.machineOrdinal)}`}
					</option>
				))}
			</select>
			{p.snapshot && (
				<span className="font-mono text-[11px] text-fg-muted">
					checked {timeAgo(p.snapshot.receivedAt)}
				</span>
			)}
		</div>
	);
}

/** The fixed editorial pick: three workflow rows every variant leads with. */
export const PICKS = [
	"component:activity-heatmap",
	"component:git-ledger",
	"component:model-routing",
] as const;

export function pickRows(
	view: WorkflowView,
	ids: readonly string[],
): WorkflowRow[] {
	const byId = new Map(view.rows.map((r) => [r.rowId, r]));
	return ids.map((id) => byId.get(id)).filter((r): r is WorkflowRow => !!r);
}

export function restRows(
	view: WorkflowView,
	ids: readonly string[],
): WorkflowRow[] {
	return view.rows.filter((r) => !ids.includes(r.rowId));
}

/** Usage figures follow the range; only 30d is measured today. */
function UsageHeadline({ p }: { p: Proto }) {
	const s = p.snapshot;
	if (s === undefined) return null;
	if (s === null)
		return <p className="text-sm text-fg-muted">Not measured yet.</p>;
	if (p.window !== "30d") {
		return (
			<div className="border border-dashed border-stroke-strong px-4 py-6">
				<p className="font-mono text-3xl font-black text-fg-muted">
					not measured
				</p>
				<p className="mt-1 text-sm text-fg-muted">
					Usage for {p.window} arrives with per-day rows. The 30d figure is{" "}
					{fmtTokens(s.activity.totalTokens)} tokens.
				</p>
			</div>
		);
	}
	return (
		<div>
			<MetricBlock
				tokens={s.activity.totalTokens}
				usd={totalUSD(s)}
				windowDays={s.window.days}
				trail={p.trail}
			/>
			<p className="mt-2 px-3">
				<Delta value={s.activity.totalTokens} window={p.window} />
			</p>
		</div>
	);
}

function StatCell({
	label,
	value,
	delta,
	window,
	muted,
}: {
	label: string;
	value: string;
	delta?: number;
	window: WindowId;
	muted?: boolean;
}) {
	return (
		<div className="bg-bg-canvas px-4 py-4">
			<p
				className={cn(
					"font-mono text-xl font-black",
					muted ? "text-fg-muted" : "text-fg-primary",
				)}
			>
				{value}
			</p>
			<p className={cn(MONO_LABEL, "mt-1 text-fg-muted")}>{label}</p>
			{delta !== undefined && !muted && (
				<p className="mt-1">
					<Delta value={delta} window={window} />
				</p>
			)}
		</div>
	);
}

function ModelSplit({ s }: { s: MeasuredSnapshot }) {
	const rows = [...s.models].sort((a, b) => b.tokenShare - a.tokenShare);
	return (
		<ul className="divide-y divide-stroke-subtle border-y border-stroke-subtle">
			{rows.slice(0, 4).map((m) => (
				<li key={m.id} className="flex items-center gap-3 py-2">
					<span className="w-40 shrink-0 truncate text-sm text-fg-secondary">
						{modelLabel(m)}
					</span>
					<span className="h-3 flex-1 bg-bg-panel">
						<span
							className="block h-full bg-accent-lime"
							style={{ width: `${Math.max(1, m.tokenShare * 100)}%` }}
						/>
					</span>
					<span className="w-14 text-right font-mono text-xs font-bold text-fg-secondary">
						{fmtShare(m.tokenShare)}
					</span>
				</li>
			))}
		</ul>
	);
}

function OwnerTag({ row }: { row: WorkflowRow }) {
	return (
		<>
			{row.pinned && (
				<Pin
					aria-label="pinned"
					className="ml-2 inline size-3 text-accent-lime"
				/>
			)}
			{row.hidden && (
				<EyeOff
					aria-label="hidden"
					className="ml-2 inline size-3 text-fg-muted"
				/>
			)}
		</>
	);
}

export function WorkflowEmpty({ p }: { p: Proto }) {
	if (p.view === undefined) return null;
	return (
		<div className="border border-stroke-subtle px-6 py-8">
			<p className="font-mono text-2xl font-black text-fg-primary">
				No days in this window
			</p>
			<p className="mt-2 text-sm text-fg-secondary">
				{p.view === null
					? "This machine has no workflow reading."
					: `The newest sync was ${timeAgo(p.view.receivedAt)}.`}
			</p>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Variant A: podium + subviews inside the section. Pins survive.
// ---------------------------------------------------------------------------

type SubviewId = "overview" | "rhythm" | "code" | "models" | "kit";
const SUBVIEWS: { id: SubviewId; label: string; rows: string[] }[] = [
	{ id: "overview", label: "Overview", rows: [] },
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

export const VariantA = {
	name: "Podium + subviews (pins survive)",
	Component: function VariantAComponent({
		index,
		p,
	}: {
		index: number;
		p: Proto;
	}) {
		const [sub, setSub] = useState<SubviewId>("overview");
		const view = p.view;
		// Pins are the owner's override of the editorial pick, one per slot.
		const podium =
			view && view.window.days > 0
				? (() => {
						const pinned = view.rows.filter((r) => r.pinned).slice(0, 3);
						const fill = pickRows(view, PICKS).filter(
							(r) => !pinned.some((x) => x.rowId === r.rowId),
						);
						return [...pinned, ...fill].slice(0, 3);
					})()
				: [];
		const [open, setOpen] = useState<string | null>(null);
		const openRow = podium.find((r) => r.rowId === open);
		const current = SUBVIEWS.find((s) => s.id === sub) ?? SUBVIEWS[0];
		const listed =
			view && sub !== "overview" ? pickRows(view, current.rows) : [];

		return (
			<Section index={index} id={MEASURED_ANCHOR}>
				<SectionHeader
					index={String(index).padStart(2, "0")}
					kicker={KICKER}
					title={TITLE}
					metaAlwaysVisible
					meta={<ControlBar p={p} />}
				/>

				<nav
					aria-label="Actual usage views"
					className="mb-8 flex flex-wrap gap-px border border-stroke-subtle bg-stroke-subtle"
				>
					{SUBVIEWS.map((s) => (
						<button
							key={s.id}
							type="button"
							aria-current={sub === s.id ? "page" : undefined}
							onClick={() => setSub(s.id)}
							className={cn(
								"px-4 py-2 font-mono text-[11px] uppercase tracking-widest",
								sub === s.id
									? "bg-bg-canvas font-bold text-accent-lime"
									: "bg-bg-panel text-fg-muted hover:text-fg-primary",
							)}
						>
							{s.label}
						</button>
					))}
				</nav>

				{sub === "overview" ? (
					<div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
						<UsageHeadline p={p} />
						<div>
							{view && view.window.days > 0 ? (
								<>
									<div className="grid gap-px border border-stroke-subtle bg-stroke-subtle md:grid-cols-3">
										{podium.map((row) => {
											const head = rowHead(row, view);
											return (
												<button
													key={row.rowId}
													type="button"
													onClick={() =>
														setOpen((h) => (h === row.rowId ? null : row.rowId))
													}
													className={cn(
														"flex min-h-[172px] flex-col gap-2 bg-bg-canvas p-5 text-left hover:bg-bg-panel/60",
														open === row.rowId && "bg-bg-panel/90",
													)}
												>
													<span className={cn(MONO_LABEL, "text-fg-muted")}>
														{row.name}
														<OwnerTag row={row} />
													</span>
													<span className="font-mono text-[40px] font-black leading-none text-accent-lime">
														{head.figure}
													</span>
													<span className="text-sm leading-snug text-fg-secondary">
														{head.caption}
													</span>
													<span className="mt-auto pt-2">
														{head.picture(true)}
													</span>
												</button>
											);
										})}
									</div>
									{openRow && (
										<div className="border border-t-0 border-stroke-subtle p-5">
											<RowBody rowId={openRow.rowId} view={view} />
										</div>
									)}
									<p className="mt-4 font-mono text-[11px] text-fg-muted">
										The full workflow lives in the Rhythm, Code, Models and Kit
										views.
									</p>
								</>
							) : (
								<WorkflowEmpty p={p} />
							)}
						</div>
					</div>
				) : view && view.window.days > 0 ? (
					<div>
						{sub === "models" && p.snapshot && p.window === "30d" && (
							<div className="mb-8">
								<p className={cn(MONO_LABEL, "mb-2 text-accent-lime")}>
									where the tokens went
								</p>
								<ModelSplit s={p.snapshot} />
							</div>
						)}
						{sub === "rhythm" && <Lead view={view} />}
						<div className="divide-y divide-stroke-subtle border-y border-stroke-subtle">
							{listed.map((row) => (
								<ExpandRow key={row.rowId} row={row} view={view} />
							))}
						</div>
					</div>
				) : (
					<WorkflowEmpty p={p} />
				)}
			</Section>
		);
	},
};

/** A thin row that opens in place. Shared by A's subviews and C's list. */
export function ExpandRow({
	row,
	view,
	window,
}: {
	row: WorkflowRow;
	view: WorkflowView;
	window?: WindowId;
}) {
	const [open, setOpen] = useState(false);
	const head = rowHead(row, view);
	const Tag = row.flat ? "div" : "button";
	return (
		<div className={cn(row.hidden && "opacity-50")}>
			<Tag
				{...(row.flat
					? {}
					: {
							type: "button",
							onClick: () => setOpen((o) => !o),
							"aria-expanded": open,
						})}
				className="grid w-full grid-cols-[1fr_80px_76px_20px] items-center gap-x-4 py-3 text-left md:grid-cols-[200px_96px_1fr_76px_20px] md:gap-x-7"
			>
				<span className="text-sm text-fg-primary">
					{row.name}
					<OwnerTag row={row} />
				</span>
				<span className="font-mono text-lg font-black text-accent-lime">
					{head.figure}
				</span>
				<span className="hidden text-sm text-fg-secondary md:block">
					{head.caption}
					{window && (
						<>
							{" "}
							<Delta value={row.value ?? 0} window={window} />
						</>
					)}
				</span>
				<span>{head.picture(false)}</span>
				<span className="text-fg-muted">
					{row.flat ? null : open ? (
						<ChevronUp className="size-4" />
					) : (
						<ChevronDown className="size-4" />
					)}
				</span>
			</Tag>
			{open && (
				<div className="pb-5">
					<RowBody rowId={row.rowId} view={view} />
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Variant B: stat rail + dedicated page. No pins, no hides.
// ---------------------------------------------------------------------------

export const VariantB = {
	name: "Stat rail + dedicated page (no pins)",
	Component: function VariantBComponent({
		index,
		p,
		slug,
	}: {
		index: number;
		p: Proto;
		slug: string;
	}) {
		const search = useSearch({ strict: false }) as { view?: string };
		const navigate = useNavigate();
		const all = search.view === "all";
		const setAll = (on: boolean) =>
			navigate({
				to: "/stacks/$slug",
				params: { slug },
				search: (prev: Record<string, unknown>) => ({
					...prev,
					view: on ? "all" : undefined,
				}),
				replace: true,
			});
		const s = p.snapshot;
		const view = p.view;
		const measured = p.window === "30d" && !!s;

		if (all) {
			// The dedicated page, simulated as a takeover. Route would be
			// /stacks/$slug/usage.
			return (
				<Section index={index} id={MEASURED_ANCHOR}>
					<button
						type="button"
						onClick={() => setAll(false)}
						className="mb-6 font-mono text-xs uppercase tracking-widest text-accent-lime hover:underline"
					>
						← back to the stack
					</button>
					<SectionHeader
						index="//"
						kicker="// stacks / claude"
						title="Actual Usage, in full"
						metaAlwaysVisible
						meta={<ControlBar p={p} />}
					/>
					<div className="sticky top-16 z-10 mb-6 border-b border-stroke-subtle bg-bg-canvas py-2">
						<ControlBar p={p} />
					</div>
					{view && view.window.days > 0 ? (
						<>
							<Lead view={view} />
							{s && measured && (
								<div className="mb-8">
									<p className={cn(MONO_LABEL, "mb-2 text-accent-lime")}>
										where the tokens went
									</p>
									<ModelSplit s={s} />
								</div>
							)}
							<div className="divide-y divide-stroke-subtle border-y border-stroke-subtle">
								{view.rows.map((row) => (
									<ExpandRow
										key={row.rowId}
										row={row}
										view={view}
										window={p.window}
									/>
								))}
							</div>
						</>
					) : (
						<WorkflowEmpty p={p} />
					)}
				</Section>
			);
		}

		const pick = view && view.window.days > 0 ? pickRows(view, PICKS) : [];
		return (
			<Section index={index} id={MEASURED_ANCHOR}>
				<SectionHeader
					index={String(index).padStart(2, "0")}
					kicker={KICKER}
					title={TITLE}
				/>
				{/* The control bar is its OWN row, full width, under the header. */}
				<div className="-mt-6 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-stroke-subtle pb-3">
					<ControlBar p={p} />
					<button
						type="button"
						onClick={() => setAll(true)}
						className="font-mono text-xs uppercase tracking-widest text-accent-lime hover:underline"
					>
						everything measured →
					</button>
				</div>

				<div className="grid grid-cols-2 gap-px border border-stroke-subtle bg-stroke-subtle md:grid-cols-4">
					<StatCell
						label={`tokens · ${p.window}`}
						value={
							measured ? fmtTokens(s.activity.totalTokens) : "not measured"
						}
						delta={s?.activity.totalTokens}
						window={p.window}
						muted={!measured}
					/>
					<StatCell
						label="cost at api list"
						value={
							measured
								? totalUSD(s) === null
									? "kept private"
									: fmtUSD(totalUSD(s) ?? 0)
								: "not measured"
						}
						delta={totalUSD(s ?? ({} as MeasuredSnapshot)) ?? undefined}
						window={p.window}
						muted={!measured}
					/>
					<StatCell
						label="sessions"
						value={
							view && view.window.days > 0
								? String(
										view.section.harnesses.reduce((n, h) => n + h.sessions, 0),
									)
								: measured
									? String(s.activity.sessions)
									: "not measured"
						}
						delta={s?.activity.sessions}
						window={p.window}
						muted={!measured && !(view && view.window.days > 0)}
					/>
					<StatCell
						label="active days"
						value={
							view && view.window.days > 0
								? `${view.window.days}`
								: measured
									? `${s.activity.activeDays.value} of ${s.window.days}`
									: "not measured"
						}
						delta={s?.activity.activeDays.value}
						window={p.window}
						muted={!measured && !(view && view.window.days > 0)}
					/>
				</div>

				{view && view.window.days > 0 ? (
					<div className="mt-6 grid gap-px border border-stroke-subtle bg-stroke-subtle md:grid-cols-3">
						{pick.map((row) => {
							const head = rowHead(row, view);
							return (
								<div key={row.rowId} className="bg-bg-canvas p-5">
									<p className={cn(MONO_LABEL, "text-fg-muted")}>{row.name}</p>
									<p className="mt-1 flex items-baseline gap-3">
										<span className="font-mono text-2xl font-black text-accent-lime">
											{head.figure}
										</span>
										<span className="text-sm text-fg-secondary">
											{head.caption}
										</span>
									</p>
									<div className="mt-3">{head.picture(true)}</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className="mt-6">
						<WorkflowEmpty p={p} />
					</div>
				)}
			</Section>
		);
	},
};

// ---------------------------------------------------------------------------
// Variant C: headline beside pick rows, expand in place. Hides survive.
// ---------------------------------------------------------------------------

export const VariantC = {
	name: "Pick rows, expand in place (hides survive)",
	Component: function VariantCComponent({
		index,
		p,
	}: {
		index: number;
		p: Proto;
	}) {
		const [more, setMore] = useState(false);
		const view = p.view;
		const ready = !!view && view.window.days > 0;
		const picks = ready
			? pickRows(view, [...PICKS, "component:start-hours"])
			: [];
		const rest = ready
			? restRows(view, [...PICKS, "component:start-hours"])
			: [];
		useEffect(() => {
			setMore(false);
		}, []);

		return (
			<Section index={index} id={MEASURED_ANCHOR}>
				<SectionHeader
					index={String(index).padStart(2, "0")}
					kicker={KICKER}
					title={TITLE}
					metaAlwaysVisible
					meta={
						p.snapshot ? `checked ${timeAgo(p.snapshot.receivedAt)}` : undefined
					}
				/>
				<div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
					<div>
						<UsageHeadline p={p} />
						{p.snapshot && p.window === "30d" && (
							<div className="mt-6">
								<p className={cn(MONO_LABEL, "mb-2 text-fg-muted")}>models</p>
								<ModelSplit s={p.snapshot} />
							</div>
						)}
					</div>
					<div>
						{/* The control bar sits ON the rows it governs, as tabs. */}
						<div className="mb-3 flex items-end justify-between gap-3 border-b border-stroke-subtle pb-2">
							<p className={cn(MONO_LABEL, "text-accent-lime")}>
								how the work ran
							</p>
							<ControlBar p={p} />
						</div>
						{ready ? (
							<>
								<div className="divide-y divide-stroke-subtle border-b border-stroke-subtle">
									{picks.map((row) => (
										<ExpandRow
											key={row.rowId}
											row={row}
											view={view}
											window={p.window}
										/>
									))}
								</div>
								{more && (
									<div className="divide-y divide-stroke-subtle border-b border-stroke-subtle">
										{rest.map((row) => (
											<ExpandRow
												key={row.rowId}
												row={row}
												view={view}
												window={p.window}
											/>
										))}
									</div>
								)}
								<button
									type="button"
									onClick={() => setMore((m) => !m)}
									aria-expanded={more}
									className="mt-3 flex w-full items-center justify-between border border-stroke-subtle px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-fg-muted hover:text-fg-primary"
								>
									<span>
										{more ? "fewer rows" : `${rest.length} more rows`}
									</span>
									{more ? (
										<ChevronUp className="size-4" />
									) : (
										<ChevronDown className="size-4" />
									)}
								</button>
							</>
						) : (
							<WorkflowEmpty p={p} />
						)}
					</div>
				</div>
			</Section>
		);
	},
};

// ---------------------------------------------------------------------------
// The switcher and the mount.
// ---------------------------------------------------------------------------

export const VariantO = {
	name: "Original (01 + 04 stacked)",
	Component: function VariantOComponent({
		index,
		slug,
		stackId,
		isOwner,
		stackToolSlugs,
	}: {
		index: number;
		p: Proto;
		slug: string;
		stackId: Id<"stacks">;
		isOwner: boolean;
		stackToolSlugs: string[];
	}) {
		return (
			<>
				<MeasuredSection
					index={index}
					slug={slug}
					stackId={stackId}
					isOwner={isOwner}
					stackToolSlugs={stackToolSlugs}
				/>
				<WorkflowSection index={index + 1} slug={slug} stackId={stackId} />
			</>
		);
	},
};

const VARIANTS = {
	O: VariantO,
	A: VariantA,
	D: VariantD,
	E: VariantE,
	F: VariantF,
	G: VariantG,
	I: VariantI,
	J: VariantJ,
	K: VariantK,
	L: VariantL,
	M: VariantM,
	N: VariantN,
	P: VariantP,
	Q: VariantQ,
	R: VariantR,
	S: VariantS,
	T: VariantT,
	U: VariantU,
	V: VariantV,
	W: VariantW,
	X: VariantX,
	Y: VariantY,
	H: VariantH,
	B: VariantB,
	C: VariantC,
} as const;
export type VariantKey = keyof typeof VARIANTS;
const KEYS = Object.keys(VARIANTS) as VariantKey[];

export function UsageMergePrototype({
	index,
	slug,
	variant,
	stackId,
	isOwner,
	stackToolSlugs,
}: {
	index: number;
	slug: string;
	variant: VariantKey;
	stackId: Id<"stacks">;
	isOwner: boolean;
	stackToolSlugs: string[];
}) {
	const p = useProtoData(slug);
	const navigate = useNavigate();
	const go = (key: VariantKey) =>
		navigate({
			to: "/stacks/$slug",
			params: { slug },
			search: (prev: Record<string, unknown>) => ({
				...prev,
				variant: key,
				view: undefined,
			}),
			replace: true,
		});
	const step = (d: number) =>
		go(KEYS[(KEYS.indexOf(variant) + d + KEYS.length) % KEYS.length]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement | null;
			if (
				t &&
				(t.tagName === "INPUT" ||
					t.tagName === "TEXTAREA" ||
					t.tagName === "SELECT" ||
					t.isContentEditable)
			)
				return;
			if (e.key === "ArrowLeft") step(-1);
			if (e.key === "ArrowRight") step(1);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});

	const V = VARIANTS[variant];
	return (
		<>
			<V.Component
				index={index}
				p={p}
				slug={slug}
				stackId={stackId}
				isOwner={isOwner}
				stackToolSlugs={stackToolSlugs}
			/>
			{process.env.NODE_ENV !== "production" && (
				<div className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 border-2 border-fuchsia-500 bg-black px-3 py-2 font-mono text-xs text-white shadow-[4px_4px_0_#d946ef]">
					<button type="button" onClick={() => step(-1)} aria-label="previous">
						←
					</button>
					<span>
						PROTOTYPE #303 · {variant} - {V.name} · deltas stubbed
					</span>
					<button type="button" onClick={() => step(1)} aria-label="next">
						→
					</button>
				</div>
			)}
		</>
	);
}

export function isVariantKey(v: unknown): v is VariantKey {
	return typeof v === "string" && v in VARIANTS;
}

export type { ReactNode };
