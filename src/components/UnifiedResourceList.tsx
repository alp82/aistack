import { Plus } from "lucide-react";
import { useState } from "react";
import {
	ResourceBrowserDialog,
	ResourceTree,
	type ResourceTreeSelection,
} from "@/components/resources";
import type { Resource } from "@/features/stack-editor/types";
import type { ResourceBrowserTarget } from "@/components/resources/ResourceBrowser";
import { cn } from "@/lib/utils";
import type { Id } from "../../convex/_generated/dataModel";

export interface UnifiedResourceListStackItems {
	sourceId: string;
	sourceLabel: string;
	resources: Resource[];
}

export interface UnifiedResourceListInsertFileArgs {
	source: "stack";
	sourceId: string;
	stableKey: string;
	fileName: string;
	type: string;
	group: string;
}

export interface UnifiedResourceListInsertGroupArgs {
	source: "stack";
	sourceId: string;
	group: string;
	fileCount: number;
}

export interface UnifiedResourceListProps {
	stackResources?: UnifiedResourceListStackItems | null;
	mode: "edit" | "view";
	onInsertFile?: (args: UnifiedResourceListInsertFileArgs) => void;
	onInsertGroup?: (args: UnifiedResourceListInsertGroupArgs) => void;
	onAddManual?: () => void;
	className?: string;
}

export function UnifiedResourceList({
	stackResources,
	mode,
	onInsertFile,
	onInsertGroup,
	onAddManual,
	className,
}: UnifiedResourceListProps) {
	const [viewerOpen, setViewerOpen] = useState(false);
	const [viewerTarget, setViewerTarget] =
		useState<ResourceBrowserTarget | null>(null);
	const [viewerInitial, setViewerInitial] = useState<
		{ stableKey: string; fileName: string } | undefined
	>(undefined);

	const handleSelect = (selection: ResourceTreeSelection) => {
		const target: ResourceBrowserTarget = {
			kind: "stack" as const,
			id: selection.sourceId as Id<"stacks">,
		};
		setViewerTarget(target);
		setViewerInitial({
			stableKey: selection.stableKey,
			fileName: selection.fileName,
		});
		setViewerOpen(true);
	};

	return (
		<div className={cn("space-y-3", className)}>
			{stackResources && stackResources.resources.length > 0 && (
				<ResourceTree
					stack={stackResources}
					onSelect={handleSelect}
					onInsertFile={mode === "edit" ? onInsertFile : undefined}
					onInsertGroup={mode === "edit" ? onInsertGroup : undefined}
				/>
			)}
			{mode === "edit" && onAddManual && (
				<button
					type="button"
					onClick={onAddManual}
					className="flex w-full items-center justify-center gap-2 border border-dashed border-stroke-subtle bg-transparent px-3 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime cursor-pointer"
				>
					<Plus className="size-3" />
					Add Resource
				</button>
			)}
			{viewerOpen && viewerTarget && (
				<ResourceBrowserDialog
					open={viewerOpen}
					onClose={() => setViewerOpen(false)}
					target={viewerTarget}
					initialSelection={viewerInitial}
				/>
			)}
		</div>
	);
}
