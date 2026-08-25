import { useQuery } from "convex/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { type KeyboardEvent, useRef, useState } from "react";
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { cn, timeAgo } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
	KICKER,
	MONO_LABEL,
	TITLE,
	WORKFLOW_ANCHOR,
	type WorkflowView,
} from "./copy";
import { Lead } from "./Lead";
import { RowSet } from "./rows";

/**
 * Journey section 04 - Workflow, the measured surface (spec
 * `docs/specs/workflow-surface.md`).
 *
 * Wayfinder ticket #215 (map #200). Ticket #217 places it in the locked page
 * order; this file is the section itself.
 *
 * THE SECTION COMPUTES ALMOST NOTHING. The CLI measured the values, the server
 * ranked them and applied the owner's overrides, and `@aistack/workflow-rules`
 * owns every sentence form. What is left here is markup and one machine
 * selector.
 *
 * NOTHING RENDERS WITHOUT A READING. `getWorkflowByStackSlug` answers null when
 * the stack has no stored reading AND when `publishWorkflow` is off, and the
 * flag reads at both ends: an owner who turned the workflow off after a sync
 * has turned it off for the reading already sent. A stack with no reading gets
 * no section rather than an empty one, because section 01 already carries the
 * page's one sync invitation and a second would double it.
 */
export function WorkflowSection({
	index,
	slug,
	stackId,
}: {
	index: number;
	slug: string;
	stackId: Id<"stacks"> | null;
}) {
	const [selection, setSelection] = useState<{
		slug: string;
		ordinal: number;
	} | null>(null);
	const first = useQuery(api.workflow.getWorkflowByStackSlug, { slug });

	// The selector addresses machines by their durable private ordinal (#250), so
	// a machine whose name is withheld is still selectable.
	const ordinal =
		selection?.slug === slug &&
		first?.machines.some(
			(machine) => machine.machineOrdinal === selection.ordinal,
		)
			? selection.ordinal
			: null;
	const selected = useQuery(
		api.workflow.getWorkflowByStackSlug,
		ordinal === null ? "skip" : { slug, machineOrdinal: ordinal },
	);
	const view = ordinal === null ? first : selected;

	if (view === undefined || view === null) return null;

	return (
		<Section index={index} id={WORKFLOW_ANCHOR}>
			<SectionHeader
				index={String(index).padStart(2, "0")}
				kicker={KICKER}
				title={TITLE}
				meta={
					view.machines.length > 1 ? (
						<MachineSelect
							machines={view.machines}
							value={ordinal ?? currentOrdinal(view)}
							onChange={(next) =>
								setSelection(next === null ? null : { slug, ordinal: next })
							}
						/>
					) : (
						`read ${timeAgo(view.receivedAt)}`
					)
				}
				metaAlwaysVisible={view.machines.length > 1}
			/>

			<Lead lead={view.lead} />
			<RowSet view={view} stackId={stackId} />
			<Provenance view={view} />
		</Section>
	);
}

function currentOrdinal(view: WorkflowView): number | null {
	return (
		view.machines.find((machine) => machine.isCurrent)?.machineOrdinal ?? null
	);
}

type MachineOption = WorkflowView["machines"][number];

/**
 * Which machine's reading the section shows.
 *
 * A READING IS ONE MACHINE'S (ADR-0009). There is no "all machines" option here,
 * unlike section 01's dropdown: the Git half cannot merge without a per-commit
 * identity the wire does not carry, and a pool metric has no denominator to
 * merge on. An option that silently summed two machines would be a fourth thing
 * the data does not say.
 */
