import { useState } from "react";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";

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

	const flags = { prompts, rules, skills, mcps };

	const addResource = () => {
		if (!newResourceLabel.trim() || !newResourceUrl.trim()) return;
		onUpdate({
			resources: [
				...resources,
				{ label: newResourceLabel.trim(), url: newResourceUrl.trim() },
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
				<Label className="text-gray-300">Repository / Stack URL</Label>
				<Input
					value={stackUrl ?? ""}
					onChange={(e) => onUpdate({ stackUrl: e.target.value || undefined })}
					placeholder="https://github.com/..."
					className="bg-slate-700/50 border-gray-600 text-white"
				/>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
				{metaFlags.map((flag) => (
					<div
						key={flag.key}
						className="flex items-center justify-between bg-slate-700/30 rounded-md px-3 py-2 border border-gray-700"
					>
						<Label className="text-sm text-gray-300">{flag.label}</Label>
						<Switch
							checked={flags[flag.key] ?? false}
							onCheckedChange={(checked) =>
								onUpdate({ [flag.key]: checked })
							}
						/>
					</div>
				))}
			</div>

			<div className="space-y-2">
				<Label className="text-gray-300">Resources</Label>
				{resources.map((resource, index) => (
					<div key={index} className="flex items-center gap-2">
						<ExternalLink className="h-4 w-4 text-gray-500 flex-shrink-0" />
						<span className="text-sm text-cyan-400 flex-1 truncate">
							{resource.label}
						</span>
						<span className="text-xs text-gray-500 truncate max-w-48">
							{resource.url}
						</span>
						<button
							type="button"
							onClick={() => removeResource(index)}
							className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</button>
					</div>
				))}
				<div className="flex gap-2">
					<Input
						value={newResourceLabel}
						onChange={(e) => setNewResourceLabel(e.target.value)}
						placeholder="Label"
						className="bg-slate-700/50 border-gray-600 text-white flex-1"
					/>
					<Input
						value={newResourceUrl}
						onChange={(e) => setNewResourceUrl(e.target.value)}
						placeholder="https://..."
						className="bg-slate-700/50 border-gray-600 text-white flex-1"
					/>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={addResource}
						disabled={!newResourceLabel.trim() || !newResourceUrl.trim()}
						className="text-cyan-400 hover:text-cyan-300 flex-shrink-0"
					>
						<Plus className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
