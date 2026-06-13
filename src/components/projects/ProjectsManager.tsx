import { ChevronDown, Globe, GripVertical, Plus } from "lucide-react";
import {
	AnimatePresence,
	motion,
	Reorder,
	useDragControls,
} from "motion/react";
import { useRef, useState } from "react";
import {
	type DialogState,
	type ManagerCreateValues,
	type ManagerUpdateValues,
	ProjectDialog,
	type ProjectFormValues,
} from "@/components/projects/ProjectDialog";
import { ProjectFavicon } from "@/components/projects/ProjectFavicon";
import type { ManagerProject } from "@/components/projects/types";
import { TagBadge } from "@/components/TagBadge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { cn, safeExternalUrl, timeAgo } from "@/lib/utils";

export function ProjectsManager({
	items,
	keyOf,
	isOwner,
	index,
	header,
	id,
	loading,
	onCreate,
	onUpdate,
	onDelete,
	onReorder,
}: {
	items: ManagerProject[];
	keyOf: (item: ManagerProject) => string;
	isOwner: boolean;
	index: number;
	header?: React.ReactNode;
	id?: string;
	loading?: boolean;
	onCreate: (v: ManagerCreateValues) => Promise<unknown>;
	onUpdate: (id: string, v: ManagerUpdateValues) => Promise<unknown>;
	onDelete: (id: string) => Promise<unknown>;
	onReorder: (ids: string[]) => Promise<unknown>;
}) {
	const [deleteTarget, setDeleteTarget] = useState<{
		id: string;
		name: string;
	} | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [dialog, setDialog] = useState<DialogState>(null);
	const [openId, setOpenId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [localOrder, setLocalOrder] = useState<string[]>(() =>
		items.map(keyOf),
	);
	const draggingRef = useRef(false);

	// Reconcile local order with server order during render (adjust-state-during-render).
	// Adopt server membership unless a drag is in flight.
	// If dragging is active but membership changed (an id no longer exists in
	// serverIds), the previously-dragged state can't be trusted — reset the drag
	// flag and adopt server order so reconciliation is never permanently disabled.
	{
		const serverIds = items.map(keyOf);
		const serverSet = new Set(serverIds);
		const sameSet =
			localOrder.length === serverIds.length &&
			localOrder.every((id) => serverSet.has(id));
		if (!sameSet) {
			if (draggingRef.current) {
				// Mid-drag membership change: stale drag state, reset and adopt server order.
				draggingRef.current = false;
			}
			setLocalOrder(serverIds);
		}
	}

	const isEmpty = !loading && items.length === 0;
	const hasProjects = !loading && items.length > 0;

	const byId = new Map(items.map((item) => [keyOf(item), item]));
	const ordered = localOrder
		.map((id) => byId.get(id))
		.filter((p): p is ManagerProject => Boolean(p));

	const canReorder = isOwner && ordered.length > 1;

	const commitOrder = () => {
		draggingRef.current = false;
		const ids = localOrder;
		setActionError(null);
		onReorder(ids).catch((err) => {
			console.error("Failed to reorder projects:", err);
			setLocalOrder(items.map(keyOf));
			setActionError("Couldn't save the new order — try again");
		});
	};

	// NOTE: key-reorder mutations are sent individually via onReorder.
	// Convex serializes mutations from a single client in call order, so
	// rapid keyboard presses produce a consistent final state without extra
	// coordination.
	const handleKeyReorder = (
		e: React.KeyboardEvent<HTMLButtonElement>,
		id: string,
	) => {
		if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
		e.preventDefault();
		const idx = localOrder.indexOf(id);
		if (idx === -1) return;
		const targetIndex = e.key === "ArrowUp" ? idx - 1 : idx + 1;
		if (targetIndex < 0 || targetIndex >= localOrder.length) return;
		const next = [...localOrder];
		next[idx] = localOrder[targetIndex];
		next[targetIndex] = localOrder[idx];
		setLocalOrder(next);
		setActionError(null);
		onReorder(next).catch((err) => {
			console.error("Failed to reorder projects:", err);
			setLocalOrder(items.map(keyOf));
			setActionError("Couldn't save the new order — try again");
		});
	};

	const toFormValues = (project: ManagerProject): ProjectFormValues => ({
		name: project.name,
		description: project.description ?? "",
		url: project.url ?? "",
		tags: project.tags ?? [],
	});

	/** Build the shared props for a ProjectRow in both the plain and reorderable paths. */
	const buildRowProps = (project: ManagerProject) => {
		const itemKey = keyOf(project);
		const panelId = `project-panel-${itemKey}`;
		return {
			project,
			isOwner,
			isExpanded: openId === itemKey,
			panelId,
			onToggle: () => setOpenId((cur) => (cur === itemKey ? null : itemKey)),
			onEdit: () =>
				setDialog({
					mode: "edit",
					initial: { id: itemKey, ...toFormValues(project) },
				}),
			onDelete: () => setDeleteTarget({ id: itemKey, name: project.name }),
		};
	};

	const renderRow = (project: ManagerProject) => (
		<ProjectRow {...buildRowProps(project)} />
	);

	return (
		<Section index={index} id={id}>
			{header ?? (
				<SectionHeader
					index={String(index).padStart(2, "0")}
					kicker="// PROJECTS"
					title="Projects"
					meta={
						hasProjects
							? `${items.length} ${items.length === 1 ? "project" : "projects"}`
							: undefined
					}
				/>
			)}
			<div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
				{isOwner && (
					<NewProjectButton
						label="New Project"
						onClick={() => setDialog({ mode: "create" })}
					/>
				)}
			</div>
			{loading && (
				<ul
					aria-busy="true"
					aria-label="Loading projects"
					className="border-t border-stroke-subtle"
				>
					{[0, 1, 2].map((i) => (
						<li
							key={i}
							aria-hidden="true"
							className="flex items-center border-b border-stroke-subtle px-3 py-6"
						>
							<div className="h-4 w-full animate-pulse bg-bg-panel/40" />
						</li>
					))}
				</ul>
			)}
			{isOwner && isEmpty && (
				<div className="mb-8 border border-stroke-subtle bg-bg-canvas p-6">
					<p className="text-sm text-fg-secondary leading-relaxed">
						No projects yet. Add a project to showcase what you build with this
						stack.
					</p>
					<div className="mt-4">
						<NewProjectButton
							label="Add a project"
							onClick={() => setDialog({ mode: "create" })}
						/>
					</div>
				</div>
			)}
			{!isOwner && isEmpty && (
				<p className="max-w-3xl font-mono text-sm text-fg-muted">
					No projects have been added to this stack yet
				</p>
			)}
			{hasProjects &&
				(canReorder ? (
					<Reorder.Group
						as="ul"
						axis="y"
						values={localOrder}
						onReorder={setLocalOrder}
						className="border-t border-stroke-subtle"
					>
						{ordered.map((project) => {
							const itemKey = keyOf(project);
							const rowProps = buildRowProps(project);
							return (
								<ReorderableRow
									key={itemKey}
									id={itemKey}
									onDragStart={() => {
										draggingRef.current = true;
									}}
									onDragEnd={commitOrder}
								>
									{(dragControls) => (
										<ProjectRow
											{...rowProps}
											canReorder
											dragControls={dragControls}
											onKeyReorder={(e) => handleKeyReorder(e, itemKey)}
										/>
									)}
								</ReorderableRow>
							);
						})}
					</Reorder.Group>
				) : (
					<ul className="border-t border-stroke-subtle">
						{ordered.map((project) => (
							<li key={keyOf(project)}>{renderRow(project)}</li>
						))}
					</ul>
				))}

			{actionError && (
				<div
					role="alert"
					aria-atomic="true"
					className="mt-4 font-mono text-xs text-destructive"
				>
					{actionError}
				</div>
			)}

			<ConfirmDialog
				open={deleteTarget !== null}
				onClose={() => setDeleteTarget(null)}
				onConfirm={async () => {
					if (!deleteTarget) return;
					setDeleting(true);
					setActionError(null);
					try {
						await onDelete(deleteTarget.id);
						if (openId === deleteTarget.id) setOpenId(null);
					} catch (err) {
						console.error("Failed to delete project:", err);
						const detail = err instanceof Error ? ` — ${err.message}` : "";
						setActionError(`Couldn't delete "${deleteTarget.name}"${detail}`);
					} finally {
						setDeleting(false);
						setDeleteTarget(null);
					}
				}}
				title="Delete project"
				description={`This will permanently delete "${deleteTarget?.name}". This cannot be undone.`}
				confirmLabel="Delete"
				variant="danger"
				loading={deleting}
			/>

			<ProjectDialog
				state={dialog}
				onClose={() => setDialog(null)}
				onCreate={onCreate}
				onUpdate={onUpdate}
			/>
		</Section>
	);
}

function NewProjectButton({
	label,
	onClick,
}: {
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="inline-flex items-center gap-1.5 border border-stroke-subtle px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime cursor-pointer"
		>
			<Plus className="size-3" />
			{label}
		</button>
	);
}

function ReorderableRow({
	id,
	onDragStart,
	onDragEnd,
	children,
}: {
	id: string;
	onDragStart: () => void;
	onDragEnd: () => void;
	children: (
		dragControls: ReturnType<typeof useDragControls>,
	) => React.ReactNode;
}) {
	const controls = useDragControls();
	return (
		<Reorder.Item
			as="li"
			value={id}
			dragListener={false}
			dragControls={controls}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
		>
			{children(controls)}
		</Reorder.Item>
	);
}

type ProjectRowProps = {
	project: ManagerProject;
	isOwner: boolean;
	isExpanded: boolean;
	panelId: string;
	onToggle: () => void;
	canReorder?: boolean;
	dragControls?: ReturnType<typeof useDragControls>;
	onKeyReorder?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
	onEdit: () => void;
	onDelete: () => void;
};

function ProjectRow({
	project,
	isOwner,
	isExpanded,
	panelId,
	onToggle,
	canReorder = false,
	dragControls,
	onKeyReorder,
	onEdit,
	onDelete,
}: ProjectRowProps) {
	const shownTags = project.tags?.slice(0, 4) ?? [];
	const extraTags = (project.tags?.length ?? 0) - shownTags.length;
	const href = safeExternalUrl(project.url);
	const toggleLabel = isExpanded
		? `Hide details for ${project.name}`
		: `Show details for ${project.name}`;

	return (
		<div
			className={cn(
				"group relative flex select-none border-b border-stroke-subtle transition-colors",
				isExpanded ? "bg-bg-panel/30" : "hover:bg-bg-panel/20",
			)}
		>
			<div className="flex min-w-0 flex-1 flex-col">
				<div
					className={cn(
						"flex items-center gap-2 pl-3",
						!href && "pr-3",
						isExpanded && "border-b border-stroke-subtle",
					)}
				>
					{canReorder && dragControls && (
						<button
							type="button"
							aria-label={`Reorder ${project.name}`}
							onPointerDown={(e) => dragControls.start(e)}
							onKeyDown={onKeyReorder}
							className="shrink-0 cursor-grab touch-none text-fg-muted opacity-0 transition-opacity hover:text-accent-lime focus-visible:opacity-100 focus-visible:outline-none active:cursor-grabbing group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100"
						>
							<GripVertical className="size-4" />
						</button>
					)}
					<button
						type="button"
						onClick={onToggle}
						aria-expanded={isExpanded}
						aria-label={toggleLabel}
						aria-controls={panelId}
						className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-6 text-left"
					>
						{href && <ProjectFavicon href={href} />}
						<h3 className="truncate font-mono text-base font-semibold text-fg-primary">
							{project.name}
						</h3>
						{shownTags.length > 0 && (
							<div className="hidden flex-wrap items-center gap-1 sm:flex">
								{shownTags.map((tag) => (
									<TagBadge key={tag} tag={tag} size="sm" />
								))}
								{extraTags > 0 && (
									<span className="font-mono text-[10px] text-fg-muted">
										+{extraTags}
									</span>
								)}
							</div>
						)}
						<ChevronDown
							className={cn(
								"ml-auto size-4 shrink-0 text-fg-muted transition-transform",
								isExpanded && "rotate-180",
							)}
						/>
					</button>
					{href && (
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex shrink-0 items-center gap-1.5 self-stretch border-l border-stroke-subtle px-4 font-mono text-sm font-semibold uppercase tracking-wider text-fg-secondary transition-colors hover:bg-accent-lime hover:text-bg-canvas"
						>
							<Globe className="size-4 shrink-0" />
							<span>Website</span>
							<span className="sr-only"> (opens in new tab)</span>
						</a>
					)}
				</div>
				<AnimatePresence initial={false}>
					{isExpanded && (
						<motion.div
							key="panel"
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.2, ease: "easeInOut" }}
							className="overflow-hidden"
						>
							<ProjectRowPanel
								id={panelId}
								project={project}
								isOwner={isOwner}
								indent={canReorder}
								onEdit={onEdit}
								onDelete={onDelete}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}

function ProjectRowPanel({
	id,
	project,
	isOwner,
	indent,
	onEdit,
	onDelete,
}: {
	id: string;
	project: ManagerProject;
	isOwner: boolean;
	indent: boolean;
	onEdit: () => void;
	onDelete: () => void;
}) {
	return (
		<div
			id={id}
			className={cn("bg-bg-panel/40 pt-4 pb-4 pr-4", indent ? "pl-9" : "pl-3")}
		>
			{project.description && (
				<p className="max-w-2xl text-sm leading-relaxed text-fg-secondary">
					{project.description}
				</p>
			)}
			<div className="mt-4 flex flex-wrap items-center gap-3">
				{isOwner && <OwnerActions onEdit={onEdit} onDelete={onDelete} />}
				{project.updatedAt !== undefined && (
					<div className="ml-auto font-mono text-[11px] tabular-nums text-fg-muted">
						Updated {timeAgo(project.updatedAt)}
					</div>
				)}
			</div>
		</div>
	);
}

function OwnerActions({
	onEdit,
	onDelete,
}: {
	onEdit: () => void;
	onDelete: () => void;
}) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={onEdit}
				className="border-stroke-subtle bg-transparent font-mono text-xs uppercase tracking-wider text-fg-muted hover:border-accent-lime hover:bg-transparent hover:text-accent-lime"
			>
				Edit
			</Button>
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={onDelete}
				className="border-stroke-subtle bg-transparent font-mono text-xs uppercase tracking-wider text-destructive hover:border-destructive hover:bg-transparent hover:text-destructive"
			>
				Delete
			</Button>
		</div>
	);
}
