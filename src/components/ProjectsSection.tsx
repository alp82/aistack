import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Check, Copy, Download, FolderOpen, Trash2 } from "lucide-react";
import { useState } from "react";
import { ProjectOrderButtons } from "@/components/ProjectOrderButtons";
import { TagBadge } from "@/components/TagBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
	const [deleteTarget, setDeleteTarget] = useState<{
		id: Id<"projects">;
		name: string;
	} | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [copied, setCopied] = useState(false);

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
												<button
													type="button"
													onClick={() =>
														setDeleteTarget({
															id: project._id,
															name: project.name,
														})
													}
													className="font-mono text-[10px] font-semibold uppercase tracking-wider border border-stroke-subtle px-2 py-1 text-fg-muted transition-colors hover:border-destructive hover:text-destructive cursor-pointer"
												>
													<Trash2 className="size-3" />
												</button>
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
			</div>
		</section>
	);
}
