import { SectionCard } from "@/components/system/SectionCard";
import {
	ToolPicker,
	type ToolSubscriptionEntry,
} from "@/components/ToolPicker";
import type { EditorSectionStatus } from "@/features/stack-editor/editor-status";
import { SectionStatusBadge } from "@/features/stack-editor/sections/SectionStatusBadge";

type ToolsSectionProps = {
	value: ToolSubscriptionEntry[];
	onChange: (tools: ToolSubscriptionEntry[]) => void;
	status: EditorSectionStatus;
	isActive: boolean;
};

export function ToolsSection({
	value,
	onChange,
	status,
	isActive,
}: ToolsSectionProps) {
	return (
		<SectionCard
			id="section-tools"
			title="Tools"
			actions={<SectionStatusBadge status={status} isActive={isActive} />}
			className="bg-slate-800/30 border-gray-700/50 p-6"
		>
			<ToolPicker value={value} onChange={onChange} />
		</SectionCard>
	);
}

export type { ToolsSectionProps };
