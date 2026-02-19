import { ExternalLink, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { isValidHttpUrl } from "@/features/stack-editor/editor-status";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";
import type { StackMetadataUpdates, StackResource } from "@/features/stack-editor/types";

type WorkflowStepProps = {
	description: string;
	onDescriptionChange: (value: string) => void;
	stackUrl?: string;
	prompts?: boolean;
	rules?: boolean;
	skills?: boolean;
	mcps?: boolean;
	resources: StackResource[];
	onMetadataUpdate: (updates: StackMetadataUpdates) => void;
};

const metaFlags = [
	{ key: "prompts" as const, label: "Prompts", description: "Custom prompts for AI tools" },
	{ key: "rules" as const, label: "Rules", description: "Coding rules and guidelines" },
	{ key: "skills" as const, label: "Skills", description: "Reusable skill definitions" },
	{ key: "mcps" as const, label: "MCPs", description: "Model Context Protocols" },
] as const;

function WorkflowStep({
	description,
	onDescriptionChange,
	stackUrl,
	prompts,
	rules,
	skills,
	mcps,
	resources,
	onMetadataUpdate,
}: WorkflowStepProps) {
	const [newResourceLabel, setNewResourceLabel] = useState("");
	const [newResourceUrl, setNewResourceUrl] = useState("");
	const [expandedResource, setExpandedResource] = useState<number | null>(null);
	const [showPreview, setShowPreview] = useState(false);

	const flags = { prompts, rules, skills, mcps };
	const trimmedStackUrl = stackUrl?.trim() ?? "";
	const stackUrlInvalid = trimmedStackUrl.length > 0 && !isValidHttpUrl(trimmedStackUrl);

	const addResource = () => {
		if (!newResourceUrl.trim()) return;
		onMetadataUpdate({
			resources: [
				...resources,
				{
					label: newResourceLabel.trim() || newResourceUrl.trim(),
					url: newResourceUrl.trim(),
				},
			],
		});
		setNewResourceLabel("");
		setNewResourceUrl("");
	};

	const removeResource = (index: number) => {
		onMetadataUpdate({
			resources: resources.filter((_, i) => i !== index),
		});
	};

	return (
		<div className="space-y-8">
			<div className="border-b border-stroke-subtle pb-6">
				<p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
					// Step 03
				</p>
				<h2 className="text-2xl font-black uppercase tracking-tight text-fg-primary">
					Workflow
				</h2>
				<p className="mt-2 text-sm text-fg-muted">
					Describe your workflow and add metadata about your stack.
				</p>
			</div>

			<div className="space-y-8">
				{/* Description with Markdown Preview */}
				<div>
					<div className="mb-2 flex items-center justify-between">
						<label className="font-mono text-xs uppercase tracking-wider text-fg-muted">
							Description
						</label>
						<div className="flex border-2 border-stroke-subtle">
							<button
								type="button"
								onClick={() => setShowPreview(false)}
								className={cn(
									"flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] uppercase transition-colors",
									!showPreview
										? "bg-accent-lime text-accent-lime-contrast"
										: "bg-transparent text-fg-muted hover:text-fg-primary",
								)}
							>
								<Pencil className="size-3" />
								Edit
							</button>
							<button
								type="button"
								onClick={() => setShowPreview(true)}
								className={cn(
									"flex items-center gap-1.5 border-l-2 border-stroke-subtle px-2 py-1 font-mono text-[10px] uppercase transition-colors",
									showPreview
										? "bg-accent-lime text-accent-lime-contrast"
										: "bg-transparent text-fg-muted hover:text-fg-primary",
								)}
							>
								<Eye className="size-3" />
								Preview
							</button>
						</div>
					</div>

					{showPreview ? (
						<div className="min-h-64 border-2 border-stroke-subtle bg-bg-panel p-4">
							{description.trim() ? (
								<MarkdownRenderer content={description} />
							) : (
								<p className="font-mono text-sm italic text-fg-muted">
									No content to preview...
								</p>
							)}
						</div>
					) : (
						<Textarea
							id="description"
							value={description}
							onChange={(e) => onDescriptionChange(e.target.value)}
							placeholder="## My Stack&#10;&#10;Describe how you use these tools..."
							className="min-h-64 max-h-96 resize-y font-mono text-sm"
							rows={12}
						/>
					)}
					<p className="mt-2 font-mono text-[10px] text-fg-muted">
						Describe your stack in detail. Markdown supported.
					</p>
				</div>

				<div className="border-t border-stroke-subtle pt-8">
					<h3 className="mb-4 font-mono text-xs uppercase tracking-wider text-fg-primary">
						Stack Metadata
					</h3>

					<div className="space-y-6">
						<FormField
							label="Repository URL"
							htmlFor="stack-url"
							description="Link to your public repository or documentation."
							error={stackUrlInvalid ? "Must be a valid http(s) URL" : undefined}
						>
							<Input
								id="stack-url"
								value={stackUrl ?? ""}
								onChange={(e) =>
									onMetadataUpdate({ stackUrl: e.target.value.trim() || undefined })
								}
								placeholder="https://github.com/..."
								aria-invalid={stackUrlInvalid || undefined}
							/>
						</FormField>

						<div>
							<p className="mb-3 font-mono text-xs uppercase tracking-wider text-fg-muted">
								Workflow Features
							</p>
							<div className="grid grid-cols-2 gap-2">
								{metaFlags.map((flag) => {
									const isEnabled = flags[flag.key] ?? false;
									return (
										<button
											key={flag.key}
											type="button"
											onClick={() => onMetadataUpdate({ [flag.key]: !isEnabled })}
											className={cn(
												"flex items-center justify-between border-2 p-3 text-left transition-all",
												isEnabled
													? "border-accent-lime bg-accent-lime/10"
													: "border-stroke-subtle bg-transparent hover:border-fg-muted",
											)}
										>
											<div>
												<p
													className={cn(
														"font-mono text-xs uppercase tracking-wider",
														isEnabled ? "text-accent-lime" : "text-fg-muted",
													)}
												>
													{flag.label}
												</p>
												<p className="mt-0.5 text-[10px] text-fg-muted">
													{flag.description}
												</p>
											</div>
											<div
												className={cn(
													"size-4 border-2 transition-colors",
													isEnabled
														? "border-accent-lime bg-accent-lime"
														: "border-stroke-subtle bg-transparent",
												)}
											/>
										</button>
									);
								})}
							</div>
						</div>

						<div>
							<p className="mb-3 font-mono text-xs uppercase tracking-wider text-fg-muted">
								Resources
							</p>
							<p className="mb-3 text-[10px] text-fg-muted">
								Add links to documentation, guides, or related resources.
							</p>

							<div className="space-y-2">
								{resources.map((resource, index) => (
									<div
										key={`${resource.url}-${resource.label}`}
										className="border-2 border-stroke-subtle bg-bg-panel-muted"
									>
										<div className="flex items-center gap-2 p-2">
											<ExternalLink className="size-4 shrink-0 text-accent-lime" />
											<a
												href={resource.url}
												target="_blank"
												rel="noopener noreferrer"
												className="flex-1 truncate font-mono text-xs text-accent-lime transition-colors hover:text-accent-lime-strong"
											>
												{resource.label}
											</a>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													setExpandedResource(expandedResource === index ? null : index)
												}
												className="h-auto px-2 py-1 font-mono text-[10px] text-fg-muted hover:text-fg-primary"
											>
												{expandedResource === index ? "Hide" : "Edit"}
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => removeResource(index)}
												className="size-6 text-fg-muted hover:text-destructive"
											>
												<Trash2 className="size-3.5" />
											</Button>
										</div>
										{expandedResource === index && (
											<div className="space-y-2 border-t border-stroke-subtle p-2">
												<Input
													value={resource.label}
													onChange={(e) => {
														const updated = [...resources];
														updated[index] = { ...resource, label: e.target.value };
														onMetadataUpdate({ resources: updated });
													}}
													placeholder="Label"
													className="text-sm"
												/>
												<Input
													value={resource.url}
													onChange={(e) => {
														const updated = [...resources];
														updated[index] = { ...resource, url: e.target.value };
														onMetadataUpdate({ resources: updated });
													}}
													placeholder="https://..."
													className="text-sm"
													aria-invalid={!isValidHttpUrl(resource.url) || undefined}
												/>
											</div>
										)}
									</div>
								))}

								<div className="flex gap-2">
									<Input
										value={newResourceUrl}
										onChange={(e) => setNewResourceUrl(e.target.value)}
										placeholder="https://... (required)"
										className="flex-1"
									/>
									<Input
										value={newResourceLabel}
										onChange={(e) => setNewResourceLabel(e.target.value)}
										placeholder="Label (optional)"
										className="flex-1"
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={addResource}
										disabled={!newResourceUrl.trim()}
										className="shrink-0 text-accent-lime hover:text-accent-lime-strong disabled:opacity-30"
									>
										<Plus className="size-4" />
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export { WorkflowStep };
export type { WorkflowStepProps };
