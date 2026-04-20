import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
	InstructionTree,
	type InstructionTreeSelection,
} from "./InstructionTree";
import {
	InstructionViewer,
	type InstructionViewerFile,
} from "./InstructionViewer";

export type InstructionBrowserTarget =
	| { kind: "stack"; id: Id<"stacks"> }
	| { kind: "project"; id: Id<"projects"> };

export interface InstructionBrowserInitialSelection {
	stableKey: string;
	fileName: string;
}

export interface InstructionBrowserProps {
	target: InstructionBrowserTarget;
	initialSelection?: InstructionBrowserInitialSelection;
	groupFilter?: string;
	className?: string;
}

export function InstructionBrowser({
	target,
	initialSelection,
	groupFilter,
	className,
}: InstructionBrowserProps) {
	const context = useQuery(api.instructions.getInstructionBrowserContext, {
		target,
	});
	const updateContent = useMutation(api.instructions.updateInstructionContent);

	const [selection, setSelection] = useState<InstructionTreeSelection | null>(
		null,
	);
	const [draftContent, setDraftContent] = useState<string>("");
	const [dirty, setDirty] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const hasAppliedInitialRef = useRef(false);
	// Holds the file content at selection time. Dirty-checking compares against
	// this ref instead of live selectedFile.content to prevent server pushes from
	// flipping dirty=false mid-edit.
	const selectedContentAtSelectionRef = useRef<string>("");

	useEffect(() => {
		if (!context) return;
		if (hasAppliedInitialRef.current) return;
		if (!initialSelection) {
			hasAppliedInitialRef.current = true;
			return;
		}
		// Try to locate the initialSelection in whichever source it belongs to.
		const inStack = context.stackInstructions.some(
			(i) =>
				i.stableKey === initialSelection.stableKey &&
				i.files.some((f) => f.name === initialSelection.fileName),
		);
		const inProject = context.projectInstructions.some(
			(i) =>
				i.stableKey === initialSelection.stableKey &&
				i.files.some((f) => f.name === initialSelection.fileName),
		);
		if (inStack) {
			setSelection({
				source: "stack",
				sourceId: target.kind === "stack" ? target.id : (context.stackId ?? ""),
				stableKey: initialSelection.stableKey,
				fileName: initialSelection.fileName,
			});
		} else if (inProject) {
			setSelection({
				source: "project",
				sourceId: target.kind === "project" ? target.id : "",
				stableKey: initialSelection.stableKey,
				fileName: initialSelection.fileName,
			});
		}
		hasAppliedInitialRef.current = true;
	}, [context, initialSelection, target]);

	const selectedFile: InstructionViewerFile | null = useMemo(() => {
		if (!context || !selection) return null;
		const list =
			selection.source === "stack"
				? context.stackInstructions
				: context.projectInstructions;
		const item = list.find((i) => i.stableKey === selection.stableKey);
		const file = item?.files.find((f) => f.name === selection.fileName);
		if (!file) return null;
		return {
			name: file.name,
			content: file.content,
			path: file.path,
		};
	}, [context, selection]);

	// When a new file is selected, reset draft/dirty state. We intentionally
	// exclude selectedFile.content from deps so that live updates to the source
	// (e.g., a save from a collaborator) don't wipe in-progress local edits.
	const selectionKey = selection
		? `${selection.source}:${selection.sourceId}:${selection.stableKey}:${selection.fileName}`
		: null;
	// biome-ignore lint/correctness/useExhaustiveDependencies: open-gate reset
	useEffect(() => {
		if (selectedFile) {
			selectedContentAtSelectionRef.current = selectedFile.content;
			setDraftContent(selectedFile.content);
			setDirty(false);
			setSaved(false);
			setError(null);
		} else {
			selectedContentAtSelectionRef.current = "";
			setDraftContent("");
			setDirty(false);
		}
	}, [selectionKey]);

	const handleContentChange = (content: string) => {
		setDraftContent(content);
		setDirty(content !== selectedContentAtSelectionRef.current);
		setSaved(false);
		setError(null);
	};

	const handleSave = async () => {
		if (!selection || !selectedFile) return;
		setSaving(true);
		setError(null);
		try {
			await updateContent({
				target:
					selection.source === "stack"
						? { kind: "stack", id: selection.sourceId as Id<"stacks"> }
						: { kind: "project", id: selection.sourceId as Id<"projects"> },
				stableKey: selection.stableKey,
				fileName: selection.fileName,
				content: draftContent,
			});
			setSaved(true);
			setDirty(false);
			setTimeout(() => setSaved(false), 2000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save file");
		} finally {
			setSaving(false);
		}
	};

	const isEditable = context?.isEditable ?? false;

	const stackSourceId = target.kind === "stack" ? target.id : "";
	const projectSourceId = target.kind === "project" ? target.id : "";

	const isLoading = context === undefined;
	const viewerFile: InstructionViewerFile | null = selectedFile
		? { ...selectedFile, content: draftContent }
		: null;

	return (
		<div
			className={cn(
				"grid grid-cols-[minmax(18rem,22rem)_1fr] gap-4",
				className,
			)}
		>
			<div className="overflow-y-auto">
				<InstructionTree
					stack={
						context && context.stackInstructions.length > 0
							? {
									sourceId: stackSourceId,
									sourceLabel: context.stackName,
									instructions: context.stackInstructions,
								}
							: null
					}
					project={
						context && context.projectInstructions.length > 0
							? {
									sourceId: projectSourceId,
									sourceLabel: context.projectName ?? "",
									instructions: context.projectInstructions,
								}
							: null
					}
					selected={selection}
					onSelect={setSelection}
					groupFilter={groupFilter}
					isLoading={isLoading}
				/>
			</div>
			<div className="min-w-0">
				{isLoading ? (
					<div className="flex min-h-[20rem] items-center justify-center border border-stroke-subtle bg-bg-panel-muted/40">
						<div className="space-y-2 p-4 w-full max-w-xs">
							<div className="h-3 w-3/4 animate-pulse bg-fg-muted/15" />
							<div className="h-3 w-1/2 animate-pulse bg-fg-muted/10" />
						</div>
					</div>
				) : (
					<InstructionViewer
						file={viewerFile}
						editable={isEditable}
						onContentChange={handleContentChange}
						onSave={handleSave}
						saving={saving}
						saved={saved}
						dirty={dirty}
						error={error}
					/>
				)}
			</div>
		</div>
	);
}
