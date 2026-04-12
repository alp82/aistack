import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import {
	ArrowLeft,
	Check,
	Copy,
	Download,
	ExternalLink,
	Globe,
	Terminal,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { InstructionItem } from "@/components/InstructionItem";
import { TagBadge } from "@/components/TagBadge";
import { FileContentDialog } from "@/components/editor/FileContentDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { InstructionItem as InstructionItemType } from "@/features/stack-editor/types";
import { seoMeta } from "@/lib/seo";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export const Route = createFileRoute("/stacks/$slug_/projects/$projectSlug")({
	component: ProjectDetailPage,
	loader: async ({ context, params }) => {
		const project = await context.queryClient.ensureQueryData(
			convexQuery(api.projects.getBySlug, { slug: params.projectSlug }),
		);
		return { project };
	},
	head: ({ loaderData }) => {
		if (!loaderData?.project) {
			return {
				meta: seoMeta({
					title: "Project Not Found",
					description: "This project could not be found.",
					noindex: true,
				}),
			};
		}
		const project = loaderData.project;
		const fileCount = project.instructions.reduce(
			(sum: number, i: { files: unknown[] }) => sum + i.files.length,
			0,
		);
		return {
			meta: seoMeta({
				title: `${project.name} - AI Project`,
				description: `AI development configuration with ${fileCount} files. Clone via CLI.`,
				url: `/stacks/${project.stack.slug}/projects/${project.slug}`,
			}),
		};
	},
});

function ProjectDetailPage() {
	const { slug, projectSlug } = Route.useParams();
	const navigate = useNavigate();
	const project = useQuery(api.projects.getBySlug, { slug: projectSlug });
	const deleteProject = useMutation(api.projects.deleteProject);
	const updateProject = useMutation(api.projects.updateProject);
	const publishProject = useMutation(api.projects.publishProject);
	const [activeInstruction, setActiveInstruction] =
		useState<InstructionItemType | null>(null);
	const [copied, setCopied] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleting, setDeleting] = useState(false);

	if (project === undefined) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="font-mono text-sm text-fg-muted">
					Loading project...
				</div>
			</div>
		);
	}

	if (project === null || (project.published !== true && !project.isOwner)) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-bg-canvas">
				<div className="text-center">
					<h1 className="mb-4 text-2xl font-bold text-fg-primary">
						Project not found
					</h1>
					<Link
						to="/stacks/$slug"
						params={{ slug }}
						className="font-mono text-sm text-accent-lime hover:text-accent-lime-strong"
					>
						&larr; Back to stack
					</Link>
				</div>
			</div>
		);
	}

	const { localItems, globalItems, localFileCount, globalFileCount } =
		useMemo(() => {
			const local: typeof project.instructions = [];
			const global: typeof project.instructions = [];
			for (const item of project.instructions) {
				const isGlobal = item.files.some((f: { tags?: string[] }) =>
					f.tags?.includes("global"),
				);
				if (isGlobal) global.push(item);
				else local.push(item);
			}
			return {
				localItems: local,
				globalItems: global,
				localFileCount: local.reduce(
					(s: number, i: { files: unknown[] }) => s + i.files.length,
					0,
				),
				globalFileCount: global.reduce(
					(s: number, i: { files: unknown[] }) => s + i.files.length,
					0,
				),
			};
		}, [project.instructions]);

	const fileCount = localFileCount + globalFileCount;
	const createCommand = `npx @aistack/cli create ${project.slug}`;

	const handleCopyCommand = () => {
		navigator.clipboard.writeText(createCommand);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="bg-bg-canvas">
			<header className="relative overflow-hidden py-8 md:py-12 px-6">
				<div
					className="pointer-events-none absolute inset-0 z-0 opacity-10"
					style={{
						backgroundImage:
							"linear-gradient(to right, var(--stroke-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--stroke-subtle) 1px, transparent 1px)",
						backgroundSize: "4rem 4rem",
						maskImage:
							"linear-gradient(to bottom, black 40%, transparent 100%)",
						WebkitMaskImage:
							"linear-gradient(to bottom, black 40%, transparent 100%)",
					}}
				/>
				<div className="mx-auto max-w-content">
					{project.isOwner && project.published !== true && (
						<div className="mb-6 flex items-center justify-between border-2 border-accent-lime/40 bg-accent-lime/5 px-5 py-4">
							<p className="font-mono text-sm text-fg-secondary">
								This project is a draft. Publish it to make it visible to
								visitors.
							</p>
							<button
								type="button"
								onClick={() =>
									publishProject({ projectId: project._id, published: true })
								}
								className="shrink-0 ml-4 border-2 border-accent-lime/50 bg-bg-panel px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-accent-lime transition-colors hover:border-accent-lime hover:bg-accent-lime/10 cursor-pointer"
							>
								Publish
							</button>
						</div>
					)}

					<Link
						to="/stacks/$slug"
						params={{ slug }}
						className="inline-flex items-center gap-1.5 font-mono text-sm text-fg-muted hover:text-accent-lime transition-colors mb-6"
					>
						<ArrowLeft className="size-4" />
						{project.stack.name}
					</Link>

					<div className="font-mono text-accent-lime mb-2 text-sm">
						{"// PROJECT"}
					</div>

					<h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] text-fg-primary break-words">
						{project.name}
					</h1>

					<div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-sm text-fg-muted">
						{project.isOwner && project.published === true && (
							<button
								type="button"
								onClick={() =>
									publishProject({
										projectId: project._id,
										published: false,
									})
								}
								className="inline-flex items-center gap-1.5 border border-stroke-subtle px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime cursor-pointer"
							>
								Unpublish
							</button>
						)}
						{project.isOwner && (
							<button
								type="button"
								onClick={() => setShowDeleteConfirm(true)}
								className="inline-flex items-center gap-1.5 border border-stroke-subtle px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-fg-muted transition-colors hover:border-destructive hover:text-destructive cursor-pointer"
							>
								<Trash2 className="size-3" />
								Delete
							</button>
						)}
						<span>by {project.creator.name}</span>
						<span className="text-stroke-subtle">|</span>
						<span>
							{fileCount} {fileCount === 1 ? "file" : "files"}
						</span>
						{(project.cloneCount ?? 0) > 0 && (
							<>
								<span className="text-stroke-subtle">|</span>
								<span className="inline-flex items-center gap-1">
									<Download className="size-3" />
									{project.cloneCount} clones
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

					{project.description && (
						<p className="mt-4 text-base text-fg-secondary max-w-2xl border-l-4 border-accent-lime pl-4">
							{project.description}
						</p>
					)}

					{project.url && (
						<a
							href={
								project.url.startsWith("http")
									? project.url
									: `https://${project.url}`
							}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-3 inline-flex items-center gap-1.5 font-mono text-sm text-accent-lime hover:text-accent-lime-strong transition-colors"
						>
							<ExternalLink className="size-3.5" />
							{project.url.replace(/^https?:\/\//, "").split("/")[0]}
						</a>
					)}

					{project.tags && project.tags.length > 0 && (
						<div className="mt-3 flex flex-wrap gap-1.5">
							{project.tags.map((tag) => (
								<TagBadge key={tag} tag={tag} size="md" />
							))}
						</div>
					)}

					{/* Clone command */}
					<div className="mt-8 border-2 border-stroke-strong bg-bg-panel p-4">
						<div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
							Clone via CLI
						</div>
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-2 flex-1 min-w-0 bg-bg-panel-muted px-3 py-2">
								<Terminal className="size-4 shrink-0 text-accent-lime" />
								<code className="font-mono text-sm text-fg-primary truncate">
									{createCommand}
								</code>
							</div>
							<button
								type="button"
								onClick={handleCopyCommand}
								className="shrink-0 inline-flex items-center gap-1.5 border-2 border-accent-lime/50 bg-bg-panel px-3 py-2 font-mono text-xs uppercase tracking-wider text-accent-lime transition-colors hover:border-accent-lime hover:bg-accent-lime/10 cursor-pointer"
							>
								{copied ? (
									<>
										<Check className="size-3" />
										Copied
									</>
								) : (
									<>
										<Copy className="size-3" />
										Copy
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			</header>

			{project.isOwner && (
				<ProjectEditSection
					projectId={project._id}
					name={project.name}
					description={project.description}
					url={project.url}
					tags={project.tags}
					updateProject={updateProject}
				/>
			)}

			<div className="mx-auto max-w-content px-6 py-12">
				{localItems.length > 0 && (
					<>
						<h2 className="mb-6 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent-lime">
							Project Files
							<span className="ml-2 text-fg-muted">{localFileCount}</span>
						</h2>
						<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
							{localItems.map((instruction) => (
								<InstructionItem
									key={instruction.name}
									instruction={instruction as InstructionItemType}
									onClick={() =>
										setActiveInstruction(instruction as InstructionItemType)
									}
								/>
							))}
						</div>
					</>
				)}

				{globalItems.length > 0 && (
					<div className="mt-12">
						<div className="mb-6 flex items-center gap-2">
							<Globe className="size-3.5 text-fg-muted" />
							<h2 className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-fg-muted">
								Global Config
								<span className="ml-2">{globalFileCount}</span>
							</h2>
						</div>
						<p className="mb-4 text-xs text-fg-muted">
							Creator's machine-wide config — shared across all their projects.
						</p>
						<div className="grid grid-cols-1 gap-2 md:grid-cols-2 opacity-80">
							{globalItems.map((instruction) => (
								<InstructionItem
									key={instruction.name}
									instruction={instruction as InstructionItemType}
									onClick={() =>
										setActiveInstruction(instruction as InstructionItemType)
									}
								/>
							))}
						</div>
					</div>
				)}
			</div>

			{activeInstruction && (
				<FileContentDialog
					open={!!activeInstruction}
					onClose={() => setActiveInstruction(null)}
					instructionName={activeInstruction.name}
					files={activeInstruction.files}
					isEditable={false}
				/>
			)}

			<ConfirmDialog
				open={showDeleteConfirm}
				onClose={() => setShowDeleteConfirm(false)}
				onConfirm={async () => {
					setDeleting(true);
					try {
						await deleteProject({ projectId: project._id });
						navigate({
							to: "/stacks/$slug",
							params: { slug },
						});
					} catch (err) {
						console.error("Failed to delete project:", err);
						setDeleting(false);
						setShowDeleteConfirm(false);
					}
				}}
				title="Delete project"
				description={`This will permanently delete "${project.name}" and all its files. This cannot be undone.`}
				confirmLabel="Delete"
				variant="danger"
				loading={deleting}
			/>
		</div>
	);
}

function ProjectEditSection({
	projectId,
	name,
	description,
	url,
	tags,
	updateProject,
}: {
	projectId: Id<"projects">;
	name: string;
	description?: string;
	url?: string;
	tags?: string[];
	updateProject: (args: {
		projectId: Id<"projects">;
		name?: string;
		description?: string;
		url?: string;
		tags?: string[];
	}) => Promise<null>;
}) {
	const [draftName, setDraftName] = useState(name);
	const [draftDescription, setDraftDescription] = useState(description ?? "");
	const [draftUrl, setDraftUrl] = useState(url ?? "");
	const [draftTags, setDraftTags] = useState<string[]>(tags ?? []);
	const [tagInput, setTagInput] = useState("");

	useEffect(() => {
		setDraftName(name);
	}, [name]);

	useEffect(() => {
		setDraftDescription(description ?? "");
	}, [description]);

	useEffect(() => {
		setDraftUrl(url ?? "");
	}, [url]);

	useEffect(() => {
		setDraftTags(tags ?? []);
	}, [tags]);

	const commitName = () => {
		const trimmed = draftName.trim();
		if (trimmed && trimmed !== name) {
			updateProject({ projectId, name: trimmed });
		}
	};

	const commitDescription = () => {
		const trimmed = draftDescription.trim();
		if (trimmed !== (description ?? "")) {
			updateProject({ projectId, description: trimmed });
		}
	};

	const commitUrl = () => {
		const trimmed = draftUrl.trim();
		if (trimmed !== (url ?? "")) {
			updateProject({ projectId, url: trimmed });
		}
	};

	const addTag = () => {
		const trimmed = tagInput.trim().toLowerCase();
		if (trimmed && !draftTags.includes(trimmed)) {
			const newTags = [...draftTags, trimmed];
			setDraftTags(newTags);
			setTagInput("");
			updateProject({ projectId, tags: newTags });
		} else {
			setTagInput("");
		}
	};

	const removeTag = (tag: string) => {
		const newTags = draftTags.filter((t) => t !== tag);
		setDraftTags(newTags);
		updateProject({ projectId, tags: newTags });
	};

	return (
		<div className="mx-auto max-w-content px-6 pt-8">
			<div className="border-2 border-stroke-strong bg-zinc-950 p-6">
				<h3 className="mb-4 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent-lime">
					Edit Project
				</h3>
				<div className="space-y-4">
					<div>
						<label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-fg-muted">
							Name
						</label>
						<input
							type="text"
							value={draftName}
							onChange={(e) => setDraftName(e.target.value)}
							onBlur={commitName}
							className="w-full border-2 border-stroke-subtle bg-zinc-900 px-3 py-2 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
						/>
					</div>

					<div>
						<label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-fg-muted">
							Description
						</label>
						<textarea
							value={draftDescription}
							onChange={(e) => setDraftDescription(e.target.value)}
							onBlur={commitDescription}
							placeholder="Short description of the project..."
							rows={2}
							className="w-full resize-none border-2 border-stroke-subtle bg-zinc-900 px-3 py-2 text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
						/>
					</div>

					<div>
						<label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-fg-muted">
							URL
						</label>
						<div className="flex items-center border-2 border-stroke-subtle bg-zinc-900 focus-within:border-accent-lime">
							<ExternalLink className="ml-3 size-4 shrink-0 text-fg-muted" />
							<input
								type="text"
								value={draftUrl}
								onChange={(e) => setDraftUrl(e.target.value)}
								onBlur={commitUrl}
								placeholder="https://..."
								className="flex-1 border-0 bg-transparent px-2 py-2 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:outline-none focus:ring-0"
							/>
						</div>
					</div>

					<div>
						<label className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-fg-muted">
							Tags
						</label>
						<div className="flex items-center gap-2">
							<input
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
								className="flex-1 border-2 border-stroke-subtle bg-zinc-900 px-3 py-2 font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
							/>
						</div>
						{draftTags.length > 0 && (
							<div className="mt-2 flex flex-wrap gap-1.5">
								{draftTags.map((tag) => (
									<TagBadge
										key={tag}
										tag={tag}
										size="md"
										onRemove={() => removeTag(tag)}
									/>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
