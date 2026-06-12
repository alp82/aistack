import { ChevronRight, ExternalLink, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { FileEntry, Resource } from "@/features/stack-editor/types";
import {
	normalizeUpstreamPath,
	repoNameFromCanonical,
} from "@/lib/github-repo";
import {
	getGroupLabel,
	getResourceTypeColors,
	getResourceTypeIcon,
	getResourceTypeLabel,
} from "@/lib/resource-utils";
import { cn } from "@/lib/utils";

export interface ResourceTreeSelection {
	source: "stack";
	sourceId: string;
	stableKey: string;
	fileName: string;
}

export interface ResourceTreeSourceItems {
	sourceId: string;
	sourceLabel: string;
	resources: Resource[];
}

export interface ResourceTreeProps {
	stack?: ResourceTreeSourceItems | null;
	selected?: ResourceTreeSelection | null;
	onSelect?: (selection: ResourceTreeSelection) => void;
	groupFilter?: string;
	isLoading?: boolean;
	onInsertFile?: (args: {
		source: "stack";
		sourceId: string;
		stableKey: string;
		fileName: string;
		type: string;
		group: string;
	}) => void;
	onInsertGroup?: (args: {
		source: "stack";
		sourceId: string;
		group: string;
		fileCount: number;
	}) => void;
	className?: string;
}

interface TypeGroup {
	type: string;
	items: Resource[];
	totalFiles: number;
}

/**
 * A linked resource carries no `files`; it is a pure reference to a GitHub repo
 * (`upstream`) or a package (`pkg`, e.g. an MCP server). Synthesize a single
 * display row so it renders like a one-file entry. Returns the row's first real
 * file when present, otherwise the pseudo-file.
 */
function linkedPseudoFile(item: Resource): FileEntry | undefined {
	if (item.files?.[0]) return item.files[0];
	if (item.upstream) {
		return {
			name:
				normalizeUpstreamPath(item.upstream.path) ||
				repoNameFromCanonical(item.upstream.repoUrl),
			content: "",
			path: undefined,
		};
	}
	if (item.pkg) {
		return { name: item.pkg.id, content: "", path: undefined };
	}
	return undefined;
}

/** External URL for a package reference, by registry. */
function packageHref(pkg: NonNullable<Resource["pkg"]>): string {
	switch (pkg.registry) {
		case "npm":
			return `https://www.npmjs.com/package/${pkg.id}`;
		case "pypi":
			return `https://pypi.org/project/${pkg.id}/`;
		case "oci":
			return `https://hub.docker.com/r/${pkg.id}`;
		default:
			return pkg.id; // url registry: the id is the endpoint URL
	}
}

interface GroupSection {
	group: string;
	typeGroups: TypeGroup[];
	singletons: TypeGroup[];
	totalFiles: number;
}

function groupByGroupAndType(resources: Resource[]): GroupSection[] {
	const groupMap = new Map<string, Resource[]>();
	for (const item of resources) {
		const existing = groupMap.get(item.group) ?? [];
		existing.push(item);
		groupMap.set(item.group, existing);
	}

	return Array.from(groupMap.entries()).map(([group, items]) => {
		const typeMap = new Map<string, Resource[]>();
		for (const item of items) {
			const existing = typeMap.get(item.type) ?? [];
			existing.push(item);
			typeMap.set(item.type, existing);
		}
		const allTypeGroups = Array.from(typeMap.entries()).map(
			([type, typeItems]) => ({
				type,
				items: typeItems,
				totalFiles: typeItems.reduce(
					(sum, i) =>
						sum + ((i.files?.length ?? 0) || (i.upstream || i.pkg ? 1 : 0)),
					0,
				),
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

export function ResourceTree({
	stack,
	selected,
	onSelect,
	groupFilter,
	isLoading,
	onInsertFile,
	onInsertGroup,
	className,
}: ResourceTreeProps) {
	const sections = useMemo(() => {
		const result: Array<{
			source: "stack";
			sourceId: string;
			sourceLabel: string;
			groups: GroupSection[];
		}> = [];
		if (stack && stack.resources.length > 0) {
			let groups = groupByGroupAndType(stack.resources);
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
		return result;
	}, [stack, groupFilter]);

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
					No resource files available.
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
								Stack
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
													const file = linkedPseudoFile(item);
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
															upstream={item.upstream}
															pkg={item.pkg}
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
	source: "stack";
	sourceId: string;
	selected?: ResourceTreeSelection | null;
	onSelect?: (selection: ResourceTreeSelection) => void;
	onInsertFile?: ResourceTreeProps["onInsertFile"];
	onInsertGroup?: ResourceTreeProps["onInsertGroup"];
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
						const file = linkedPseudoFile(item);
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
								upstream={item.upstream}
								pkg={item.pkg}
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
	source: "stack";
	sourceId: string;
	selected?: ResourceTreeSelection | null;
	onSelect?: (selection: ResourceTreeSelection) => void;
	onInsertFile?: ResourceTreeProps["onInsertFile"];
}) {
	const [expanded, setExpanded] = useState(true);
	const Icon = getResourceTypeIcon(typeGroup.type);
	const colors = getResourceTypeColors(typeGroup.type);

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
					{getResourceTypeLabel(typeGroup.type)}
				</span>
				<span className="font-mono text-[10px] text-fg-muted">
					{typeGroup.totalFiles}
				</span>
			</button>
			{expanded &&
				typeGroup.items.flatMap((item) => {
					// A linked row carries no files; synthesize a single pseudo-file so
					// it still renders (otherwise a co-typed linked row is invisible).
					const files = item.files ?? [];
					if (files.length === 0) {
						const file = linkedPseudoFile(item);
						if (!file) return [];
						return [
							<FileRow
								key={`${item.stableKey}:${file.name}`}
								source={source}
								sourceId={sourceId}
								stableKey={item.stableKey}
								fileName={file.name}
								type={item.type}
								group={item.group}
								upstream={item.upstream}
								pkg={item.pkg}
								selected={selected}
								onSelect={onSelect}
								onInsertFile={onInsertFile}
							/>,
						];
					}
					return files.map((file) => (
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
					));
				})}
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
	upstream,
	pkg,
	selected,
	onSelect,
	onInsertFile,
}: {
	source: "stack";
	sourceId: string;
	stableKey: string;
	fileName: string;
	type: string;
	group: string;
	upstream?: Resource["upstream"];
	pkg?: Resource["pkg"];
	selected?: ResourceTreeSelection | null;
	onSelect?: (selection: ResourceTreeSelection) => void;
	onInsertFile?: ResourceTreeProps["onInsertFile"];
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
			{upstream ? (
				<a
					href={
						upstream.path
							? `${upstream.repoUrl}/tree/HEAD/${upstream.path}`
							: upstream.repoUrl
					}
					target="_blank"
					rel="noopener noreferrer"
					className="flex flex-1 items-center gap-2 px-3 py-1.5 pl-10 text-left text-fg-secondary transition-colors hover:bg-bg-panel-muted hover:text-fg-primary"
				>
					<span className="truncate font-mono text-xs">
						{repoNameFromCanonical(upstream.repoUrl)}
						{upstream.path ? ` · ${upstream.path}` : ""}
					</span>
					<ExternalLink
						aria-hidden="true"
						className="size-3 shrink-0 text-fg-muted"
					/>
				</a>
			) : pkg ? (
				<a
					href={packageHref(pkg)}
					target="_blank"
					rel="noopener noreferrer"
					className="flex flex-1 items-center gap-2 px-3 py-1.5 pl-10 text-left text-fg-secondary transition-colors hover:bg-bg-panel-muted hover:text-fg-primary"
				>
					<span className="truncate font-mono text-xs">
						{pkg.id}
						{pkg.version ? ` · ${pkg.version}` : ""}
					</span>
					<span className="font-mono text-[10px] uppercase text-fg-muted">
						{pkg.registry}
					</span>
					<ExternalLink
						aria-hidden="true"
						className="size-3 shrink-0 text-fg-muted"
					/>
				</a>
			) : (
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
			)}
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
