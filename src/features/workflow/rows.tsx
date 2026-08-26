import { MAX_PINS } from "@aistack/workflow-rules";
import { useMutation } from "convex/react";
import { ChevronDown, EyeOff, Pin } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { RowBody } from "./components";
import { MONO_LABEL, type WorkflowRow, type WorkflowView } from "./copy";
import { rowHead } from "./heads";

/**
 * The podium and the thin rows, in the fixed editorial order (#284, variant A).
 *
 * THE SECTION RANKS NOTHING. `placement`, `pinned` and `hidden` arrive
 * computed (#285), so the first three rows the server marked `highlight` are
 * the band and the rest are the list, in the order they came. A sort here would
 * be a second ranking that could disagree with the first.
 *
 * ONE OPEN ROW AT A TIME across the podium and the list. A flat row never
 * opens: its head holds its whole picture (#284, decision 4).
 *
 * THE OWNER'S CONTROLS ARE AN ACTIONS COLUMN (#284, decision 3): a pin and a
 * hide as 24px icon buttons at the end of every head. The server owns the
 * override and refuses a fourth pin; the refusal prints under the list.
 */
export function RowSet({
	view,
	stackId,
}: {
	view: WorkflowView;
	stackId: Id<"stacks"> | null;
}) {
	const podium = view.rows.filter((row) => row.placement === "highlight");
	const list = view.rows.filter((row) => row.placement === "normal");
	const [open, setOpen] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const toggle = (row: WorkflowRow) =>
		setOpen((held) => (held === row.rowId ? null : row.rowId));
	const openPodium = podium.find((row) => row.rowId === open);
	const owner = view.isOwner && stackId ? stackId : null;

	return (
		<div>
			{podium.length > 0 && (
				<>
					<div className="grid gap-px border border-stroke-subtle bg-stroke-subtle md:grid-cols-3">
						{podium.map((row) => (
							<PodiumBox
								key={row.rowId}
								row={row}
								view={view}
								owner={owner}
								open={open === row.rowId}
								onToggle={() => toggle(row)}
								onError={setError}
							/>
						))}
					</div>
					{openPodium && (
						<div className="border border-t-0 border-stroke-subtle p-5">
							<RowBody rowId={openPodium.rowId} view={view} />
						</div>
					)}
				</>
			)}

			<div className="mt-6 divide-y divide-stroke-subtle border-y border-stroke-subtle">
				{list.map((row) => (
					<ThinRow
						key={row.rowId}
						row={row}
						view={view}
						owner={owner}
						open={open === row.rowId}
						onToggle={() => toggle(row)}
						onError={setError}
					/>
				))}
			</div>

			{error && (
				<p role="alert" className="mt-3 font-mono text-[11px] text-destructive">
					{error}
				</p>
			)}
		</div>
	);
}

/**
 * One of the three band boxes. A tap extends its body below the band.
 *
 * The owner's actions sit in the box's corner rather than in the extended
 * body, because a flat podium row never extends and its pin must still be
 * reachable.
 */
function PodiumBox({
	row,
	view,
	owner,
	open,
	onToggle,
	onError,
}: {
	row: WorkflowRow;
	view: WorkflowView;
	owner: Id<"stacks"> | null;
	open: boolean;
	onToggle: () => void;
	onError: (message: string | null) => void;
}) {
	const head = rowHead(row, view);
	const Tag = row.flat ? "div" : "button";
	return (
		<div className={cn("relative bg-bg-canvas", open && "bg-bg-panel/90")}>
			<Tag
				{...(row.flat
					? {}
					: { type: "button", onClick: onToggle, "aria-expanded": open })}
				className={cn(
					"flex min-h-[172px] w-full flex-col gap-2 p-5 text-left",
					!row.flat && "hover:bg-bg-panel/60",
				)}
			>
				<span className={cn(MONO_LABEL, "block pr-14 text-fg-muted")}>
					{row.name}
					{row.pinned && <PinTag />}
					{row.hidden && <HiddenTag />}
				</span>
				<span className="block font-mono text-[40px] font-black leading-none text-accent-lime">
					{head.figure}
				</span>
				<span className="block text-sm leading-snug text-fg-secondary">
					{head.caption}
				</span>
				<span className="mt-auto block pt-2">{head.picture(true)}</span>
			</Tag>
			{owner && (
				<span className="absolute top-4 right-4">
					<Actions row={row} stackId={owner} onError={onError} />
				</span>
			)}
		</div>
	);
}

