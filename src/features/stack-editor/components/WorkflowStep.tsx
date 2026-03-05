import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "../../../../convex/_generated/api";
import { TiptapEditor } from "@/components/TiptapEditor";

type WorkflowStepProps = {
	description: string;
	onDescriptionChange: (value: string) => void;
	onToolAdded?: (tool: { _id: string; name: string; iconUrl?: string | null }) => void;
	onModelAdded?: (model: { _id: string; name: string; provider: string; iconUrl?: string | null }) => void;
};

function WorkflowStep({
	description,
	onDescriptionChange,
	onToolAdded,
	onModelAdded,
}: WorkflowStepProps) {
	const allTools = useQuery(api.tools.listAll) ?? [];
	const allModels = useQuery(api.models.listAll) ?? [];
	const toolsForEditor = useMemo(
		() => allTools.map((t) => ({ _id: t._id, name: t.name, aliases: t.aliases, iconUrl: t.iconUrl })),
		[allTools]
	);
	const modelsForEditor = useMemo(
		() => allModels.map((m) => ({ _id: m._id, name: m.name, aliases: m.aliases, provider: m.provider, iconUrl: m.iconUrl })),
		[allModels]
	);

	return (
		<div className="space-y-8">
			<div>
				<p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-accent-lime">
					// STEP 02: WORKFLOW
				</p>
			</div>

			<div className="space-y-8">
				{/* Description with Tiptap Editor */}
				<div>
					<label className="mb-2 block font-mono text-xs uppercase tracking-wider text-fg-muted">
						Description
					</label>
					<TiptapEditor
						content={description}
						onChange={onDescriptionChange}
						tools={toolsForEditor}
						onToolAdded={onToolAdded}
						models={modelsForEditor}
						onModelAdded={onModelAdded}
					/>
					<p className="mt-2 font-mono text-[10px] text-fg-muted">
						Describe your stack in detail. Use the toolbar for formatting.
					</p>
				</div>
			</div>
		</div>
	);
}

export { WorkflowStep };
export type { WorkflowStepProps };
