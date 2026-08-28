// PROTOTYPE. THROWAWAY. Shared atoms for the #303 variants.
// This module imports NO variant file, so the variant files can import it
// without forming a cycle with UsageMergePrototype.tsx.

import { useQuery } from "convex/react";
import { ChevronDown, ChevronUp, EyeOff, Pin } from "lucide-react";
import { useState } from "react";
import { RelativeTime } from "@/components/RelativeTime";
import type { MeasuredSnapshot } from "@/features/measured/copy";
import {
	type MeasuredHistoryPoint,
	tokenTrail,
} from "@/features/measured/history";
import { RowBody } from "@/features/workflow/components";
import {
	WINDOWS,
	type WindowId,
	type WorkflowRow,
	type WorkflowView,
} from "@/features/workflow/copy";
import { rowHead } from "@/features/workflow/heads";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";

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

export function useProtoData(slug: string): Proto {
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
	"30d": "vs the 30 days before",
	"7d": "vs the 7 days before",
	"24h": "vs the day before",
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
					checked <RelativeTime at={p.snapshot.receivedAt} />
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

export function OwnerTag({ row }: { row: WorkflowRow }) {
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
					: `The newest sync was $<RelativeTime at={p.view.receivedAt} />.`}
			</p>
		</div>
	);
}

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
