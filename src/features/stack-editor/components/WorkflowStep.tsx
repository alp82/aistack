import { ChevronDown, ChevronUp, ExternalLink, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { isValidHttpUrl } from "@/features/stack-editor/editor-status";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";
import type { McpItem, ModelItem, PromptItem, RuleItem, SkillItem, StackMetadataUpdates, StackResource } from "@/features/stack-editor/types";

type MetadataArraySectionProps<T> = {
	title: string;
	description: string;
	items: T[];
	isExpanded: boolean;
	onToggle: () => void;
	onAdd: () => void;
	onRemove: (index: number) => void;
	renderItem: (item: T, index: number) => ReactNode;
};

function MetadataArraySection<T>({
	title,
	description,
	items,
	isExpanded,
	onToggle,
	onAdd,
	onRemove,
	renderItem,
}: MetadataArraySectionProps<T>) {
	return (
		<div className="border-2 border-stroke-subtle">
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-bg-panel-muted"
			>
				<div>
					<p className="font-mono text-xs uppercase tracking-wider text-fg-primary">
						{title}
						{items.length > 0 && (
							<span className="ml-2 text-accent-lime">({items.length})</span>
						)}
					</p>
					<p className="mt-0.5 text-[10px] text-fg-muted">{description}</p>
				</div>
				{isExpanded ? (
					<ChevronUp className="size-4 text-fg-muted" />
				) : (
					<ChevronDown className="size-4 text-fg-muted" />
				)}
			</button>
			{isExpanded && (
				<div className="space-y-3 border-t border-stroke-subtle p-3">
					{items.map((item, index) => (
						<div key={index} className="relative border border-stroke-subtle bg-bg-panel-muted p-3">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => onRemove(index)}
								className="absolute right-1 top-1 size-6 text-fg-muted hover:text-destructive"
							>
								<Trash2 className="size-3.5" />
							</Button>
							{renderItem(item, index)}
						</div>
					))}
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onAdd}
						className="w-full border-2 border-dashed border-stroke-subtle text-fg-muted hover:border-accent-lime hover:text-accent-lime"
					>
						<Plus className="mr-1 size-4" />
						Add {title.slice(0, -1)}
					</Button>
				</div>
			)}
		</div>
	);
}

type WorkflowStepProps = {
	description: string;
	onDescriptionChange: (value: string) => void;
	stackUrl?: string;
	prompts: PromptItem[];
	rules: RuleItem[];
	skills: SkillItem[];
	mcps: McpItem[];
	models: ModelItem[];
	resources: StackResource[];
	onMetadataUpdate: (updates: StackMetadataUpdates) => void;
};

