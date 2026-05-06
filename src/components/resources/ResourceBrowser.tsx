import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { cn } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ConfirmSwitchDialog } from "./ConfirmSwitchDialog";
import { ResourceTree, type ResourceTreeSelection } from "./ResourceTree";
import { ResourceViewer, type ResourceViewerFile } from "./ResourceViewer";

export type ResourceBrowserTarget =
	| { kind: "stack"; id: Id<"stacks"> }
	| { kind: "project"; id: Id<"projects"> };

export interface ResourceBrowserInitialSelection {
	stableKey: string;
	fileName: string;
}

export interface ResourceBrowserProps {
	target: ResourceBrowserTarget;
	initialSelection?: ResourceBrowserInitialSelection;
	groupFilter?: string;
	className?: string;
}

// Sentinel for "user wants to close the dialog (no new selection)"
const PENDING_CLOSE: ResourceTreeSelection | null = null;

export function ResourceBrowser({
	target,
	initialSelection,
	groupFilter,
	className,
}: ResourceBrowserProps) {
	const context = useQuery(api.resources.getResourceBrowserContext, {
		target,
	});
	const updateContent = useMutation(api.resources.updateResourceContent);

	const [selection, setSelection] = useState<ResourceTreeSelection | null>(
		null,
	);
	const [draftContent, setDraftContent] = useState<string>("");
	const [dirty, setDirty] = useState(false);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Pending selection captured while a dirty draft is in-flight. `undefined`
	// means "no pending switch"; `null` means "user is trying to close the
	// dialog"; otherwise the user is trying to switch to a new file.
	const [pendingSelection, setPendingSelection] = useState<
		ResourceTreeSelection | null | undefined
	>(undefined);

	const isDesktop = useMediaQuery("(min-width: 1024px)");

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
		const inStack = context.stackResources.some(
			(i) =>
				i.stableKey === initialSelection.stableKey &&
				i.files.some((f) => f.name === initialSelection.fileName),
		);
		const inProject = context.projectResources.some(
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

	const selectedFile: ResourceViewerFile | null = useMemo(() => {
		if (!context || !selection) return null;
		const list =
			selection.source === "stack"
				? context.stackResources
				: context.projectResources;
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

	// Selection request handler: intercepts when dirty, otherwise switches.
	const handleSelectRequest = (next: ResourceTreeSelection) => {
		if (
			dirty &&
			selection &&
			(next.stableKey !== selection.stableKey ||
				next.fileName !== selection.fileName)
		) {
			setPendingSelection(next);
			return;
		}
		setSelection(next);
	};

	// Close request handler (mobile dialog X). When dirty, intercept first.
	const handleCloseRequest = () => {
		if (dirty && selection) {
			setPendingSelection(PENDING_CLOSE);
			return;
		}
		setSelection(null);
	};

	const applyPending = () => {
		if (pendingSelection !== undefined) {
			setSelection(pendingSelection);
		}
		setPendingSelection(undefined);
	};

	const handleConfirmSave = async () => {
		await handleSave();
		applyPending();
	};

	const handleConfirmDiscard = () => {
		applyPending();
	};

	const handleConfirmCancel = () => {
		setPendingSelection(undefined);
	};

	const isEditable = context?.isEditable ?? false;

	const stackSourceId = target.kind === "stack" ? target.id : "";
	const projectSourceId = target.kind === "project" ? target.id : "";

	const isLoading = context === undefined;
	const viewerFile: ResourceViewerFile | null = selectedFile
		? { ...selectedFile, content: draftContent }
		: null;

	// Hoisted tree node — rendered once and reused across the desktop/mobile
	// branches so a viewport flip doesn't unmount the ResourceTree (preserving
	// expand/collapse state).
	const tree = (
		<ResourceTree
			stack={
				context && context.stackResources.length > 0
					? {
							sourceId: stackSourceId,
							sourceLabel: context.stackName,
							resources: context.stackResources,
						}
					: null
			}
			project={
				context && context.projectResources.length > 0
					? {
							sourceId: projectSourceId,
							sourceLabel: context.projectName ?? "",
							resources: context.projectResources,
						}
					: null
			}
			selected={selection}
			onSelect={handleSelectRequest}
			groupFilter={groupFilter}
			isLoading={isLoading}
		/>
	);

	const viewerLoadingFallback = (
		<div className="flex min-h-[20rem] items-center justify-center border border-stroke-subtle bg-bg-panel-muted/40">
			<div className="space-y-2 p-4 w-full max-w-xs">
				<div className="h-3 w-3/4 animate-pulse bg-fg-muted/15" />
				<div className="h-3 w-1/2 animate-pulse bg-fg-muted/10" />
			</div>
		</div>
	);

	const confirmDialog = (
		<ConfirmSwitchDialog
			open={pendingSelection !== undefined}
			onClose={handleConfirmCancel}
			onSave={handleConfirmSave}
			onDiscard={handleConfirmDiscard}
			saving={saving}
			fileName={selection?.fileName ?? ""}
		/>
	);

	// Inline viewer (desktop): rendered next to the tree in a CSS grid.
	const inlineViewer = isLoading ? (
		viewerLoadingFallback
	) : (
		<ResourceViewer
			file={viewerFile}
			editable={isEditable}
			onContentChange={handleContentChange}
			onSave={handleSave}
			saving={saving}
			saved={saved}
			dirty={dirty}
			error={error}
		/>
	);

	// Dialog viewer (mobile): wrapped in a motion.div so AnimatePresence can run
	// the slide-up/down transition on mount/unmount. The Dialog inside is not a
	// motion component itself, so the wrapper is what actually animates.
	const dialogViewer =
		selection && !isLoading ? (
			<motion.div
				key="viewer-dialog"
				initial={{ y: "100%", opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				exit={{ y: "100%", opacity: 0 }}
				transition={{ duration: 0.25, ease: "easeInOut" }}
				className="lg:hidden"
			>
				<ResourceViewer
					mode="dialog"
					open
					onClose={handleCloseRequest}
					file={viewerFile}
					editable={isEditable}
					onContentChange={handleContentChange}
					onSave={handleSave}
					saving={saving}
					saved={saved}
					dirty={dirty}
					error={error}
				/>
			</motion.div>
		) : null;

	return (
		<>
			{isDesktop ? (
				<div
					className={cn(
						"grid grid-cols-[minmax(18rem,22rem)_1fr] gap-4",
						className,
					)}
				>
					<div className="overflow-y-auto">{tree}</div>
					<div className="min-w-0">{inlineViewer}</div>
				</div>
			) : (
				<div className={cn("space-y-4", className)}>
					<div className="overflow-y-auto">{tree}</div>
					{/* No `initial={false}`: the user tapping a resource triggers the
					    enter animation, which is the planned mobile UX. Exit fires on
					    close and on selection-clear. */}
					<AnimatePresence>{dialogViewer}</AnimatePresence>
				</div>
			)}
			{confirmDialog}
		</>
	);
}
