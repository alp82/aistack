import { useMutation, useQuery } from "convex/react";
import { ChevronDown, Globe, GripVertical, Plus } from "lucide-react";
import {
	AnimatePresence,
	motion,
	Reorder,
	useDragControls,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ProjectFormFields } from "@/components/projects/ProjectFormFields";
import { useTagInput } from "@/components/projects/useTagInput";
import { TagBadge } from "@/components/TagBadge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { cn, safeExternalUrl, timeAgo } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type Project = {
	_id: Id<"projects">;
	name: string;
	description?: string;
	url?: string;
	tags?: string[];
	published?: boolean;
	fileCount: number;
	source?: string;
	updatedAt: number;
	createdAt: number;
};

type ProjectFormValues = {
	name: string;
	description: string;
	url: string;
	tags: string[];
};

type DialogState =
	| { mode: "create" }
	| { mode: "edit"; initial: { id: Id<"projects"> } & ProjectFormValues }
	| null;

export function ProjectsSection({
	stackId,
	isOwner,
	index,
}: {
	stackId: Id<"stacks">;
	isOwner: boolean;
	index: number;
}) {
	const projects = useQuery(api.projects.listByStack, {
		stackId,
		includeUnpublished: isOwner ? true : undefined,
	}) as Project[] | undefined;

	// Declaration order is a positional contract mirrored by the test suite's spy
	// keying and guarded by TC-MUT-ORDER: reorderProjects(1), publishProject(2),
	// deleteProject(3), createProject(4), updateProject(5).
	const reorderProjects = useMutation(api.projects.reorderProjects);
	const publishProject = useMutation(api.projects.publishProject);
	const deleteProject = useMutation(api.projects.deleteProject);
	const createProject = useMutation(api.projects.createProject);
	const updateProject = useMutation(api.projects.updateProject);

	const [deleteTarget, setDeleteTarget] = useState<{
		id: Id<"projects">;
		name: string;
	} | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [dialog, setDialog] = useState<DialogState>(null);
	const [openId, setOpenId] = useState<Id<"projects"> | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [localOrder, setLocalOrder] = useState<Id<"projects">[]>(() =>
		projects ? projects.map((p) => p._id) : [],
	);
	const draggingRef = useRef(false);

	// Reconcile local order with server order during render (adjust-state-during-render).
	// Adopt server membership unless a drag is in flight.
	// If dragging is active but membership changed (an id no longer exists in
	// serverIds), the previously-dragged state can't be trusted — reset the drag
	// flag and adopt server order so reconciliation is never permanently disabled.
	if (projects) {
		const serverIds = projects.map((p) => p._id);
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

	const loaded = projects !== undefined;
	const isEmpty = loaded && projects.length === 0;
	const hasProjects = projects && projects.length > 0;

	const byId = new Map((projects ?? []).map((p) => [p._id, p]));
	const ordered = localOrder
		.map((id) => byId.get(id))
		.filter((p): p is Project => Boolean(p));

	const canReorder = isOwner && ordered.length > 1;

	const commitOrder = () => {
		draggingRef.current = false;
		const ids = localOrder;
		setActionError(null);
		reorderProjects({ stackId, projectIds: ids }).catch((err) => {
			console.error("Failed to reorder projects:", err);
			if (projects) setLocalOrder(projects.map((p) => p._id));
			setActionError("Couldn't save the new order — try again");
		});
	};

	// NOTE: key-reorder mutations are sent individually via reorderProjects.
	// Convex serializes mutations from a single client in call order, so
	// rapid keyboard presses produce a consistent final state without extra
	// coordination.
	const handleKeyReorder = (
		e: React.KeyboardEvent<HTMLButtonElement>,
		id: Id<"projects">,
	) => {
		if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
		e.preventDefault();
		const index = localOrder.indexOf(id);
		if (index === -1) return;
		const targetIndex = e.key === "ArrowUp" ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= localOrder.length) return;
		const next = [...localOrder];
		next[index] = localOrder[targetIndex];
		next[targetIndex] = localOrder[index];
		setLocalOrder(next);
		setActionError(null);
		reorderProjects({ stackId, projectIds: next }).catch((err) => {
			console.error("Failed to reorder projects:", err);
			if (projects) setLocalOrder(projects.map((p) => p._id));
			setActionError("Couldn't save the new order — try again");
		});
	};

	const toFormValues = (project: Project): ProjectFormValues => ({
		name: project.name,
		description: project.description ?? "",
		url: project.url ?? "",
		tags: project.tags ?? [],
	});

	/** Build the shared props for a ProjectRow in both the plain and reorderable paths. */
	const buildRowProps = (project: Project) => {
		const isDraft = project.published !== true;
		const panelId = `project-panel-${project._id}`;
		return {
			project,
			isOwner,
			isDraft,
			isExpanded: openId === project._id,
			panelId,
			onToggle: () =>
				setOpenId((cur) => (cur === project._id ? null : project._id)),
			onEdit: () =>
				setDialog({
					mode: "edit",
					initial: { id: project._id, ...toFormValues(project) },
				}),
			onPublishToggle: () =>
				publishProject({
					projectId: project._id,
					published: isDraft,
				}),
			onDelete: () => setDeleteTarget({ id: project._id, name: project.name }),
		};
	};

	const renderRow = (project: Project) => (
		<ProjectRow {...buildRowProps(project)} />
	);

	return (
		<Section index={index}>
			<SectionHeader
				index={String(index).padStart(2, "0")}
				kicker="// PROJECTS"
				title="Projects"
				meta={
					projects && projects.length > 0
						? `${projects.length} ${projects.length === 1 ? "project" : "projects"}`
						: undefined
				}
			/>
			<div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
				{isOwner && (
					<NewProjectButton
						label="New Project"
						onClick={() => setDialog({ mode: "create" })}
					/>
				)}
			</div>
			{!loaded && (
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
							const rowProps = buildRowProps(project);
							return (
								<ReorderableRow
									key={project._id}
									id={project._id}
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
											onKeyReorder={(e) => handleKeyReorder(e, project._id)}
										/>
									)}
								</ReorderableRow>
							);
						})}
					</Reorder.Group>
				) : (
					<ul className="border-t border-stroke-subtle">
						{ordered.map((project) => (
							<li key={project._id}>{renderRow(project)}</li>
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
						await deleteProject({ projectId: deleteTarget.id });
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
				description={`This will permanently delete "${deleteTarget?.name}" and all its files. This cannot be undone.`}
				confirmLabel="Delete"
				variant="danger"
				loading={deleting}
			/>

			<ProjectDialog
				state={dialog}
				onClose={() => setDialog(null)}
				stackId={stackId}
				onCreate={createProject}
				onUpdate={updateProject}
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
	id: Id<"projects">;
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

function ProjectFavicon({ href }: { href: string }) {
	const [failed, setFailed] = useState(false);
	if (failed) return null;
	return (
		<img
			src={`https://www.google.com/s2/favicons?domain=${new URL(href).hostname}&sz=64`}
			alt=""
			aria-hidden="true"
			width={20}
			height={20}
			loading="lazy"
			referrerPolicy="no-referrer"
			className="size-5 shrink-0"
			onError={() => setFailed(true)}
		/>
	);
}

type ProjectRowProps = {
	project: Project;
	isOwner: boolean;
	isDraft: boolean;
	isExpanded: boolean;
	panelId: string;
	onToggle: () => void;
	canReorder?: boolean;
	dragControls?: ReturnType<typeof useDragControls>;
	onKeyReorder?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
	onEdit: () => void;
	onPublishToggle: () => void;
	onDelete: () => void;
};

function ProjectRow({
	project,
	isOwner,
	isDraft,
	isExpanded,
	panelId,
	onToggle,
	canReorder = false,
	dragControls,
	onKeyReorder,
	onEdit,
	onPublishToggle,
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
						{isDraft && (
							<span className="shrink-0 border border-dashed border-amber-500/50 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
								draft
							</span>
						)}
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
								isDraft={isDraft}
								indent={canReorder}
								onEdit={onEdit}
								onPublishToggle={onPublishToggle}
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
	isDraft,
	indent,
	onEdit,
	onPublishToggle,
	onDelete,
}: {
	id: string;
	project: Project;
	isOwner: boolean;
	isDraft: boolean;
	indent: boolean;
	onEdit: () => void;
	onPublishToggle: () => void;
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
				{isOwner && (
					<OwnerActions
						isDraft={isDraft}
						onEdit={onEdit}
						onPublishToggle={onPublishToggle}
						onDelete={onDelete}
					/>
				)}
				<div className="ml-auto font-mono text-[11px] tabular-nums text-fg-muted">
					Updated {timeAgo(project.updatedAt)}
				</div>
			</div>
		</div>
	);
}

function OwnerActions({
	isDraft,
	onEdit,
	onPublishToggle,
	onDelete,
}: {
	isDraft: boolean;
	onEdit: () => void;
	onPublishToggle: () => void;
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
				onClick={onPublishToggle}
				className="border-stroke-subtle bg-transparent font-mono text-xs uppercase tracking-wider text-fg-muted hover:border-accent-lime hover:bg-transparent hover:text-accent-lime"
			>
				{isDraft ? "Publish" : "Unpublish"}
			</Button>
			{isDraft && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onDelete}
					className="border-stroke-subtle bg-transparent font-mono text-xs uppercase tracking-wider text-destructive hover:border-destructive hover:bg-transparent hover:text-destructive"
				>
					Delete
				</Button>
			)}
		</div>
	);
}

function ProjectDialog({
	state,
	onClose,
	stackId,
	onCreate,
	onUpdate,
}: {
	state: DialogState;
	onClose: () => void;
	stackId: Id<"stacks">;
	onCreate: (args: {
		name: string;
		description?: string;
		url?: string;
		tags?: string[];
		stackId: Id<"stacks">;
	}) => Promise<{ _id: Id<"projects">; slug: string }>;
	onUpdate: (args: {
		projectId: Id<"projects">;
		name?: string;
		description?: string;
		url?: string;
		tags?: string[];
	}) => Promise<null>;
}) {
	const mode = state?.mode ?? "create";
	const initial = state?.mode === "edit" ? state.initial : null;

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [url, setUrl] = useState("");
	const { tags, setTags, tagInput, setTagInput, addTag, removeTag } =
		useTagInput([]);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (initial) {
			setName(initial.name);
			setDescription(initial.description);
			setUrl(initial.url);
			setTags(initial.tags);
			setTagInput("");
			setError(null);
		} else {
			setName("");
			setDescription("");
			setUrl("");
			setTags([]);
			setTagInput("");
			setError(null);
		}
	}, [initial, setTags, setTagInput]);

	const handleClose = () => {
		setError(null);
		setTagInput("");
		onClose();
	};

	const handleSubmit = async () => {
		const trimmedName = name.trim();
		if (!trimmedName || submitting) return;
		setSubmitting(true);
		setError(null);
		try {
			if (mode === "edit" && initial) {
				await onUpdate({
					projectId: initial.id,
					name: trimmedName,
					description: description.trim() || undefined,
					url: url.trim() || undefined,
					tags,
				});
			} else {
				await onCreate({
					name: trimmedName,
					description: description.trim() || undefined,
					url: url.trim() || undefined,
					tags: tags.length ? tags : undefined,
					stackId,
				});
			}
			handleClose();
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: mode === "edit"
						? "Failed to update project"
						: "Failed to create project",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog
			open={state !== null}
			onClose={handleClose}
			title={mode === "create" ? "New Project" : "Edit Project"}
		>
			<div className="space-y-4">
				<ProjectFormFields
					name={name}
					onNameChange={setName}
					description={description}
					onDescriptionChange={setDescription}
					url={url}
					onUrlChange={setUrl}
					tags={tags}
					tagInput={tagInput}
					onTagInputChange={setTagInput}
					onAddTag={addTag}
					onRemoveTag={removeTag}
				/>
				{error && (
					<p role="alert" className="font-mono text-xs text-destructive">
						{error}
					</p>
				)}
				<div className="flex justify-end gap-2 pt-2">
					<Button
						type="button"
						variant="outline"
						onClick={handleClose}
						className="font-mono text-xs font-bold uppercase tracking-wider"
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={!name.trim() || submitting}
						className="font-mono text-xs font-bold uppercase tracking-wider"
					>
						{mode === "create"
							? submitting
								? "Creating..."
								: "Create"
							: submitting
								? "Saving..."
								: "Save"}
					</Button>
				</div>
			</div>
		</Dialog>
	);
}
