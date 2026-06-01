import { useMutation, useQuery } from "convex/react";
import {
	ArrowUpRight,
	Check,
	Copy,
	FileCode2,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { ProjectOrderButtons } from "@/components/ProjectOrderButtons";
import { TagBadge } from "@/components/TagBadge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/form-field";
import { FormInput } from "@/components/ui/form-input";
import { FormTextarea } from "@/components/ui/form-textarea";
import { SectionHeader } from "@/features/stack-view/ui";
import { cn, safeExternalUrl, timeAgo } from "@/lib/utils";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

// --- By-tag accent: stable color per project, hashed from its first tag ------

type Accent = { text: string; bg: string; border: string };

const TAG_PALETTE: Accent[] = [
	{ text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/40" },
	{
		text: "text-violet-400",
		bg: "bg-violet-500/10",
		border: "border-violet-500/40",
	},
	{
		text: "text-amber-400",
		bg: "bg-amber-500/10",
		border: "border-amber-500/40",
	},
	{ text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/40" },
	{
		text: "text-emerald-400",
		bg: "bg-emerald-500/10",
		border: "border-emerald-500/40",
	},
	{ text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/40" },
];

function accentFor(key: string): Accent {
	let h = 0;
	for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
	return TAG_PALETTE[h % TAG_PALETTE.length];
}

export function ProjectsSection({
	stackId,
	isOwner,
}: {
	stackId: Id<"stacks">;
	isOwner: boolean;
}) {
	const projects = useQuery(api.projects.listByStack, {
		stackId,
		includeUnpublished: isOwner ? true : undefined,
	});
	const reorderProjects = useMutation(api.projects.reorderProjects);
	const publishProject = useMutation(api.projects.publishProject);
	const deleteProjectMutation = useMutation(api.projects.deleteProject);
	const createProject = useMutation(api.projects.createProject);
	const updateProject = useMutation(api.projects.updateProject);
	const [deleteTarget, setDeleteTarget] = useState<{
		id: Id<"projects">;
		name: string;
	} | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [copied, setCopied] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<EditProjectTarget | null>(null);

	const hasProjects = projects && projects.length > 0;
	if (!isOwner && !hasProjects) return null;

	const handleMove = (index: number, direction: "up" | "down") => {
		if (!projects) return;
		const ids = projects.map((p) => p._id);
		const targetIndex = direction === "up" ? index - 1 : index + 1;
		const temp = ids[index];
		ids[index] = ids[targetIndex];
		ids[targetIndex] = temp;
		reorderProjects({ stackId, projectIds: ids });
	};

	const copyCliCommand = () => {
		navigator.clipboard.writeText("npx @use-aistack/cli collect");
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<section className="bg-bg-panel/30 px-6 py-16 md:py-24">
			<div className="mx-auto max-w-7xl">
				<SectionHeader
					index="01"
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
						<button
							type="button"
							onClick={() => setCreateOpen(true)}
							className="inline-flex items-center gap-1.5 border border-stroke-subtle px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime cursor-pointer"
						>
							<Plus className="size-3" />
							New Project
						</button>
					)}
					{isOwner && hasProjects && (
						<div className="inline-flex items-center gap-2 font-mono text-xs text-fg-muted">
							<span className="uppercase tracking-wider">Add more:</span>
							<div className="inline-flex items-center border border-stroke-subtle bg-bg-panel">
								<code className="px-2 py-1 text-accent-lime">
									npx @use-aistack/cli collect
								</code>
								<button
									type="button"
									onClick={copyCliCommand}
									className="border-l border-stroke-subtle px-1.5 py-1 text-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
									aria-label="Copy command"
								>
									{copied ? (
										<Check className="size-3.5 text-accent-lime" />
									) : (
										<Copy className="size-3.5" />
									)}
								</button>
							</div>
						</div>
					)}
				</div>
				{isOwner && !hasProjects && (
					<div className="mb-8 border-2 border-stroke-subtle bg-bg-canvas p-6">
						<div className="flex items-start gap-4">
							<span className="mt-0.5 font-mono text-lg text-accent-lime">
								{">"}
								<span className="inline-block animate-[blink_2.2s_ease-in-out_infinite]">
									_
								</span>
							</span>
							<div className="min-w-0 flex-1">
								<h3 className="font-mono text-sm font-semibold text-fg-primary mb-1">
									Add projects via CLI
								</h3>
								<p className="text-sm text-fg-secondary leading-relaxed">
									Run the collect command in any project directory to upload its
									AI configuration files.
								</p>
								<div className="mt-3 inline-flex items-center border border-stroke-subtle bg-bg-panel">
									<code className="font-mono text-sm text-accent-lime px-3 py-1.5">
										npx @use-aistack/cli collect
									</code>
									<button
										type="button"
										onClick={copyCliCommand}
										aria-label="Copy command"
										className="border-l border-stroke-subtle px-2 py-1.5 text-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
									>
										{copied ? (
											<Check className="size-4 text-accent-lime" />
										) : (
											<Copy className="size-4" />
										)}
									</button>
								</div>
								<p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
									Projects arrive as drafts. Review and publish them here.
								</p>
								<button
									type="button"
									onClick={() => setCreateOpen(true)}
									className="mt-4 inline-flex items-center gap-1.5 border border-stroke-subtle px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime cursor-pointer"
								>
									<Plus className="size-3" />
									New Project
								</button>
							</div>
						</div>
					</div>
				)}
				{hasProjects && (
					<div className="border-t border-stroke-subtle">
						{projects.map((project, index) => {
							const isDraft = project.published !== true;
							const accent = accentFor(project.tags?.[0] ?? project.name);
							const shownTags = project.tags?.slice(0, 4) ?? [];
							const extraTags = (project.tags?.length ?? 0) - shownTags.length;
							const href = safeExternalUrl(project.url);
							return (
								<div
									key={project._id}
									className={cn(
										"group relative flex items-stretch border-b border-stroke-subtle transition-colors",
										href && "hover:bg-bg-panel/40",
									)}
								>
									<span
										className={cn(
											"absolute left-0 top-0 h-full w-0.5 origin-top scale-y-0 bg-accent-lime transition-transform duration-200",
											href && "group-hover:scale-y-100",
										)}
									/>
									{isOwner && projects.length > 1 && (
										<div className="flex items-center pl-3">
											<ProjectOrderButtons
												index={index}
												total={projects.length}
												onMove={(dir) => handleMove(index, dir)}
											/>
										</div>
									)}
									{(() => {
										const inner = (
											<>
												<span
													className={cn(
														"inline-flex size-12 shrink-0 items-center justify-center border font-mono text-base font-bold uppercase",
														accent.bg,
														accent.border,
														accent.text,
													)}
												>
													{project.name.charAt(0)}
												</span>
												<div className="min-w-0 flex-1">
													<div className="flex flex-wrap items-center gap-2">
														<h3
															className={cn(
																"truncate font-mono text-base font-semibold text-fg-primary transition-colors",
																href && "group-hover:text-accent-lime",
															)}
														>
															{project.name}
														</h3>
														{isDraft && (
															<span className="shrink-0 border border-dashed border-amber-500/50 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
																draft
															</span>
														)}
													</div>
													{project.description && (
														<p className="mt-1 line-clamp-1 text-sm text-fg-secondary">
															{project.description}
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
														<div className="flex items-center gap-2.5 font-mono text-[11px] tabular-nums text-fg-muted">
															<span className="inline-flex items-center gap-1">
																<FileCode2 className="size-3" />
																{project.fileCount}
															</span>
															{project.source && (
																<>
																	<span className="hidden text-stroke-subtle sm:inline">
																		·
																	</span>
																	<span className="hidden sm:inline">
																		# {project.source}
																	</span>
																</>
															)}
															<span className="hidden text-stroke-subtle sm:inline">
																·
															</span>
															<span className="hidden sm:inline">
																{timeAgo(project.updatedAt)}
															</span>
														</div>
													</div>
												</div>
												{href && (
													<ArrowUpRight className="mt-1 hidden size-4 shrink-0 self-center text-fg-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-lime md:block" />
												)}
											</>
										);
										return href ? (
											<a
												href={href}
												target="_blank"
												rel="noopener noreferrer"
												className="flex min-w-0 flex-1 items-start gap-4 px-3 py-5"
											>
												{inner}
												<span className="sr-only"> (opens in new tab)</span>
											</a>
										) : (
											<div className="flex min-w-0 flex-1 items-start gap-4 px-3 py-5">
												{inner}
											</div>
										);
									})()}
									{isOwner && (
										<div className="flex shrink-0 items-center gap-1 pr-3">
											<button
												type="button"
												onClick={() =>
													setEditTarget({
														id: project._id,
														name: project.name,
														description: project.description ?? "",
														url: project.url ?? "",
														tags: project.tags ?? [],
													})
												}
												aria-label={`Edit ${project.name}`}
												className="border border-stroke-subtle px-1.5 py-1 text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-lime/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas cursor-pointer"
											>
												<Pencil className="size-3" />
											</button>
											<button
												type="button"
												onClick={() =>
													publishProject({
														projectId: project._id,
														published: isDraft,
													})
												}
												className="border border-stroke-subtle px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-lime/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas cursor-pointer"
											>
												{isDraft ? "Publish" : "Unpublish"}
											</button>
											{isDraft && (
												<button
													type="button"
													onClick={() =>
														setDeleteTarget({
															id: project._id,
															name: project.name,
														})
													}
													aria-label={`Delete ${project.name}`}
													className="border border-stroke-subtle px-1.5 py-1 text-fg-muted transition-colors hover:border-destructive hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-lime/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas cursor-pointer"
												>
													<Trash2 className="size-3" />
												</button>
											)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}

				<ConfirmDialog
					open={deleteTarget !== null}
					onClose={() => setDeleteTarget(null)}
					onConfirm={async () => {
						if (!deleteTarget) return;
						setDeleting(true);
						try {
							await deleteProjectMutation({ projectId: deleteTarget.id });
						} catch (err) {
							console.error("Failed to delete project:", err);
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

				<CreateProjectDialog
					open={createOpen}
					onClose={() => setCreateOpen(false)}
					stackId={stackId}
					createProject={createProject}
				/>

				<EditProjectDialog
					target={editTarget}
					onClose={() => setEditTarget(null)}
					updateProject={updateProject}
				/>
			</div>
		</section>
	);
}

type EditProjectTarget = {
	id: Id<"projects">;
	name: string;
	description: string;
	url: string;
	tags: string[];
};

function CreateProjectDialog({
	open,
	onClose,
	stackId,
	createProject,
}: {
	open: boolean;
	onClose: () => void;
	stackId: Id<"stacks">;
	createProject: (args: {
		name: string;
		description?: string;
		url?: string;
		tags?: string[];
		stackId: Id<"stacks">;
	}) => Promise<{ _id: Id<"projects">; slug: string }>;
}) {
	const tagsId = useId();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [url, setUrl] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const addTag = () => {
		const trimmed = tagInput.trim().toLowerCase();
		if (trimmed && !tags.includes(trimmed)) {
			setTags([...tags, trimmed]);
		}
		setTagInput("");
	};

	const removeTag = (tag: string) => {
		setTags(tags.filter((t) => t !== tag));
	};

	const reset = () => {
		setName("");
		setDescription("");
		setUrl("");
		setTags([]);
		setTagInput("");
		setError(null);
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const handleSubmit = async () => {
		const trimmedName = name.trim();
		if (!trimmedName || submitting) return;
		setSubmitting(true);
		setError(null);
		try {
			await createProject({
				name: trimmedName,
				description: description.trim() || undefined,
				url: url.trim() || undefined,
				tags: tags.length ? tags : undefined,
				stackId,
			});
			reset();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create project");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onClose={handleClose} title="New Project">
			<div className="space-y-4">
				<FormInput
					label="Name"
					required
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="My project"
				/>
				<FormTextarea
					label="Description"
					rows={2}
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Short description of the project..."
				/>
				<FormInput
					label="URL"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					placeholder="https://..."
				/>
				<FormField label="Tags" htmlFor={tagsId}>
					<input
						id={tagsId}
						type="text"
						value={tagInput}
						onChange={(e) => setTagInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								addTag();
							}
						}}
						placeholder="Add tag + Enter"
						className="w-full border-2 border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
					/>
					{tags.length > 0 && (
						<div className="mt-2 flex flex-wrap gap-1.5">
							{tags.map((tag) => (
								<TagBadge
									key={tag}
									tag={tag}
									size="md"
									onRemove={() => removeTag(tag)}
								/>
							))}
						</div>
					)}
				</FormField>
				{error && <p className="font-mono text-xs text-destructive">{error}</p>}
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
						{submitting ? "Creating..." : "Create"}
					</Button>
				</div>
			</div>
		</Dialog>
	);
}

function EditProjectDialog({
	target,
	onClose,
	updateProject,
}: {
	target: EditProjectTarget | null;
	onClose: () => void;
	updateProject: (args: {
		projectId: Id<"projects">;
		name?: string;
		description?: string;
		url?: string;
		tags?: string[];
	}) => Promise<null>;
}) {
	const tagsId = useId();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [url, setUrl] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (target) {
			setName(target.name);
			setDescription(target.description);
			setUrl(target.url);
			setTags(target.tags);
			setTagInput("");
			setError(null);
		}
	}, [target]);

	const addTag = () => {
		const trimmed = tagInput.trim().toLowerCase();
		if (trimmed && !tags.includes(trimmed)) {
			setTags([...tags, trimmed]);
		}
		setTagInput("");
	};

	const removeTag = (tag: string) => {
		setTags(tags.filter((t) => t !== tag));
	};

	const reset = () => {
		setTagInput("");
		setError(null);
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const handleSubmit = async () => {
		const trimmedName = name.trim();
		if (!target || !trimmedName || submitting) return;
		setSubmitting(true);
		setError(null);
		try {
			await updateProject({
				projectId: target.id,
				name: trimmedName,
				description: description.trim() || undefined,
				url: url.trim() || undefined,
				tags,
			});
			reset();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update project");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={target !== null} onClose={handleClose} title="Edit Project">
			<div className="space-y-4">
				<FormInput
					label="Name"
					required
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="My project"
				/>
				<FormTextarea
					label="Description"
					rows={2}
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Short description of the project..."
				/>
				<FormInput
					label="URL"
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					placeholder="https://..."
				/>
				<FormField label="Tags" htmlFor={tagsId}>
					<input
						id={tagsId}
						type="text"
						value={tagInput}
						onChange={(e) => setTagInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								addTag();
							}
						}}
						placeholder="Add tag + Enter"
						className="w-full border-2 border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
					/>
					{tags.length > 0 && (
						<div className="mt-2 flex flex-wrap gap-1.5">
							{tags.map((tag) => (
								<TagBadge
									key={tag}
									tag={tag}
									size="md"
									onRemove={() => removeTag(tag)}
								/>
							))}
						</div>
					)}
				</FormField>
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
						{submitting ? "Saving..." : "Save"}
					</Button>
				</div>
			</div>
		</Dialog>
	);
}