/**
 * The head grid: name, figure, caption, 76x12 picture, chevron, actions
 * (#284, decision 1). The caption drops off a narrow screen; the picture never does.
 */
const HEAD_GRID =
	"grid grid-cols-[1fr_80px_76px_20px_auto] items-center gap-x-4 md:grid-cols-[200px_96px_1fr_76px_20px_auto] md:gap-x-7";

function ThinRow({
	row,
	view,
	owner,
	open,
	onToggle,
	onError,
}: {
	row: WorkflowRow;
	view: WorkflowView;
	owner: Id<"stacks"> | null;
	open: boolean;
	onToggle: () => void;
	onError: (message: string | null) => void;
}) {
	const head = rowHead(row, view);
	const Tag = row.flat ? "div" : "button";
	return (
		<div>
			<div className={cn(HEAD_GRID, "py-2.5")}>
				<Tag
					{...(row.flat
						? {}
						: { type: "button", onClick: onToggle, "aria-expanded": open })}
					className={cn("contents text-left", !row.flat && "cursor-pointer")}
				>
					<span className="truncate text-sm font-bold text-fg-primary">
						{row.name}
						{row.pinned && <PinTag />}
						{row.hidden && <HiddenTag />}
					</span>
					<span className="font-mono text-sm font-extrabold text-accent-lime">
						{head.figure}
					</span>
					<span className="hidden min-w-0 truncate text-sm text-fg-secondary md:block">
						{head.caption}
					</span>
					<span className="flex">{head.picture(false)}</span>
					<span className="flex justify-end">
						{!row.flat && (
							<ChevronDown
								aria-hidden="true"
								className={cn(
									"size-4 text-fg-muted transition-transform",
									open && "rotate-180",
								)}
							/>
						)}
					</span>
				</Tag>
				<span className="flex justify-end">
					{owner && <Actions row={row} stackId={owner} onError={onError} />}
				</span>
			</div>
			{open && !row.flat && (
				<div className="pt-1.5 pb-5">
					<RowBody rowId={row.rowId} view={view} />
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
 * Pin and hide, for the stack's owner.
 *
 * A pin puts the row on the podium and a hide takes it off the public page
 * entirely. THE PODIUM HOLDS THREE: a fourth pin has no slot to promise, so
 * the server refuses it and the refusal prints rather than failing silently.
 */
export function Actions({
	row,
	stackId,
	onError,
}: {
	row: WorkflowRow;
	stackId: Id<"stacks">;
	onError: (message: string | null) => void;
}) {
	const setOverride = useMutation(api.workflow.setWorkflowRowOverride);
	const [busy, setBusy] = useState(false);

	const apply = async (state: "pinned" | "hidden" | null) => {
		setBusy(true);
		onError(null);
		try {
			await setOverride({ stackId, rowId: row.rowId, state });
		} catch (caught) {
			onError(
				caught instanceof Error
					? caught.message.replace(/^.*Uncaught Error:\s*/, "")
					: `The podium holds ${MAX_PINS} rows.`,
			);
		} finally {
			setBusy(false);
		}
	};

	return (
		<span className="flex gap-1">
			<IconButton
				active={row.pinned}
				busy={busy}
				label={row.pinned ? "unpin" : "pin to the podium"}
				onClick={() => apply(row.pinned ? null : "pinned")}
			>
				<Pin aria-hidden="true" className="size-3" />
			</IconButton>
			<IconButton
				active={row.hidden}
				busy={busy}
				label={row.hidden ? "show again" : "hide from the page"}
				onClick={() => apply(row.hidden ? null : "hidden")}
			>
				<EyeOff aria-hidden="true" className="size-3" />
			</IconButton>
		</span>
	);
}

function IconButton({
	active,
	busy,
	label,
	onClick,
	children,
}: {
	active: boolean;
	busy: boolean;
	label: string;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			disabled={busy}
			aria-label={label}
			title={label}
			aria-pressed={active}
			onClick={(event) => {
				event.stopPropagation();
				onClick();
			}}
			className={cn(
				"inline-flex size-6 items-center justify-center border disabled:opacity-50",
				active
					? "border-accent-lime text-accent-lime"
					: "border-stroke-subtle text-fg-muted hover:border-stroke-strong hover:text-fg-primary",
			)}
		>
			{children}
		</button>
	);
}
