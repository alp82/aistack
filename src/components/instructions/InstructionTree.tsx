import { ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { InstructionItem as InstructionItemType } from "@/features/stack-editor/types";
import {
	getGroupLabel,
	getInstructionTypeColors,
	getInstructionTypeIcon,
	getInstructionTypeLabel,
} from "@/lib/instruction-utils";
import { cn } from "@/lib/utils";

export type InstructionSource = "stack" | "project";

export interface InstructionTreeSelection {
	source: InstructionSource;
	sourceId: string;
	stableKey: string;
	fileName: string;
}

export interface InstructionTreeSourceItems {
	sourceId: string;
	sourceLabel: string;
	instructions: InstructionItemType[];
}

export interface InstructionTreeProps {
	stack?: InstructionTreeSourceItems | null;
	project?: InstructionTreeSourceItems | null;
	selected?: InstructionTreeSelection | null;
	onSelect?: (selection: InstructionTreeSelection) => void;
	groupFilter?: string;
	isLoading?: boolean;
	onInsertFile?: (args: {
		source: InstructionSource;
		sourceId: string;
		stableKey: string;
		fileName: string;
		type: string;
		group: string;
	}) => void;
	onInsertGroup?: (args: {
		source: InstructionSource;
		sourceId: string;
		group: string;
		fileCount: number;
	}) => void;
	className?: string;
}

interface TypeGroup {
	type: string;
	items: InstructionItemType[];
	totalFiles: number;
}

interface GroupSection {
	group: string;
	typeGroups: TypeGroup[];
	singletons: TypeGroup[];
	totalFiles: number;
}

function groupByGroupAndType(
	instructions: InstructionItemType[],
): GroupSection[] {
	const groupMap = new Map<string, InstructionItemType[]>();
	for (const item of instructions) {
		const existing = groupMap.get(item.group) ?? [];
		existing.push(item);
		groupMap.set(item.group, existing);
	}

	return Array.from(groupMap.entries()).map(([group, items]) => {
		const typeMap = new Map<string, InstructionItemType[]>();
		for (const item of items) {
			const existing = typeMap.get(item.type) ?? [];
			existing.push(item);
			typeMap.set(item.type, existing);
		}
		const allTypeGroups = Array.from(typeMap.entries()).map(
			([type, typeItems]) => ({
				type,
				items: typeItems,
				totalFiles: typeItems.reduce((sum, i) => sum + i.files.length, 0),
			}),
		);
		const totalFiles = allTypeGroups.reduce((sum, t) => sum + t.totalFiles, 0);
		return {
			group,
			typeGroups: allTypeGroups.filter(
				(g) => g.items.length > 1 || g.totalFiles > 1,
			),
			singletons: allTypeGroups.filter(
				(g) => g.items.length === 1 && g.totalFiles === 1,
			),
			totalFiles,
		};
	});
}

export function InstructionTree({
	stack,
	project,
	selected,
	onSelect,
	groupFilter,
	isLoading,
	onInsertFile,
	onInsertGroup,
	className,
}: InstructionTreeProps) {
	const sections = useMemo(() => {
		const result: Array<{
			source: InstructionSource;
			sourceId: string;
			sourceLabel: string;
			groups: GroupSection[];
		}> = [];
		if (stack && stack.instructions.length > 0) {
			let groups = groupByGroupAndType(stack.instructions);
			if (groupFilter) {
				groups = groups.filter((g) => g.group === groupFilter);
			}
			if (groups.length > 0) {
				result.push({
					source: "stack",
					sourceId: stack.sourceId,
					sourceLabel: stack.sourceLabel,
					groups,
				});
			}
		}
		if (project && project.instructions.length > 0) {
			let groups = groupByGroupAndType(project.instructions);
			if (groupFilter) {
				groups = groups.filter((g) => g.group === groupFilter);
			}
			if (groups.length > 0) {
				result.push({
					source: "project",
					sourceId: project.sourceId,
					sourceLabel: project.sourceLabel,
					groups,
				});
			}
		}
		return result;
	}, [stack, project, groupFilter]);

	if (isLoading) {
		return (
			<div
				className={cn(
					"space-y-2 border border-stroke-subtle bg-bg-panel-muted/40 p-4",
					className,
				)}
			>
				<div className="h-3 w-2/3 animate-pulse bg-fg-muted/15" />
				<div className="h-3 w-1/2 animate-pulse bg-fg-muted/10" />
				<div className="h-3 w-3/4 animate-pulse bg-fg-muted/10" />
			</div>
		);
	}

	if (sections.length === 0) {
		return (
			<div
				className={cn(
					"border border-stroke-subtle bg-bg-panel-muted/40 p-4",
					className,
				)}
			>
				<p className="font-mono text-xs text-fg-muted">
					No instruction files available.
				</p>
			</div>
		);
	}

	return (
		<div role="tree" className={cn("space-y-4", className)}>
			{sections.map((section) => {
				// Single-group sections skip the redundant group wrapper and render
				// types + singletons directly. Multi-group sections keep the wrapper
				// so users can distinguish groups (e.g., Claude Code vs. manual items).
				const flatten = section.groups.length === 1;
				return (
					<div key={`${section.source}:${section.sourceId}`}>
						<div className="mb-2 flex items-center justify-between">
							<span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent-lime">
								{section.source === "stack" ? "Stack" : "Project"}
							</span>
							<span className="font-mono text-[10px] text-fg-muted">
								{section.sourceLabel}
							</span>
						</div>
						<div className="space-y-2">
							{flatten
								? (() => {
										const gs = section.groups[0];
										return (
											<div role="group" className="border border-stroke-subtle">
												{gs.typeGroups.map((group) => (
													<TypeBlock
														key={group.type}
														typeGroup={group}
														source={section.source}
														sourceId={section.sourceId}
														selected={selected}
														onSelect={onSelect}
														onInsertFile={onInsertFile}
													/>
												))}
												{gs.singletons.map((group) => {
													const item = group.items[0];
													const file = item.files[0];
													if (!file) return null;
													return (
														<FileRow
															key={`${item.stableKey}:${file.name}`}
															source={section.source}
															sourceId={section.sourceId}
															stableKey={item.stableKey}
															fileName={file.name}
															type={item.type}
															group={item.group}
															selected={selected}
															onSelect={onSelect}
															onInsertFile={onInsertFile}
														/>
													);
												})}
											</div>
										);
									})()
								: section.groups.map((gs) => (
										<GroupBlock
											key={gs.group}
											section={gs}
											source={section.source}
											sourceId={section.sourceId}
											selected={selected}
											onSelect={onSelect}
											onInsertFile={onInsertFile}
											onInsertGroup={onInsertGroup}
										/>
									))}
						</div>
					</div>
				);
			})}
		</div>
	);
}

function GroupBlock({
	section,
	source,
	sourceId,
	selected,
	onSelect,
	onInsertFile,
	onInsertGroup,
}: {
	section: GroupSection;
	source: InstructionSource;
	sourceId: string;
	selected?: InstructionTreeSelection | null;
	onSelect?: (selection: InstructionTreeSelection) => void;
	onInsertFile?: InstructionTreeProps["onInsertFile"];
	onInsertGroup?: InstructionTreeProps["onInsertGroup"];
}) {
	const [expanded, setExpanded] = useState(true);

	return (
		<div className="border border-stroke-subtle">
			<div className="flex items-stretch bg-bg-panel-muted">
				<button
					type="button"
					role="treeitem"
					aria-expanded={expanded}
					onClick={() => setExpanded(!expanded)}
					className="flex flex-1 items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-bg-panel cursor-pointer"
				>
					<ChevronRight
						className={cn(
							"size-3 text-fg-muted transition-transform",
							expanded && "rotate-90",
						)}
					/>
					<span className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-fg-primary">
						{getGroupLabel(section.group)}
					</span>
					<span className="ml-auto font-mono text-[10px] text-fg-muted">
						{section.totalFiles} {section.totalFiles === 1 ? "file" : "files"}
					</span>
				</button>
				{onInsertGroup && (
					<button
						type="button"
						aria-label={`Insert ${getGroupLabel(section.group)} group`}
						onClick={() =>
							onInsertGroup({
								source,
								sourceId,
								group: section.group,
								fileCount: section.totalFiles,
							})
						}
						title={`Insert ${getGroupLabel(section.group)} group`}
						className="flex shrink-0 cursor-pointer items-center justify-center border-l border-stroke-subtle px-2 text-fg-muted transition-colors hover:bg-accent-lime/10 hover:text-accent-lime"
					>
						<Plus aria-hidden="true" className="size-3" />
					</button>
				)}
			</div>
			{expanded && (
				<div role="group" className="border-t border-stroke-subtle">
					{section.typeGroups.map((group) => (
						<TypeBlock
							key={group.type}
							typeGroup={group}
							source={source}
							sourceId={sourceId}
							selected={selected}
							onSelect={onSelect}
							onInsertFile={onInsertFile}
						/>
					))}
					{section.singletons.map((group) => {
						const item = group.items[0];
						const file = item.files[0];
						if (!file) return null;
						return (
							<FileRow
								key={`${item.stableKey}:${file.name}`}
								source={source}
								sourceId={sourceId}
								stableKey={item.stableKey}
								fileName={file.name}
								type={item.type}
								group={item.group}
								selected={selected}
								onSelect={onSelect}
								onInsertFile={onInsertFile}
							/>
						);
					})}
				</div>
			)}
		</div>
	);
}

function TypeBlock({
	typeGroup,
	source,
	sourceId,
	selected,
	onSelect,
	onInsertFile,
}: {
	typeGroup: TypeGroup;
	source: InstructionSource;
	sourceId: string;
	selected?: InstructionTreeSelection | null;
	onSelect?: (selection: InstructionTreeSelection) => void;
	onInsertFile?: InstructionTreeProps["onInsertFile"];
}) {
	const [expanded, setExpanded] = useState(true);
	const Icon = getInstructionTypeIcon(typeGroup.type);
	const colors = getInstructionTypeColors(typeGroup.type);

	return (
		<div>
			<button
				type="button"
				role="treeitem"
				aria-expanded={expanded}
				onClick={() => setExpanded(!expanded)}
				className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-bg-panel-muted cursor-pointer"
			>
				<ChevronRight
					className={cn(
						"size-3 text-fg-muted transition-transform",
						expanded && "rotate-90",
					)}
				/>
				<div
					className={cn(
						"flex size-8 shrink-0 items-center justify-center border",
						colors,
					)}
				>
					<Icon className="size-4" />
				</div>
				<span className="flex-1" />
				<span className="font-mono text-xs font-bold uppercase tracking-wider text-fg-primary">
					{getInstructionTypeLabel(typeGroup.type)}
				</span>
				<span className="font-mono text-[10px] text-fg-muted">
					{typeGroup.totalFiles}
				</span>
			</button>
			{expanded &&
				typeGroup.items.flatMap((item) =>
					item.files.map((file) => (
						<FileRow
							key={`${item.stableKey}:${file.name}`}
							source={source}
							sourceId={sourceId}
							stableKey={item.stableKey}
							fileName={file.name}
							type={item.type}
							group={item.group}
							selected={selected}
							onSelect={onSelect}
							onInsertFile={onInsertFile}
						/>
					)),
				)}
		</div>
	);
}

function FileRow({
	source,
	sourceId,
	stableKey,
	fileName,
	type,
	group,
	selected,
	onSelect,
	onInsertFile,
}: {
	source: InstructionSource;
	sourceId: string;
	stableKey: string;
	fileName: string;
	type: string;
	group: string;
	selected?: InstructionTreeSelection | null;
	onSelect?: (selection: InstructionTreeSelection) => void;
	onInsertFile?: InstructionTreeProps["onInsertFile"];
}) {
	const isSelected =
		selected?.source === source &&
		selected.sourceId === sourceId &&
		selected.stableKey === stableKey &&
		selected.fileName === fileName;

	return (
		<div
			className={cn(
				"flex items-stretch border-t border-stroke-subtle/40",
				isSelected && "bg-accent-lime/10",
			)}
		>
			<button
				type="button"
				onClick={() => onSelect?.({ source, sourceId, stableKey, fileName })}
				className={cn(
					"flex flex-1 items-center gap-2 px-3 py-1.5 pl-10 text-left transition-colors cursor-pointer",
					isSelected
						? "text-fg-primary"
						: "text-fg-secondary hover:bg-bg-panel-muted hover:text-fg-primary",
				)}
			>
				<span className="truncate font-mono text-xs">{fileName}</span>
			</button>
			{onInsertFile && (
				<button
					type="button"
					aria-label={`Insert ${fileName}`}
					onClick={() =>
						onInsertFile({
							source,
							sourceId,
							stableKey,
							fileName,
							type,
							group,
						})
					}
					title="Insert file reference"
					className="flex shrink-0 cursor-pointer items-center justify-center border-l border-stroke-subtle px-2 text-fg-muted transition-colors hover:bg-accent-lime/10 hover:text-accent-lime"
				>
					<Plus aria-hidden="true" className="size-3" />
				</button>
			)}
		</div>
	);
}
