import { MetadataEditor } from "@/components/MetadataEditor";
import { SectionCard } from "@/components/system/SectionCard";
import type { EditorSectionStatus } from "@/features/stack-editor/editor-status";
import { SectionStatusBadge } from "@/features/stack-editor/sections/SectionStatusBadge";
import type { StackMetadataUpdates, StackResource } from "@/features/stack-editor/types";

type SettingsSectionProps = {
	stackUrl?: string;
	prompts?: boolean;
	rules?: boolean;
	skills?: boolean;
	mcps?: boolean;
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
				resources={resources}
				onUpdate={onUpdate}
			/>
		</SectionCard>
	);
}

export type { SettingsSectionProps };
