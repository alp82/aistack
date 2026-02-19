import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { EditorSectionStatus } from "@/features/stack-editor/editor-status";

type SectionStatusBadgeProps = {
	status: EditorSectionStatus;
	isActive: boolean;
};

function SectionStatusBadge({ status, isActive }: SectionStatusBadgeProps) {
	if (isActive) {
		return (
			<span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-xs font-medium text-cyan-300">
				Active
			</span>
		);
	}

	if (status.state === "error") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-300">
				<AlertCircle className="h-3 w-3" aria-hidden="true" />
				Needs attention
			</span>
		);
	}

	if (status.state === "complete") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
				<CheckCircle2 className="h-3 w-3" aria-hidden="true" />
				Complete
			</span>
		);
	}

	return (
		<span className="inline-flex items-center rounded-full border border-gray-600 bg-slate-700/40 px-2 py-0.5 text-xs font-medium text-gray-300">
			Pending
		</span>
	);
}

export { SectionStatusBadge };
export type { SectionStatusBadgeProps };