function MachineSelect({
	machines,
	value,
	onChange,
}: {
	machines: readonly MachineOption[];
	value: number | null;
	onChange: (ordinal: number | null) => void;
}) {
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const selected = machines.find((machine) => machine.machineOrdinal === value);
	const closeOnEscape = (event: KeyboardEvent) => {
		if (event.key !== "Escape" || !open) return;
		event.preventDefault();
		setOpen(false);
		triggerRef.current?.focus();
	};

	return (
		<div className="relative text-left">
			<button
				ref={triggerRef}
				type="button"
				aria-label="Machine"
				aria-haspopup="listbox"
				aria-expanded={open}
				onClick={() => setOpen((held) => !held)}
				onKeyDown={closeOnEscape}
				className="flex max-w-[min(18rem,calc(100vw-2.5rem))] items-center gap-2 border border-stroke-subtle px-2.5 py-2 text-left font-mono text-[11px] normal-case tracking-normal text-fg-primary"
			>
				<span className={cn(MONO_LABEL, "text-[10px] text-fg-muted")}>
					from
				</span>
				<span className="min-w-0 flex-1 truncate">
					{machineLabel(selected)}
				</span>
				{open ? (
					<ChevronUp aria-hidden="true" className="size-3 shrink-0" />
				) : (
					<ChevronDown aria-hidden="true" className="size-3 shrink-0" />
				)}
			</button>

			{open && (
				<div
					role="listbox"
					aria-label="Machine"
					onKeyDown={closeOnEscape}
					className="absolute top-full right-0 z-50 mt-1 min-w-full border border-stroke-strong bg-bg-panel-elevated shadow-[4px_4px_0_var(--stroke-strong)]"
				>
					{machines.map((machine) => (
						<button
							key={machine.machineOrdinal ?? machine.receivedAt}
							type="button"
							role="option"
							aria-selected={machine.machineOrdinal === value}
							onClick={() => {
								onChange(machine.machineOrdinal);
								setOpen(false);
							}}
							className="block w-full border-t border-stroke-subtle px-3 py-2 text-left first:border-t-0 hover:bg-bg-panel-muted"
						>
							<span className="block min-w-48 truncate">
								{machineLabel(machine)}
							</span>
							<span className="mt-0.5 block text-[10px] text-fg-muted">
								read {timeAgo(machine.receivedAt)}
							</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

/** The published name, or the durable ordinal when the name is withheld (#250). */
function machineLabel(machine: MachineOption | undefined): string {
	if (!machine) return "this machine";
	return machine.machine ?? `machine ${machine.machineOrdinal ?? ""}`.trim();
}

/**
 * What produced this reading, under the rows.
 *
 * RAW DATA NEVER LEAVES THE MACHINE, and the page says so rather than leaving a
 * reader to assume the opposite. The rule ids ride along, because a number
 * whose rule is not named is a number a reader has to take on trust.
 */
function Provenance({ view }: { view: WorkflowView }) {
	const rules = [...view.phaseRuleVersions, ...view.metricRuleVersions];
	return (
		<div className="mt-8 border-t border-stroke-subtle pt-4">
			{view.mixedRuleVersions && (
				<p className="mb-2 font-mono text-[11px] text-fg-muted">
					mixed rule versions: this reading carries aggregates from more than
					one rule set, because a session whose local records are gone keeps the
					aggregate it already had.
				</p>
			)}
			{view.unknownMetricIds.length > 0 && (
				<p className="mb-2 font-mono text-[11px] text-fg-muted">
					{view.unknownMetricIds.length} measurement
					{view.unknownMetricIds.length === 1 ? "" : "s"} this site has no rule
					for yet, dropped rather than printed bare:{" "}
					{view.unknownMetricIds.join(", ")}
				</p>
			)}
			<p className="font-mono text-[11px] text-fg-muted">
				measured on the owner's machine and published with their consent. Raw
				transcripts and repository names never leave it. No language model reads
				this section or writes a word of it
				{rules.length > 0 ? ` · ${rules.join(" · ")}` : ""}
				{view.cliVersion ? ` · cli ${view.cliVersion}` : ""}
				{view.aggregateVersion ? ` · ${view.aggregateVersion}` : ""}
			</p>
			{!view.isFresh && (
				<p className="mt-2 font-mono text-[11px] text-fg-muted">
					last read {timeAgo(view.receivedAt)}
				</p>
			)}
		</div>
	);
}
