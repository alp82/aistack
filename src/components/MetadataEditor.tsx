import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { isValidHttpUrl } from "@/features/stack-editor/editor-status";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

interface Resource {
	label: string;
	url: string;
}

interface MetadataEditorProps {
	stackUrl?: string;
	prompts?: boolean;
	rules?: boolean;
	skills?: boolean;
	mcps?: boolean;
	resources: Resource[];
	onUpdate: (updates: {
		stackUrl?: string;
		prompts?: boolean;
		rules?: boolean;
		skills?: boolean;
		mcps?: boolean;
		resources?: Resource[];
	}) => void;
}

const metaFlags = [
	{ key: "prompts" as const, label: "Prompts" },
	{ key: "rules" as const, label: "Rules" },
	{ key: "skills" as const, label: "Skills" },
	{ key: "mcps" as const, label: "MCPs" },
] as const;

export function MetadataEditor({
	stackUrl,
	prompts,
	rules,
	skills,
	mcps,
	resources,
	onUpdate,
}: MetadataEditorProps) {
	const [newResourceLabel, setNewResourceLabel] = useState("");
	const [newResourceUrl, setNewResourceUrl] = useState("");
	const stackUrlInputId = useId();
	const stackUrlErrorId = `${stackUrlInputId}-error`;

	const flags = { prompts, rules, skills, mcps };

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

			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				{metaFlags.map((flag) => {
					const isEnabled = flags[flag.key] ?? false;
					return (
						<Button
							key={flag.key}
							variant="ghost"
							onClick={() => onUpdate({ [flag.key]: !isEnabled })}
							className={`w-full h-auto justify-between rounded-md px-3 py-2 border transition-all cursor-pointer ${
								isEnabled
									? "bg-cyan-500/20 border-cyan-500/50 hover:bg-cyan-500/30"
									: "bg-slate-700/30 border-gray-700 hover:bg-slate-700/50"
							}`}
						>
							<Label
								className={`text-sm cursor-pointer ${
									isEnabled ? "text-cyan-300 font-medium" : "text-gray-300"
								}`}
							>
								{flag.label}
							</Label>
							<Switch
								checked={isEnabled}
								onCheckedChange={(checked) => onUpdate({ [flag.key]: checked })}
							/>
						</Button>
					);
				})}
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
