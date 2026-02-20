import { ChevronDown, ChevronUp, ExternalLink, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import { isValidHttpUrl } from "@/features/stack-editor/editor-status";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface Resource {
	label: string;
	url: string;
}

interface PromptItem {
	name: string;
	description: string;
	content?: string;
}

interface RuleItem {
	name: string;
	description: string;
}

interface SkillItem {
	name: string;
	description: string;
	trigger?: string;
}

interface McpItem {
	name: string;
	purpose: string;
	url?: string;
}

interface ModelItem {
	name: string;
	role: string;
}

interface MetadataEditorProps {
	stackUrl?: string;
	prompts: PromptItem[];
	rules: RuleItem[];
	skills: SkillItem[];
	mcps: McpItem[];
	models: ModelItem[];
	resources: Resource[];
	onUpdate: (updates: {
		stackUrl?: string;
		prompts?: PromptItem[];
		rules?: RuleItem[];
		skills?: SkillItem[];
		mcps?: McpItem[];
		models?: ModelItem[];
		resources?: Resource[];
	}) => void;
}

type ArraySectionProps<T> = {
	title: string;
	description: string;
	items: T[];
	isExpanded: boolean;
	onToggle: () => void;
	onAdd: () => void;
	onRemove: (index: number) => void;
	renderItem: (item: T, index: number) => ReactNode;
};

function ArraySection<T>({
	title,
	description,
	items,
	isExpanded,
	onToggle,
	onAdd,
	onRemove,
	renderItem,
}: ArraySectionProps<T>) {
	return (
		<div className="border border-gray-700 rounded-md">
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full items-center justify-between p-3 text-left hover:bg-slate-700/30"
			>
				<div>
					<span className="text-sm font-medium text-gray-300">
						{title}
						{items.length > 0 && (
							<span className="ml-2 text-cyan-400">({items.length})</span>
						)}
					</span>
					<p className="text-xs text-gray-500">{description}</p>
				</div>
				{isExpanded ? (
					<ChevronUp className="size-4 text-gray-500" />
				) : (
					<ChevronDown className="size-4 text-gray-500" />
				)}
			</button>
			{isExpanded && (
				<div className="space-y-2 border-t border-gray-700 p-3">
					{items.map((item, index) => (
						<div key={index} className="relative border border-gray-600 bg-slate-700/30 p-3 rounded">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => onRemove(index)}
								className="absolute right-1 top-1 size-6 text-gray-500 hover:text-red-400"
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
						className="w-full border border-dashed border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-400"
					>
						<Plus className="mr-1 size-4" />
						Add {title.slice(0, -1)}
					</Button>
				</div>
			)}
		</div>
	);
}

export function MetadataEditor({
	stackUrl,
	prompts,
	rules,
	skills,
	mcps,
	models,
	resources,
	onUpdate,
}: MetadataEditorProps) {
	const [newResourceLabel, setNewResourceLabel] = useState("");
	const [newResourceUrl, setNewResourceUrl] = useState("");
	const stackUrlInputId = useId();
	const stackUrlErrorId = `${stackUrlInputId}-error`;

	const [expandedSection, setExpandedSection] = useState<string | null>(null);
	const [expandedResource, setExpandedResource] = useState<number | null>(null);
	const trimmedStackUrl = stackUrl?.trim() ?? "";
	const stackUrlInvalid = trimmedStackUrl.length > 0 && !isValidHttpUrl(trimmedStackUrl);

	const addResource = () => {
		if (!newResourceUrl.trim()) return;
		onUpdate({
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
		onUpdate({
			resources: resources.filter((_, i) => i !== index),
		});
	};

	return (
		<div className="space-y-4">
			<h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
				Stack Metadata
			</h3>

			<div className="space-y-1.5">
				<Label htmlFor={stackUrlInputId} className="text-gray-300">Repository / Stack URL</Label>
				<Input
					id={stackUrlInputId}
					value={stackUrl ?? ""}
					onChange={(e) =>
						onUpdate({ stackUrl: e.target.value.trim() || undefined })
					}
					placeholder="https://github.com/..."
					className="bg-slate-700/50 border-gray-600 text-white"
					aria-invalid={stackUrlInvalid || undefined}
					aria-describedby={stackUrlInvalid ? stackUrlErrorId : undefined}
				/>
				{stackUrlInvalid && (
					<p id={stackUrlErrorId} className="text-xs text-red-300">
						Repository URL must be a valid http(s) address.
					</p>
				)}
				<p className="text-xs text-gray-500">
					Link to the public repository or documentation for this stack.
				</p>
			</div>

			<div className="space-y-3">
				<ArraySection
					title="Prompts"
					description="Custom prompts for AI tools"
					items={prompts}
					isExpanded={expandedSection === "prompts"}
					onToggle={() => setExpandedSection(expandedSection === "prompts" ? null : "prompts")}
					onAdd={() => onUpdate({ prompts: [...prompts, { name: "", description: "" }] })}
					onRemove={(index) => onUpdate({ prompts: prompts.filter((_, i) => i !== index) })}
					renderItem={(item, index) => (
						<div className="space-y-2 pr-6">
							<Input value={item.name} onChange={(e) => { const u = [...prompts]; u[index] = { ...item, name: e.target.value }; onUpdate({ prompts: u }); }} placeholder="Name" className="bg-slate-700/50 border-gray-600 text-white text-sm" />
							<Input value={item.description} onChange={(e) => { const u = [...prompts]; u[index] = { ...item, description: e.target.value }; onUpdate({ prompts: u }); }} placeholder="Description" className="bg-slate-700/50 border-gray-600 text-white text-sm" />
						</div>
					)}
				/>
				<ArraySection
					title="Rules"
					description="Coding rules and guidelines"
					items={rules}
					isExpanded={expandedSection === "rules"}
					onToggle={() => setExpandedSection(expandedSection === "rules" ? null : "rules")}
					onAdd={() => onUpdate({ rules: [...rules, { name: "", description: "" }] })}
					onRemove={(index) => onUpdate({ rules: rules.filter((_, i) => i !== index) })}
					renderItem={(item, index) => (
						<div className="space-y-2 pr-6">
							<Input value={item.name} onChange={(e) => { const u = [...rules]; u[index] = { ...item, name: e.target.value }; onUpdate({ rules: u }); }} placeholder="Name" className="bg-slate-700/50 border-gray-600 text-white text-sm" />
							<Input value={item.description} onChange={(e) => { const u = [...rules]; u[index] = { ...item, description: e.target.value }; onUpdate({ rules: u }); }} placeholder="Description" className="bg-slate-700/50 border-gray-600 text-white text-sm" />
						</div>
					)}
				/>
				<ArraySection
					title="Skills"
					description="Reusable skill definitions"
					items={skills}
					isExpanded={expandedSection === "skills"}
					onToggle={() => setExpandedSection(expandedSection === "skills" ? null : "skills")}
					onAdd={() => onUpdate({ skills: [...skills, { name: "", description: "" }] })}
					onRemove={(index) => onUpdate({ skills: skills.filter((_, i) => i !== index) })}
					renderItem={(item, index) => (
						<div className="space-y-2 pr-6">
							<Input value={item.name} onChange={(e) => { const u = [...skills]; u[index] = { ...item, name: e.target.value }; onUpdate({ skills: u }); }} placeholder="Name" className="bg-slate-700/50 border-gray-600 text-white text-sm" />
							<Input value={item.description} onChange={(e) => { const u = [...skills]; u[index] = { ...item, description: e.target.value }; onUpdate({ skills: u }); }} placeholder="Description" className="bg-slate-700/50 border-gray-600 text-white text-sm" />
							<Input value={item.trigger ?? ""} onChange={(e) => { const u = [...skills]; u[index] = { ...item, trigger: e.target.value || undefined }; onUpdate({ skills: u }); }} placeholder="Trigger (e.g., /deploy)" className="bg-slate-700/50 border-gray-600 text-white text-sm" />
						</div>
					)}
				/>
				<ArraySection
					title="MCPs"
					description="Model Context Protocols"
					items={mcps}
					isExpanded={expandedSection === "mcps"}
					onToggle={() => setExpandedSection(expandedSection === "mcps" ? null : "mcps")}
					onAdd={() => onUpdate({ mcps: [...mcps, { name: "", purpose: "" }] })}
					onRemove={(index) => onUpdate({ mcps: mcps.filter((_, i) => i !== index) })}
					renderItem={(item, index) => (
						<div className="space-y-2 pr-6">
							<Input value={item.name} onChange={(e) => { const u = [...mcps]; u[index] = { ...item, name: e.target.value }; onUpdate({ mcps: u }); }} placeholder="Name" className="bg-slate-700/50 border-gray-600 text-white text-sm" />
							<Input value={item.purpose} onChange={(e) => { const u = [...mcps]; u[index] = { ...item, purpose: e.target.value }; onUpdate({ mcps: u }); }} placeholder="Purpose" className="bg-slate-700/50 border-gray-600 text-white text-sm" />
							<Input value={item.url ?? ""} onChange={(e) => { const u = [...mcps]; u[index] = { ...item, url: e.target.value || undefined }; onUpdate({ mcps: u }); }} placeholder="URL (optional)" className="bg-slate-700/50 border-gray-600 text-white text-sm" />
						</div>
					)}
				/>
				<ArraySection
					title="Models"
					description="AI models used in your workflow"
					items={models}
					isExpanded={expandedSection === "models"}
					onToggle={() => setExpandedSection(expandedSection === "models" ? null : "models")}
					onAdd={() => onUpdate({ models: [...models, { name: "", role: "" }] })}
					onRemove={(index) => onUpdate({ models: models.filter((_, i) => i !== index) })}
					renderItem={(item, index) => (
						<div className="space-y-2 pr-6">
							<Input value={item.name} onChange={(e) => { const u = [...models]; u[index] = { ...item, name: e.target.value }; onUpdate({ models: u }); }} placeholder="Model name" className="bg-slate-700/50 border-gray-600 text-white text-sm" />
							<Input value={item.role} onChange={(e) => { const u = [...models]; u[index] = { ...item, role: e.target.value }; onUpdate({ models: u }); }} placeholder="Role" className="bg-slate-700/50 border-gray-600 text-white text-sm" />
						</div>
					)}
				/>
			</div>

			<div className="space-y-2">
				<Label className="text-gray-300">Resources</Label>
				<p className="text-xs text-gray-500">
					Add links to documentation, guides, or related resources
				</p>
				{resources.map((resource, index) => (
					<div
						key={`${resource.url}-${resource.label}`}
						className="bg-slate-700/30 rounded-md border border-gray-700 overflow-hidden"
					>
						<div className="flex items-center gap-2 p-2">
							<ExternalLink className="h-4 w-4 text-cyan-400 flex-shrink-0" />
							<a
								href={resource.url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm text-cyan-400 hover:text-cyan-300 flex-1 truncate transition-colors"
							>
								{resource.label}
							</a>

							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									setExpandedResource(expandedResource === index ? null : index)
								}
								className="text-gray-500 hover:text-gray-300 h-auto px-2 py-1 text-xs"
							>
								{expandedResource === index ? "Hide" : "Edit"}
							</Button>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => removeResource(index)}
								className="text-gray-500 hover:text-red-400 h-6 w-6"
							>
								<Trash2 className="h-3.5 w-3.5" />
							</Button>
						</div>
						{expandedResource === index && (
							<div className="px-2 pb-2 pt-0 space-y-2 border-t border-gray-700">
								<Label htmlFor={`resource-label-${index}`} className="sr-only">
									Resource label
								</Label>
								<Input
									id={`resource-label-${index}`}
									value={resource.label}
									onChange={(e) => {
										const updated = [...resources];
										updated[index] = { ...resource, label: e.target.value };
										onUpdate({ resources: updated });
									}}
									placeholder="Label (optional)"
									className="bg-slate-700/50 border-gray-600 text-white text-sm"
								/>
								<Label htmlFor={`resource-url-${index}`} className="sr-only">
									Resource URL
								</Label>
								<Input
									id={`resource-url-${index}`}
									value={resource.url}
									onChange={(e) => {
										const updated = [...resources];
										updated[index] = { ...resource, url: e.target.value };
										onUpdate({ resources: updated });
									}}
									placeholder="https://..."
									className="bg-slate-700/50 border-gray-600 text-white text-sm"
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
						className="bg-slate-700/50 border-gray-600 text-white flex-1"
					/>
					<Input
						value={newResourceLabel}
						onChange={(e) => setNewResourceLabel(e.target.value)}
						placeholder="Label (optional)"
						className="bg-slate-700/50 border-gray-600 text-white flex-1"
					/>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={addResource}
						disabled={!newResourceUrl.trim()}
						className="text-cyan-400 hover:text-cyan-300 flex-shrink-0"
					>
						<Plus className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
