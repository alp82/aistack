import { SectionCard } from "@/components/system/SectionCard";
import type { EditorSectionStatus } from "@/features/stack-editor/editor-status";
import { SectionStatusBadge } from "@/features/stack-editor/sections/SectionStatusBadge";
import { Textarea } from "@/components/ui/textarea";

type DescriptionSectionProps = {
	value: string;
	onChange: (value: string) => void;
	status: EditorSectionStatus;
	isActive: boolean;
};

export function DescriptionSection({
	value,
	onChange,
	status,
	isActive,
}: DescriptionSectionProps) {
	return (
		<SectionCard
			id="section-description"
			title="Readme / Description"
			actions={<SectionStatusBadge status={status} isActive={isActive} />}
			className="bg-slate-800/30 border-gray-700/50 p-6"
		>
			<Textarea
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder="## This is my stack\n\nVery **good**."
				className="bg-slate-700/50 border-gray-600 text-white min-h-64 font-mono text-sm"
			/>
			<p className="text-xs text-gray-500 mt-2">Markdown supported</p>
		</SectionCard>
	);
}

export type { DescriptionSectionProps };
