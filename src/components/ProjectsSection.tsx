import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Check, Copy, Download, FolderOpen, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ProjectOrderButtons } from "@/components/ProjectOrderButtons";
import { TagBadge } from "@/components/TagBadge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/form-field";
import { FormInput } from "@/components/ui/form-input";
import { FormTextarea } from "@/components/ui/form-textarea";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function ProjectsSection({
	stackId,
	stackSlug,
	isOwner,
}: {
	stackId: Id<"stacks">;
	stackSlug: string;
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
	const [deleteTarget, setDeleteTarget] = useState<{
		id: Id<"projects">;
		name: string;
	} | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [copied, setCopied] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);

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
		<section className="py-12">
			<div className="mx-auto max-w-content px-6">
				<div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
					<h2 className="font-mono text-sm text-accent-lime">
						{"// PROJECTS"}
					</h2>
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
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{projects.map((project, index) => {
							const isDraft = project.published !== true;
							return (
								<div key={project._id} className="flex gap-2">
									{isOwner && projects.length > 1 && (
										<ProjectOrderButtons
											index={index}
											total={projects.length}
											onMove={(dir) => handleMove(index, dir)}
										/>
									)}
									<div
										className={`flex-1 flex flex-col border-2 bg-bg-canvas transition-all hover:border-accent-lime ${
											isDraft
												? "border-dashed border-stroke-subtle"
												: "border-stroke-strong"
										}`}
									>
										<Link
											to="/stacks/$slug/projects/$projectSlug"
											params={{ slug: stackSlug, projectSlug: project.slug }}
											className="group flex-1 p-5"
										>
											<div className="flex items-start gap-3">
												<div className="flex size-10 shrink-0 items-center justify-center border border-stroke-subtle bg-bg-panel-muted group-hover:border-accent-lime/50">
													<FolderOpen className="size-5 text-fg-muted group-hover:text-accent-lime" />
												</div>
												<div className="min-w-0 flex-1">
													<div className="flex items-center gap-2">
														<p className="truncate font-mono text-sm font-semibold text-fg-primary">
															{project.name}
														</p>
														{isDraft && (
															<span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider text-fg-muted border border-dashed border-stroke-subtle px-1.5 py-0.5">
																Draft
															</span>
														)}
													</div>
													{project.description && (
														<p className="mt-1 text-xs text-fg-secondary line-clamp-2">
															{project.description}
														</p>
													)}
													{project.tags && project.tags.length > 0 && (
														<div className="mt-2 flex flex-wrap gap-1">
															{project.tags.map((tag) => (
																<TagBadge key={tag} tag={tag} size="sm" />
															))}
														</div>
													)}
													<div className="mt-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
														<span>{project.fileCount} files</span>
														{(project.cloneCount ?? 0) > 0 && (
															<>
																<span className="text-stroke-subtle">|</span>
																<span className="inline-flex items-center gap-1">
																	<Download className="size-3" />
																	{project.cloneCount}
																</span>
															</>
														)}
														{project.source && (
															<>
																<span className="text-stroke-subtle">|</span>
																<span>via {project.source}</span>
															</>
														)}
													</div>
												</div>
											</div>
										</Link>
										{isOwner && (
											<div className="flex gap-1 border-t border-stroke-subtle p-2">
												<button
													type="button"
													onClick={() =>
														publishProject({
															projectId: project._id,
															published: !isDraft ? false : true,
														})
													}
													className="flex-1 font-mono text-[10px] font-semibold uppercase tracking-wider border border-stroke-subtle px-2 py-1 text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime cursor-pointer"
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
														className="font-mono text-[10px] font-semibold uppercase tracking-wider border border-stroke-subtle px-2 py-1 text-fg-muted transition-colors hover:border-destructive hover:text-destructive cursor-pointer"
													>
														<Trash2 className="size-3" />
													</button>
												)}
											</div>
										)}
									</div>
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
			</div>
		</section>
	);
}

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
				<FormField label="Tags" htmlFor="create-project-tags">
					<input
						id="create-project-tags"
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