function WorkflowStep({
	description,
	onDescriptionChange,
	stackUrl,
	prompts,
	rules,
	skills,
	mcps,
	models,
	resources,
	onMetadataUpdate,
}: WorkflowStepProps) {
	const [newResourceLabel, setNewResourceLabel] = useState("");
	const [newResourceUrl, setNewResourceUrl] = useState("");
	const [expandedResource, setExpandedResource] = useState<number | null>(null);
	const [showPreview, setShowPreview] = useState(false);
	const [expandedSection, setExpandedSection] = useState<string | null>(null);
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

						{/* Prompts Section */}
						<MetadataArraySection
							title="Prompts"
							description="Custom prompts for AI tools"
							items={prompts}
							isExpanded={expandedSection === "prompts"}
							onToggle={() => setExpandedSection(expandedSection === "prompts" ? null : "prompts")}
							onAdd={() => onMetadataUpdate({ prompts: [...prompts, { name: "", description: "" }] })}
							onRemove={(index) => onMetadataUpdate({ prompts: prompts.filter((_, i) => i !== index) })}
							renderItem={(item, index) => (
								<div className="space-y-2">
									<Input
										value={item.name}
										onChange={(e) => {
											const updated = [...prompts];
											updated[index] = { ...item, name: e.target.value };
											onMetadataUpdate({ prompts: updated });
										}}
										placeholder="Prompt name"
										className="text-sm"
									/>
									<Input
										value={item.description}
										onChange={(e) => {
											const updated = [...prompts];
											updated[index] = { ...item, description: e.target.value };
											onMetadataUpdate({ prompts: updated });
										}}
										placeholder="What does this prompt do?"
										className="text-sm"
									/>
								</div>
							)}
						/>

						{/* Rules Section */}
						<MetadataArraySection
							title="Rules"
							description="Coding rules and guidelines"
							items={rules}
							isExpanded={expandedSection === "rules"}
							onToggle={() => setExpandedSection(expandedSection === "rules" ? null : "rules")}
							onAdd={() => onMetadataUpdate({ rules: [...rules, { name: "", description: "" }] })}
							onRemove={(index) => onMetadataUpdate({ rules: rules.filter((_, i) => i !== index) })}
							renderItem={(item, index) => (
								<div className="space-y-2">
									<Input
										value={item.name}
										onChange={(e) => {
											const updated = [...rules];
											updated[index] = { ...item, name: e.target.value };
											onMetadataUpdate({ rules: updated });
										}}
										placeholder="Rule name"
										className="text-sm"
									/>
									<Input
										value={item.description}
										onChange={(e) => {
											const updated = [...rules];
											updated[index] = { ...item, description: e.target.value };
											onMetadataUpdate({ rules: updated });
										}}
										placeholder="What does this rule enforce?"
										className="text-sm"
									/>
								</div>
							)}
						/>

						{/* Skills Section */}
						<MetadataArraySection
							title="Skills"
							description="Reusable skill definitions"
							items={skills}
							isExpanded={expandedSection === "skills"}
							onToggle={() => setExpandedSection(expandedSection === "skills" ? null : "skills")}
							onAdd={() => onMetadataUpdate({ skills: [...skills, { name: "", description: "" }] })}
							onRemove={(index) => onMetadataUpdate({ skills: skills.filter((_, i) => i !== index) })}
							renderItem={(item, index) => (
								<div className="space-y-2">
									<Input
										value={item.name}
										onChange={(e) => {
											const updated = [...skills];
											updated[index] = { ...item, name: e.target.value };
											onMetadataUpdate({ skills: updated });
										}}
										placeholder="Skill name"
										className="text-sm"
									/>
									<Input
										value={item.description}
										onChange={(e) => {
											const updated = [...skills];
											updated[index] = { ...item, description: e.target.value };
											onMetadataUpdate({ skills: updated });
										}}
										placeholder="What does this skill do?"
										className="text-sm"
									/>
									<Input
										value={item.trigger ?? ""}
										onChange={(e) => {
											const updated = [...skills];
											updated[index] = { ...item, trigger: e.target.value || undefined };
											onMetadataUpdate({ skills: updated });
										}}
										placeholder="Trigger command (e.g., /deploy)"
										className="text-sm"
									/>
								</div>
							)}
						/>

						{/* MCPs Section */}
						<MetadataArraySection
							title="MCPs"
							description="Model Context Protocols"
							items={mcps}
							isExpanded={expandedSection === "mcps"}
							onToggle={() => setExpandedSection(expandedSection === "mcps" ? null : "mcps")}
							onAdd={() => onMetadataUpdate({ mcps: [...mcps, { name: "", purpose: "" }] })}
							onRemove={(index) => onMetadataUpdate({ mcps: mcps.filter((_, i) => i !== index) })}
							renderItem={(item, index) => (
								<div className="space-y-2">
									<Input
										value={item.name}
										onChange={(e) => {
											const updated = [...mcps];
											updated[index] = { ...item, name: e.target.value };
											onMetadataUpdate({ mcps: updated });
										}}
										placeholder="MCP name"
										className="text-sm"
									/>
									<Input
										value={item.purpose}
										onChange={(e) => {
											const updated = [...mcps];
											updated[index] = { ...item, purpose: e.target.value };
											onMetadataUpdate({ mcps: updated });
										}}
										placeholder="What is this MCP used for?"
										className="text-sm"
									/>
									<Input
										value={item.url ?? ""}
										onChange={(e) => {
											const updated = [...mcps];
											updated[index] = { ...item, url: e.target.value || undefined };
											onMetadataUpdate({ mcps: updated });
										}}
										placeholder="URL (optional)"
										className="text-sm"
									/>
								</div>
							)}
						/>

						{/* Models Section */}
						<MetadataArraySection
							title="Models"
							description="AI models used in your workflow"
							items={models}
							isExpanded={expandedSection === "models"}
							onToggle={() => setExpandedSection(expandedSection === "models" ? null : "models")}
							onAdd={() => onMetadataUpdate({ models: [...models, { name: "", role: "" }] })}
							onRemove={(index) => onMetadataUpdate({ models: models.filter((_, i) => i !== index) })}
							renderItem={(item, index) => (
								<div className="space-y-2">
									<Input
										value={item.name}
										onChange={(e) => {
											const updated = [...models];
											updated[index] = { ...item, name: e.target.value };
											onMetadataUpdate({ models: updated });
										}}
										placeholder="Model name (e.g., Claude 3.5 Sonnet)"
										className="text-sm"
									/>
									<Input
										value={item.role}
										onChange={(e) => {
											const updated = [...models];
											updated[index] = { ...item, role: e.target.value };
											onMetadataUpdate({ models: updated });
										}}
										placeholder="Role (e.g., Primary coding)"
										className="text-sm"
									/>
								</div>
							)}
						/>

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
