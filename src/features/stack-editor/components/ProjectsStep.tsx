import { useMutation, useQuery } from "convex/react";
import { ArrowUpRight, FileCode2, Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { ProjectOrderButtons } from "@/components/ProjectOrderButtons";
import { accentFor } from "@/components/projects/accent";
import { ProjectFormFields } from "@/components/projects/ProjectFormFields";
import type { StagedProject } from "@/components/projects/types";
import { useTagInput } from "@/components/projects/useTagInput";
import { TagBadge } from "@/components/TagBadge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { StackEditorMode } from "@/features/stack-editor/types";
import { cn, safeExternalUrl } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

type ProjectsStepProps = {
	mode: StackEditorMode;
	stackId?: Id<"stacks">;
	projects?: StagedProject[];
	onProjectsChange?: (projects: StagedProject[]) => void;
};

/** A normalized project row rendered by both create (staged) and edit (live) modes. */
type ProjectRow = {
	name: string;
	description?: string;
	url?: string;
	tags?: string[];
	isDraft: boolean;
	fileCount?: number;
};

function ProjectsStep({
	mode,
	stackId,
	projects,
	onProjectsChange,
}: ProjectsStepProps) {
	if (mode === "edit" && stackId) {
		return <ProjectsStepEdit stackId={stackId} />;
	}
	return (
		<ProjectsStepCreate
			projects={projects ?? []}
			onProjectsChange={onProjectsChange ?? (() => {})}
		/>
	);
}

// ---------------------------------------------------------------------------
// Shared section shell + form
// ---------------------------------------------------------------------------

type ProjectFormState = {
	name: string;
	description?: string;
	url?: string;
	tags?: string[];
};

/**
 * A ref-based reset handle so the parent can imperatively clear the inline
 * form without unmounting it (it stays mounted for the "Add a project" form).
 */
type ProjectInlineFormHandle = {
	reset: () => void;
};

function ProjectInlineForm({
	initial,
	submitLabel,
	onSubmit,
	onCancel,
	error,
	resetRef,
}: {
	initial?: ProjectFormState;
	submitLabel: string;
	onSubmit: (value: ProjectFormState) => void;
	onCancel?: () => void;
	error?: string | null;
	resetRef?: React.MutableRefObject<ProjectInlineFormHandle | null>;
}) {
	const [name, setName] = useState(initial?.name ?? "");
	const [description, setDescription] = useState(initial?.description ?? "");
	const [url, setUrl] = useState(initial?.url ?? "");
	const {
		tags,
		tagInput,
		setTagInput,
		addTag,
		removeTag,
		reset: resetTags,
	} = useTagInput(initial?.tags ?? []);

	// Expose reset via ref for parent to call after successful add
	if (resetRef) {
		resetRef.current = {
			reset: () => {
				setName("");
				setDescription("");
				setUrl("");
				resetTags();
			},
		};
	}

	const handleSubmit = () => {
		const trimmed = name.trim();
		if (!trimmed) return;
		onSubmit({
			name: trimmed,
			description: description.trim() || undefined,
			url: url.trim() || undefined,
			tags: tags.length ? tags : undefined,
		});
	};

	return (
		<div className="border-2 border-stroke-subtle bg-bg-canvas p-4">
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
				<p role="alert" className="mt-2 font-mono text-xs text-destructive">
					{error}
				</p>
			)}
			<div className="mt-4 flex justify-end gap-2">
				{onCancel && (
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						className="font-mono text-xs font-bold uppercase tracking-wider"
					>
						Cancel
					</Button>
				)}
				<Button
					type="button"
					onClick={handleSubmit}
					disabled={!name.trim()}
					className="font-mono text-xs font-bold uppercase tracking-wider"
				>
					{submitLabel}
				</Button>
			</div>
		</div>
	);
}

