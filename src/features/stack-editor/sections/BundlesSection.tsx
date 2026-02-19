import { BundlePicker, type BundleSubscriptionEntry } from "@/components/BundlePicker";
import { SectionCard } from "@/components/system/SectionCard";
import type { EditorSectionStatus } from "@/features/stack-editor/editor-status";
import { SectionStatusBadge } from "@/features/stack-editor/sections/SectionStatusBadge";

type BundlesSectionProps = {
	value: BundleSubscriptionEntry[];
	onChange: (bundles: BundleSubscriptionEntry[]) => void;
	status: EditorSectionStatus;
	isActive: boolean;
};

export function BundlesSection({ value, onChange, status, isActive }: BundlesSectionProps) {
	return (
		<SectionCard
			id="section-bundles"
			title="Bundles"
			actions={<SectionStatusBadge status={status} isActive={isActive} />}
			className="bg-slate-800/30 border-gray-700/50 p-6"
		>
			<BundlePicker value={value} onChange={onChange} />
		</SectionCard>
	);
}

export type { BundlesSectionProps };
