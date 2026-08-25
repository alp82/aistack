import {
	componentRule,
	LOW_FIT_LINE,
	MAX_PINS,
	metricRule,
} from "@aistack/workflow-rules";
import { useMutation } from "convex/react";
import { ChevronDown, ChevronUp, EyeOff, Pin } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ComponentBody } from "./components";
import {
	fmtBand,
	fmtNumber,
	fmtPercent,
	fmtRowValue,
	MONO_LABEL,
	rowName,
	type WorkflowRow,
	type WorkflowView,
} from "./copy";

/**
 * The podium: the top three by fit as one horizontal band, thin rows in fit
 * order below it, and one expander for the rows under fit 0.40.
 *
 * Wayfinder ticket #215 (map #200). The composition is #191's variant B, and
 * the state rules are the spec's: three highlight slots, the low-fit line at
 * 0.40, and an owner pin or hide that wins over both.
 *
 * THE SECTION RANKS NOTHING. Fit, the rotation limit and the owner's overrides
 * are all server state (spec, "Fit and rotation"), so every row arrives already
 * placed and this file reads `placement` rather than recomputing it. Sorting
 * here would be a second ranking that could disagree with the first.
 */
export function RowSet({
	view,
	stackId,
}: {
	view: WorkflowView;
	stackId: Id<"stacks"> | null;
}) {
	const highlights = view.rows.filter((row) => row.placement === "highlight");
	const normal = view.rows.filter((row) => row.placement === "normal");
	const low = view.rows.filter((row) => row.placement === "low");

	const [openHighlight, setOpenHighlight] = useState<string | null>(null);
	const [openRows, setOpenRows] = useState<readonly string[]>([]);
	const [expanded, setExpanded] = useState(false);
	const toggleRow = (rowId: string) =>
		setOpenRows((held) =>
			held.includes(rowId)
				? held.filter((id) => id !== rowId)
				: [...held, rowId],
		);

	const open = highlights.find((row) => row.rowId === openHighlight);

	return (
		<div>
			{highlights.length > 0 && (
				<>
					<div className="grid gap-px border border-stroke-subtle bg-stroke-subtle md:grid-cols-3">
						{highlights.map((row) => (
							<PodiumBox
								key={row.rowId}
								row={row}
								open={openHighlight === row.rowId}
								onClick={() =>
									setOpenHighlight((held) =>
										held === row.rowId ? null : row.rowId,
									)
								}
							/>
						))}
					</div>
					{open && (
						<div className="border border-t-0 border-stroke-subtle p-5">
							<RowBody row={open} view={view} stackId={stackId} />
						</div>
					)}
				</>
			)}

			<div className="mt-6 divide-y divide-stroke-subtle border-y border-stroke-subtle">
				{normal.map((row) => (
					<ThinRow
						key={row.rowId}
						row={row}
						view={view}
						stackId={stackId}
						open={openRows.includes(row.rowId)}
						onToggle={() => toggleRow(row.rowId)}
					/>
				))}

				{low.length > 0 && (
					<>
						<button
							type="button"
							onClick={() => setExpanded((held) => !held)}
							aria-expanded={expanded}
							className="flex w-full items-center gap-3 py-3 text-left hover:bg-bg-panel/40"
						>
							<span className="flex-1 text-sm text-fg-muted">
								below the fit line
							</span>
							<span className="font-mono text-xs text-fg-muted">
								{low.length} more
							</span>
							<Chevron open={expanded} />
						</button>
						{expanded &&
							low.map((row) => (
								<ThinRow
									key={row.rowId}
									row={row}
									view={view}
									stackId={stackId}
									dim
									open={openRows.includes(row.rowId)}
									onToggle={() => toggleRow(row.rowId)}
								/>
							))}
					</>
				)}
			</div>

			<p className="mt-4 font-mono text-[11px] text-fg-muted">
				one row set · ranked by fit · rows under fit {fmtNumber(LOW_FIT_LINE)}{" "}
				wait behind the expander · at most one highlight swap per sync day
			</p>
		</div>
	);
}

function Chevron({ open }: { open: boolean }) {
	const Icon = open ? ChevronUp : ChevronDown;
	return <Icon aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />;
}

/** One of the three band boxes. A tap extends its body below the band. */
function PodiumBox({
	row,
	open,
	onClick,
}: {
	row: WorkflowRow;
	open: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-expanded={open}
			className={cn(
				"bg-bg-canvas p-5 text-left hover:bg-bg-panel/50",
				open && "bg-bg-panel/60",
			)}
		>
			<span className={cn(MONO_LABEL, "block text-fg-muted")}>
				{rowName(row.ruleId)}
				{row.pinned && <PinTag />}
				{row.hidden && <HiddenTag />}
			</span>
			<span className="mt-3 block font-mono text-4xl font-black text-fg-primary">
				{fmtRowValue(row)}
			</span>
			<span className="mt-2 block text-sm leading-snug text-fg-secondary">
				{row.label}
			</span>
			<span className={cn(MONO_LABEL, "mt-4 block text-accent-lime")}>
				{open ? "close" : "+ tap to extend"}
			</span>
		</button>
	);
}

function ThinRow({
	row,
	view,
	stackId,
	open,
	onToggle,
	dim,
}: {
	row: WorkflowRow;
	view: WorkflowView;
	stackId: Id<"stacks"> | null;
	open: boolean;
	onToggle: () => void;
	dim?: boolean;
}) {
	return (
		<div className={cn(dim && "opacity-70")}>
			<button
				type="button"
				onClick={onToggle}
				aria-expanded={open}
				className="flex w-full items-center gap-3 py-3 text-left hover:bg-bg-panel/40"
			>
				<span className="w-44 shrink-0 truncate text-sm font-bold text-fg-primary">
					{rowName(row.ruleId)}
					{row.pinned && <PinTag />}
					{row.hidden && <HiddenTag />}
				</span>
				<span className="hidden flex-1 truncate text-sm text-fg-secondary md:block">
					{row.label}
				</span>
				<span className="ml-auto shrink-0 font-mono text-sm font-bold text-fg-primary">
					{fmtRowValue(row)}
				</span>
				<Chevron open={open} />
			</button>
			{open && (
				<div className="pb-5">
					<RowBody row={row} view={view} stackId={stackId} />
				</div>
			)}
		</div>
	);
}