function ProjectRowItem({
	row,
	index,
	total,
	onMove,
	onEdit,
	onDelete,
	editLabel,
	deleteLabel,
}: {
	row: ProjectRow;
	index: number;
	total: number;
	onMove?: (direction: "up" | "down") => void;
	onEdit: () => void;
	onDelete: () => void;
	editLabel: string;
	deleteLabel: string;
}) {
	const accent = accentFor(row.tags?.[0] ?? row.name);
	const shownTags = row.tags?.slice(0, 4) ?? [];
	const extraTags = (row.tags?.length ?? 0) - shownTags.length;
	const href = safeExternalUrl(row.url);

	return (
		<div className="group relative flex items-stretch border-b border-stroke-subtle">
			{onMove && total > 1 && (
				<div className="flex items-center pl-3">
					<ProjectOrderButtons index={index} total={total} onMove={onMove} />
				</div>
			)}
			<div className="flex min-w-0 flex-1 items-start gap-4 px-3 py-5">
				<span
					className={cn(
						"inline-flex size-12 shrink-0 items-center justify-center border font-mono text-base font-bold uppercase",
						accent.bg,
						accent.border,
						accent.text,
					)}
				>
					{row.name.charAt(0)}
				</span>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="truncate font-mono text-base font-semibold text-fg-primary">
							{row.name}
						</h3>
						{row.isDraft && (
							<span className="shrink-0 border border-dashed border-amber-500/50 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
								draft
							</span>
						)}
					</div>
					{row.description && (
						<p className="mt-1 line-clamp-1 text-sm text-fg-secondary">
							{row.description}
						</p>
					)}
					<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
						{shownTags.length > 0 && (
							<div className="flex flex-wrap items-center gap-1">
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
						{row.fileCount !== undefined && (
							<span className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-fg-muted">
								<FileCode2 className="size-3" />
								{row.fileCount}
							</span>
						)}
						{href && (
							<a
								href={href}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={`Visit ${row.name}`}
								className="inline-flex items-center gap-1 font-mono text-[11px] text-fg-muted transition-colors hover:text-accent-lime"
							>
								Visit
								<ArrowUpRight className="size-3" aria-hidden="true" />
							</a>
						)}
					</div>
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-1 pr-3">
				<button
					type="button"
					onClick={onEdit}
					aria-label={editLabel}
					className="border border-stroke-subtle px-1.5 py-1 text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime cursor-pointer"
				>
					<Pencil className="size-3" />
				</button>
				<button
					type="button"
					onClick={onDelete}
					aria-label={deleteLabel}
					className="border border-stroke-subtle px-1.5 py-1 text-fg-muted transition-colors hover:border-destructive hover:text-destructive cursor-pointer"
				>
					<Trash2 className="size-3" />
				</button>
			</div>
		</div>
	);
}

function SectionShell({ children }: { children: React.ReactNode }) {
	return (
		// biome-ignore lint/correctness/useUniqueElementIds: stable anchor target for in-editor section navigation
		<section id="section-projects" className="space-y-8">
			<div>
				<p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
					{"// STEP 02: PROJECTS"}
				</p>
			</div>
			{children}
		</section>
	);
}

// ---------------------------------------------------------------------------
// Create mode — staged local state
// ---------------------------------------------------------------------------

function ProjectsStepCreate({
	projects,
	onProjectsChange,
}: {
	projects: StagedProject[];
	onProjectsChange: (projects: StagedProject[]) => void;
}) {
	const [editIndex, setEditIndex] = useState<number | null>(null);
	const [addError, setAddError] = useState<string | null>(null);
	const [editError, setEditError] = useState<string | null>(null);
	const addFormRef = useRef<ProjectInlineFormHandle | null>(null);

	const handleAdd = (value: ProjectFormState) => {
		// Client-side URL validation before touching state
		if (value.url) {
			const safe = safeExternalUrl(value.url);
			if (!safe) {
				setAddError("Invalid URL. Use a valid http:// or https:// address.");
				return;
			}
		}
		setAddError(null);
		onProjectsChange([...projects, value]);
		addFormRef.current?.reset();
	};

	const handleUpdate = (index: number, value: ProjectFormState) => {
		if (value.url) {
			const safe = safeExternalUrl(value.url);
			if (!safe) {
				setEditError("Invalid URL. Use a valid http:// or https:// address.");
				return;
			}
		}
		setEditError(null);
		onProjectsChange(projects.map((p, i) => (i === index ? value : p)));
		setEditIndex(null);
	};

	const handleRemove = (index: number) => {
		onProjectsChange(projects.filter((_, i) => i !== index));
		if (editIndex === index) setEditIndex(null);
	};

	const handleMove = (index: number, direction: "up" | "down") => {
		const target = direction === "up" ? index - 1 : index + 1;
		if (target < 0 || target >= projects.length) return;
		const next = [...projects];
		[next[index], next[target]] = [next[target], next[index]];
		onProjectsChange(next);
	};

	return (
		<SectionShell>
			{projects.length === 0 ? (
				<p className="text-sm text-fg-secondary">
					No projects yet. Add a project.
				</p>
			) : (
				<div className="border-t border-stroke-subtle">
					{projects.map((project, index) =>
						editIndex === index ? (
							<div key={`${project.name}-${index}`} className="py-4">
								<ProjectInlineForm
									initial={project}
									submitLabel="Save"
									onSubmit={(value) => handleUpdate(index, value)}
									onCancel={() => {
										setEditError(null);
										setEditIndex(null);
									}}
									error={editError}
								/>
							</div>
						) : (
							<ProjectRowItem
								key={`${project.name}-${index}`}
								row={{
									name: project.name,
									description: project.description,
									url: project.url,
									tags: project.tags,
									isDraft: true,
								}}
								index={index}
								total={projects.length}
								onMove={(dir) => handleMove(index, dir)}
								onEdit={() => {
									setEditError(null);
									setEditIndex(index);
								}}
								onDelete={() => handleRemove(index)}
								editLabel={`Edit ${project.name}`}
								deleteLabel={`Remove ${project.name}`}
							/>
						),
					)}
				</div>
			)}

			<div>
				<p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-fg-muted">
					Add a project
				</p>
				<ProjectInlineForm
					submitLabel="Add"
					onSubmit={handleAdd}
					error={addError}
					resetRef={addFormRef}
				/>
			</div>
		</SectionShell>
	);
}

// ---------------------------------------------------------------------------
// Edit mode — live Convex mutations (parity with the view-page ProjectsSection)
// ---------------------------------------------------------------------------

function ProjectsStepEdit({ stackId }: { stackId: Id<"stacks"> }) {
	const projects = useQuery(api.projects.listByStack, {
		stackId,
		includeUnpublished: true,
	});
	const createProject = useMutation(api.projects.createProject);
	const updateProject = useMutation(api.projects.updateProject);
	const deleteProject = useMutation(api.projects.deleteProject);
	const reorderProjects = useMutation(api.projects.reorderProjects);

	const [editId, setEditId] = useState<Id<"projects"> | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<{
		id: Id<"projects">;
		name: string;
	} | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [addError, setAddError] = useState<string | null>(null);
	const [editError, setEditError] = useState<string | null>(null);

	const list = projects ?? [];

	const handleAdd = async (value: ProjectFormState) => {
		setAddError(null);
		try {
			await createProject({
				name: value.name,
				description: value.description,
				url: value.url,
				tags: value.tags,
				stackId,
			});
		} catch (err) {
			setAddError(
				err instanceof Error ? err.message : "Failed to create project",
			);
		}
	};

	const handleUpdate = async (id: Id<"projects">, value: ProjectFormState) => {
		setEditError(null);
		try {
			await updateProject({
				projectId: id,
				name: value.name,
				description: value.description,
				url: value.url,
				tags: value.tags ?? [],
			});
			setEditId(null);
		} catch (err) {
			setEditError(
				err instanceof Error ? err.message : "Failed to update project",
			);
		}
	};

	const handleMove = (index: number, direction: "up" | "down") => {
		const ids = list.map((p) => p._id);
		const target = direction === "up" ? index - 1 : index + 1;
		if (target < 0 || target >= ids.length) return;
		[ids[index], ids[target]] = [ids[target], ids[index]];
		reorderProjects({ stackId, projectIds: ids });
	};

	return (
		<SectionShell>
			{list.length === 0 ? (
				<p className="text-sm text-fg-secondary">
					No projects yet. Add a project.
				</p>
			) : (
				<div className="border-t border-stroke-subtle">
					{list.map((project, index) =>
						editId === project._id ? (
							<div key={project._id} className="py-4">
								<ProjectInlineForm
									initial={{
										name: project.name,
										description: project.description,
										url: project.url,
										tags: project.tags,
									}}
									submitLabel="Save"
									onSubmit={(value) => handleUpdate(project._id, value)}
									onCancel={() => setEditId(null)}
									error={editError}
								/>
							</div>
						) : (
							<ProjectRowItem
								key={project._id}
								row={{
									name: project.name,
									description: project.description,
									url: project.url,
									tags: project.tags,
									isDraft: project.published !== true,
									fileCount: project.fileCount,
								}}
								index={index}
								total={list.length}
								onMove={(dir) => handleMove(index, dir)}
								onEdit={() => setEditId(project._id)}
								onDelete={() =>
									setDeleteTarget({ id: project._id, name: project.name })
								}
								editLabel={`Edit ${project.name}`}
								deleteLabel={`Delete ${project.name}`}
							/>
						),
					)}
				</div>
			)}

			<div>
				<p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-fg-muted">
					Add a project
				</p>
				<ProjectInlineForm
					submitLabel="Add"
					onSubmit={handleAdd}
					error={addError}
				/>
			</div>

			<ConfirmDialog
				open={deleteTarget !== null}
				onClose={() => setDeleteTarget(null)}
				onConfirm={async () => {
					if (!deleteTarget) return;
					setDeleting(true);
					try {
						await deleteProject({ projectId: deleteTarget.id });
					} catch (err) {
						console.error("Failed to delete project:", err);
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
		</SectionShell>
	);
}

export { ProjectsStep };
export type { ProjectsStepProps };
