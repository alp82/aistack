import { useQuery } from "convex/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { type KeyboardEvent, useRef, useState } from "react";
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { cn, timeAgo } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
	EMPTY_WINDOW,
	KICKER,
	MONO_LABEL,
	TITLE,
	WINDOWS,
	type WindowId,
	WORKFLOW_ANCHOR,
	type WorkflowView,
} from "./copy";
import { Lead } from "./Lead";
import { RowSet } from "./rows";

/**
 * Journey section 04 - Workflow, the measured surface (spec
 * `docs/specs/workflow-surface.md`).
 *
 * Wayfinder tickets #215 and #286 (map #200). Ticket #217 places it in the
 * locked page order; this file is the section itself.
 *
 * THE SECTION COMPUTES ALMOST NOTHING. The CLI measured the days, the server
 * folded the window and placed the rows, and `@aistack/workflow-rules` owns
 * every sentence form. What is left here is markup, one machine selector and
 * one window selector.
 *
 * NOTHING RENDERS WITHOUT A READING. `getWorkflowByStackSlug` answers null when
 * the stack has no stored day AND when `publishWorkflow` is off, and the flag
 * reads at both ends. A stack with no reading gets no section rather than an
 * empty one, because section 01 already carries the page's one sync invitation.
 *
 * A WINDOW WITH NO DAY IS AN EMPTY STATE, NOT A MISSING SECTION (#284). The
 * 30-day answer decides whether the section exists; a 7-day or 24-hour window
 * with zero days keeps the header and says what would fill it.
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
	const [window, setWindow] = useState<WindowId>("30d");
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
	const isDefault = ordinal === null && window === "30d";
	const selected = useQuery(
		api.workflow.getWorkflowByStackSlug,
		isDefault
			? "skip"
			: {
					slug,
					window,
					...(ordinal === null ? {} : { machineOrdinal: ordinal }),
				},
	);
	const view = isDefault ? first : selected;

	if (first === undefined || first === null) return null;
	const shown = view ?? first;

	return (
		<Section index={index} id={WORKFLOW_ANCHOR}>
			<SectionHeader
				index={String(index).padStart(2, "0")}
				kicker={KICKER}
				title={TITLE}
				metaAlwaysVisible
				meta={
					<div className="flex flex-wrap items-center gap-3.5 normal-case tracking-normal">
						<WindowSelect value={window} onChange={setWindow} />
						{shown.machines.length > 1 ? (
							<MachineSelect
								machines={shown.machines}
								value={ordinal ?? currentOrdinal(shown)}
								onChange={(next) =>
									setSelection(next === null ? null : { slug, ordinal: next })
								}
							/>
						) : (
							<span className="font-mono text-[11px] text-fg-muted">
								read {timeAgo(shown.receivedAt)}
								{shown.machine ? ` · ${shown.machine}` : ""}
							</span>
						)}
					</div>
				}
			/>

			{view === undefined ? null : view === null || view.window.days === 0 ? (
				<EmptyWindow window={window} view={shown} />
			) : (
				<>
					<Lead view={view} />
					<RowSet view={view} stackId={stackId} />
				</>
			)}
		</Section>
	);
}

function currentOrdinal(view: WorkflowView): number | null {
	return (
		view.machines.find((machine) => machine.isCurrent)?.machineOrdinal ?? null
	);
}

/** 30 days, 7 days, 24 hours: the window the server folds (#285). */
function WindowSelect({
	value,
	onChange,
}: {
	value: WindowId;
	onChange: (next: WindowId) => void;
}) {
	return (
		<fieldset className="inline-flex border border-stroke-subtle">
			<legend className="sr-only">Window</legend>
			{WINDOWS.map((option) => (
				<button
					key={option.id}
					type="button"
					aria-pressed={value === option.id}
					onClick={() => onChange(option.id)}
					className={cn(
						"border-r border-stroke-subtle px-2.5 py-1 font-mono text-[11px] last:border-r-0",
						value === option.id
							? "bg-accent-lime font-bold text-accent-lime-contrast"
							: "text-fg-muted hover:text-fg-primary",
					)}
				>
					{option.label}
				</button>
			))}
		</fieldset>
	);
}

/** The empty state per window option (#284). */
function EmptyWindow({
	window,
	view,
}: {
	window: WindowId;
	view: WorkflowView;
}) {
	const copy = EMPTY_WINDOW[window];
	return (
		<div className="border border-stroke-subtle px-6 py-10">
			<p className="font-mono text-2xl font-black text-fg-primary md:text-[28px]">
				{copy.head}
			</p>
			<p className="mt-2 max-w-[52ch] text-fg-secondary">
				The newest sync on this machine was {timeAgo(view.receivedAt)}.{" "}
				{copy.body}
			</p>
		</div>
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
				className="flex max-w-[min(18rem,calc(100vw-2.5rem))] items-center gap-2 border border-stroke-subtle px-2.5 py-1 text-left font-mono text-[11px] normal-case tracking-normal text-fg-primary"
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