function PinTag() {
	return (
		<span className="ml-2 border border-accent-lime px-1 font-mono text-[9px] uppercase tracking-wider text-accent-lime">
			pinned
		</span>
	);
}

/** Only ever rendered in the owner's own view: a public read drops hidden rows. */
function HiddenTag() {
	return (
		<span className="ml-2 border border-stroke-strong px-1 font-mono text-[9px] uppercase tracking-wider text-fg-muted">
			hidden
		</span>
	);
}

/**
 * What a row shows when it opens: the component's own display for a component
 * row, then the derivation both kinds carry, then the owner's controls.
 *
 * THE DERIVATION IS NOT OPTIONAL. Every figure on this page is a rule's output,
 * and a reader who cannot see the band, the coverage and the rule id has to
 * take the number on trust.
 */
function RowBody({
	row,
	view,
	stackId,
}: {
	row: WorkflowRow;
	view: WorkflowView;
	stackId: Id<"stacks"> | null;
}) {
	return (
		<div>
			{row.kind === "component" && (
				<div className="mb-5">
					<ComponentBody componentId={row.ruleId} view={view} />
				</div>
			)}
			<Derivation row={row} />
			{view.isOwner && stackId && <OwnerControls row={row} stackId={stackId} />}
		</div>
	);
}

/** Source, coverage, band, surprise, fit and movement, for one row. */
export function Derivation({ row }: { row: WorkflowRow }) {
	const rule =
		row.kind === "metric" ? metricRule(row.ruleId) : componentRule(row.ruleId);
	const kind =
		row.kind === "component"
			? "derived from aggregates the machine shipped"
			: rule && "kind" in rule && rule.kind === "proxy"
				? "a proxy, named by its rule"
				: "exact, as the machine measured it";

	return (
		<dl className="border border-stroke-subtle p-4 font-mono text-[11px] leading-relaxed text-fg-secondary">
			<Line label="from">{kind}</Line>
			<Line label="rule">
				{row.rowId} · {row.ruleVersion}
			</Line>
			<Line label="band">
				typical {fmtBand(row)} · this window {fmtRowValue(row)}
			</Line>
			<Line label="coverage">
				{fmtPercent(row.coverage)} of the machine's synced harnesses
				{row.coverageTag ? ` · counts: ${row.coverageTag}` : ""}
			</Line>
			<Line label="surprise">
				{fmtNumber(row.surprise)} · distance outside the band
			</Line>
			<Line label="fit">
				<b className="text-fg-primary">{fmtNumber(row.fit)}</b> · coverage times
				surprise
			</Line>
			<Line label="movement">
				{row.movement === null
					? "no earlier window to compare against"
					: `${fmtNumber(row.movement)} against the previous window`}
			</Line>
		</dl>
	);
}

function Line({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex gap-2">
			<dt className="w-20 shrink-0 text-fg-muted">{label}:</dt>
			<dd className="min-w-0 flex-1">{children}</dd>
		</div>
	);
}

/**
 * Pin and hide, for the stack's owner.
 *
 * A pin puts the row on the podium and a hide takes it off the public page
 * entirely, rather than pushing it behind the expander: an expander is still
 * published. Either wins over the fit thresholds.
 *
 * THE PODIUM HOLDS THREE. A fourth pin has no slot to promise, so the server
 * refuses it and the refusal prints here rather than failing silently.
 */
export function OwnerControls({
	row,
	stackId,
}: {
	row: WorkflowRow;
	stackId: Id<"stacks">;
}) {
	const setOverride = useMutation(api.workflow.setWorkflowRowOverride);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const apply = async (state: "pinned" | "hidden" | null) => {
		setBusy(true);
		setError(null);
		try {
			await setOverride({ stackId, rowId: row.rowId, state });
		} catch (caught) {
			setError(
				caught instanceof Error
					? caught.message.replace(/^.*Uncaught Error:\s*/, "")
					: `The podium holds ${MAX_PINS} rows.`,
			);
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="mt-4 flex flex-wrap items-center gap-3">
			<span className={cn(MONO_LABEL, "text-fg-muted")}>your controls</span>
			<ControlButton
				active={row.pinned}
				busy={busy}
				icon={<Pin aria-hidden="true" className="size-3" />}
				label={row.pinned ? "unpin" : "pin to the podium"}
				onClick={() => apply(row.pinned ? null : "pinned")}
			/>
			<ControlButton
				active={row.hidden}
				busy={busy}
				icon={<EyeOff aria-hidden="true" className="size-3" />}
				label={row.hidden ? "show again" : "hide from the page"}
				onClick={() => apply(row.hidden ? null : "hidden")}
			/>
			{error && (
				<span className="font-mono text-[11px] text-destructive">{error}</span>
			)}
		</div>
	);
}

function ControlButton({
	active,
	busy,
	icon,
	label,
	onClick,
}: {
	active: boolean;
	busy: boolean;
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			disabled={busy}
			onClick={onClick}
			className={cn(
				"inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[11px] disabled:opacity-50",
				active
					? "border-accent-lime text-accent-lime"
					: "border-stroke-subtle text-fg-secondary hover:border-stroke-strong",
			)}
		>
			{icon}
			{label}
		</button>
	);
}
