import { MetadataEditor } from "@/components/MetadataEditor";
import { SectionCard } from "@/components/system/SectionCard";
import type { EditorSectionStatus } from "@/features/stack-editor/editor-status";
import { SectionStatusBadge } from "@/features/stack-editor/sections/SectionStatusBadge";
import type { McpItem, ModelItem, PromptItem, RuleItem, SkillItem, StackMetadataUpdates, StackResource } from "@/features/stack-editor/types";

type SettingsSectionProps = {
	stackUrl?: string;
	prompts: PromptItem[];
	rules: RuleItem[];
	skills: SkillItem[];
	mcps: McpItem[];
	models: ModelItem[];
	resources: StackResource[];
	onUpdate: (updates: StackMetadataUpdates) => void;
	status: EditorSectionStatus;
	isActive: boolean;
};

export function SettingsSection({
	stackUrl,
	prompts,
	rules,
	skills,
	mcps,
	models,
	resources,
	onUpdate,
	status,
	isActive,
}: SettingsSectionProps) {
	return (
		<SectionCard
			id="section-settings"
			title="Settings"
			actions={<SectionStatusBadge status={status} isActive={isActive} />}
			className="bg-slate-800/30 border-gray-700/50 p-6"
		>
			<MetadataEditor
				stackUrl={stackUrl}
				prompts={prompts}
				rules={rules}
				skills={skills}
				mcps={mcps}
				models={models}
				resources={resources}
				onUpdate={onUpdate}
			/>
		</SectionCard>
	);
}

export type { SettingsSectionProps };
