import { Plus } from "lucide-react";
import { useState } from "react";
import {
	InstructionBrowserDialog,
	type InstructionSource,
	InstructionTree,
	type InstructionTreeSelection,
} from "@/components/instructions";
import type { InstructionItem as InstructionItemType } from "@/features/stack-editor/types";
import { sourceToTarget } from "@/lib/instruction-utils";
import { cn } from "@/lib/utils";

export interface UnifiedFileListStackItems {
	sourceId: string;
	sourceLabel: string;
	instructions: InstructionItemType[];
}

export interface UnifiedFileListProjectGroup {
	sourceId: string;
	sourceLabel: string;
	instructions: InstructionItemType[];
}

export interface UnifiedFileListInsertFileArgs {
	source: InstructionSource;
	sourceId: string;
	stableKey: string;
	fileName: string;
	type: string;
	group: string;
}

export interface UnifiedFileListInsertGroupArgs {
	source: InstructionSource;
	sourceId: string;
	group: string;
	fileCount: number;
}

export interface UnifiedFileListProps {
	stackInstructions?: UnifiedFileListStackItems | null;
	projectInstructions?: UnifiedFileListProjectGroup[];
	mode: "edit" | "view";
	onInsertFile?: (args: UnifiedFileListInsertFileArgs) => void;
	onInsertGroup?: (args: UnifiedFileListInsertGroupArgs) => void;
	onAddManual?: () => void;
	className?: string;
}

export function UnifiedFileList({
	stackInstructions,
	projectInstructions,
	mode,
	onInsertFile,
	onInsertGroup,
	onAddManual,
	className,
}: UnifiedFileListProps) {
	const [viewerOpen, setViewerOpen] = useState(false);
	const [viewerTarget, setViewerTarget] = useState<ReturnType<
		typeof sourceToTarget
	> | null>(null);
	const [viewerInitial, setViewerInitial] = useState<
		{ stableKey: string; fileName: string } | undefined
	>(undefined);

	const handleSelect = (selection: InstructionTreeSelection) => {
		const target = sourceToTarget(selection.source, selection.sourceId);
		setViewerTarget(target);
		setViewerInitial({
			stableKey: selection.stableKey,
			fileName: selection.fileName,
		});
		setViewerOpen(true);
	};

	const projectGroups = projectInstructions ?? [];

	return (
		<div className={cn("space-y-3", className)}>
			{stackInstructions && stackInstructions.instructions.length > 0 && (
				<InstructionTree
					stack={stackInstructions}
					onSelect={handleSelect}
					onInsertFile={mode === "edit" ? onInsertFile : undefined}
					onInsertGroup={mode === "edit" ? onInsertGroup : undefined}
				/>
			)}
			{projectGroups.map((project) => (
				<InstructionTree
					key={project.sourceId}
					project={project}
					onSelect={handleSelect}
					onInsertFile={mode === "edit" ? onInsertFile : undefined}
					onInsertGroup={mode === "edit" ? onInsertGroup : undefined}
				/>
			))}
			{mode === "edit" && onAddManual && (
				<button
					type="button"
					onClick={onAddManual}
					className="flex w-full items-center justify-center gap-2 border border-dashed border-stroke-subtle bg-transparent px-3 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime cursor-pointer"
				>
					<Plus className="size-3" />
					Add Instruction
				</button>
			)}
			{viewerOpen && viewerTarget && (
				<InstructionBrowserDialog
					open={viewerOpen}
					onClose={() => setViewerOpen(false)}
					target={viewerTarget}
					initialSelection={viewerInitial}
				/>
			)}
		</div>
	);
}
