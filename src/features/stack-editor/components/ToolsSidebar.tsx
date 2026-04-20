import { AnimatePresence, motion } from "framer-motion";
import {
	Brain,
	ChevronDown,
	ChevronUp,
	FileText,
	Package,
	Wrench,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	BundlePicker,
	type BundleSubscriptionEntry,
} from "@/components/BundlePicker";
import { InstructionPanel } from "@/components/InstructionPanel";
import {
	ModelPicker,
	type ModelSubscriptionEntry,
} from "@/components/ModelPicker";
import { PriceDisplay } from "@/components/PriceDisplay";
import {
	ToolPicker,
	type ToolSubscriptionEntry,
} from "@/components/ToolPicker";
import {
	UnifiedFileList,
	type UnifiedFileListProjectGroup,
} from "@/components/UnifiedFileList";
import { useEditorContext } from "@/features/stack-editor/context/EditorContext";
import type { InstructionItem } from "@/features/stack-editor/types";
import { sumNormalizedMonthlyAmounts } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { Id } from "../../../../convex/_generated/dataModel";

type SidebarSection = "tools" | "bundles" | "models" | "instructions" | null;

type ProjectSourcedInstruction = InstructionItem & {
	sourceProjectId?: Id<"projects">;
	sourceProjectName?: string;
	sourceIsOwnProject?: boolean;
	sourceStableKey?: string;
};

type ToolsSidebarProps = {
	stackId?: Id<"stacks">;
	tools: ToolSubscriptionEntry[];
	onToolsChange: (tools: ToolSubscriptionEntry[]) => void;
	bundles: BundleSubscriptionEntry[];
	onBundlesChange: (bundles: BundleSubscriptionEntry[]) => void;
	models: ModelSubscriptionEntry[];
	onModelsChange: (models: ModelSubscriptionEntry[]) => void;
	instructions: InstructionItem[];
	onInstructionsChange: (instructions: InstructionItem[]) => void;
	projectInstructions?: ProjectSourcedInstruction[];
	guestSession?: boolean;
	onSignInRequired?: () => void;
	mobile?: boolean;
};

function ToolsSidebar({
	stackId,
	tools,
	onToolsChange,
	bundles,
	onBundlesChange,
	models,
	onModelsChange,
	instructions,
	onInstructionsChange,
	projectInstructions,
	guestSession = false,
	onSignInRequired,
	mobile = false,
}: ToolsSidebarProps) {
	const projectInstructionsList = projectInstructions ?? [];
	// Accordion state - only one section open at a time
	// Tools section starts expanded by default (especially important when no tools exist yet)
	const [activeSection, setActiveSection] = useState<SidebarSection>("tools");
	const [editingInstruction, setEditingInstruction] = useState<
		InstructionItem | "new" | null
	>(null);
	const {
		insertToolCardAtCursor,
		removeToolFromEditor,
		removeModelFromEditor,
		removeBundleFromEditor,
		removeInstructionFromEditor,
		insertModelCardAtCursor,
		insertBundleCardAtCursor,
		insertInstructionCard,
		insertInstructionGroup,
		editInstructionRequest,
		setEditInstructionRequest,
	} = useEditorContext();

	// React to edit instruction requests from the editor.
	useEffect(() => {
		if (editInstructionRequest) {
			const inst = instructions.find((i) => i.name === editInstructionRequest);
			if (inst) {
				setEditingInstruction(inst);
				setActiveSection("instructions");
			}
			setEditInstructionRequest(null);
		}
	}, [editInstructionRequest, instructions, setEditInstructionRequest]);

	// Track previous counts to detect additions
	const prevToolsCount = useRef(tools.length);
	const prevBundlesCount = useRef(bundles.length);
	const prevModelsCount = useRef(models.length);
	const prevInstructionsCount = useRef(instructions.length);

	// Auto-expand section when items are added
	useEffect(() => {
		if (tools.length > prevToolsCount.current) {
			setActiveSection("tools");
		}
		prevToolsCount.current = tools.length;
	}, [tools.length]);

	useEffect(() => {
		if (bundles.length > prevBundlesCount.current) {
			setActiveSection("bundles");
		}
		prevBundlesCount.current = bundles.length;
	}, [bundles.length]);

	useEffect(() => {
		if (models.length > prevModelsCount.current) {
			setActiveSection("models");
		}
		prevModelsCount.current = models.length;
	}, [models.length]);

	useEffect(() => {
		if (instructions.length > prevInstructionsCount.current) {
			setActiveSection("instructions");
		}
		prevInstructionsCount.current = instructions.length;
	}, [instructions.length]);

	const toggleSection = (section: SidebarSection) => {
		setActiveSection(activeSection === section ? null : section);
	};

	// Handle tool click - insert into editor at cursor
	const handleToolClick = useCallback(
		(tool: ToolSubscriptionEntry) => {
			insertToolCardAtCursor({
				name: tool.toolName,
				shortId: tool.toolShortId,
			});
		},
		[insertToolCardAtCursor],
	);

	// Handle tool removal - confirm then remove from editor
	const handleToolsChange = useCallback(
		(newTools: ToolSubscriptionEntry[]) => {
			const removedTools = tools.filter(
				(t) => !newTools.some((nt) => nt.toolSlug === t.toolSlug),
			);

			if (removedTools.length > 0) {
				const names = removedTools.map((t) => t.toolName).join(", ");
				if (
					!window.confirm(
						`Remove ${names} from your stack? This will also remove it from the editor.`,
					)
				) {
					return;
				}
				for (const tool of removedTools) {
					removeToolFromEditor(tool.toolName);
				}
			}

			onToolsChange(newTools);
		},
		[tools, onToolsChange, removeToolFromEditor],
	);

	// Handle model removal - confirm then remove from editor
	const handleModelsChange = useCallback(
		(newModels: ModelSubscriptionEntry[]) => {
			const removedModels = models.filter(
				(m) => !newModels.some((nm) => nm.modelSlug === m.modelSlug),
			);

			if (removedModels.length > 0) {
				const names = removedModels.map((m) => m.modelName).join(", ");
				if (
					!window.confirm(
						`Remove ${names} from your stack? This will also remove it from the editor.`,
					)
				) {
					return;
				}
				for (const model of removedModels) {
					removeModelFromEditor(model.modelName);
				}
			}

			onModelsChange(newModels);
		},
		[models, onModelsChange, removeModelFromEditor],
	);

	// Handle bundle removal - confirm then remove from editor
	const handleBundlesChange = useCallback(
		(newBundles: BundleSubscriptionEntry[]) => {
			const removedBundles = bundles.filter(
				(b) => !newBundles.some((nb) => nb.bundleSlug === b.bundleSlug),
			);

			if (removedBundles.length > 0) {
				const names = removedBundles.map((b) => b.bundleName).join(", ");
				if (
					!window.confirm(
						`Remove ${names} from your stack? This will also remove it from the editor.`,
					)
				) {
					return;
				}
				for (const bundle of removedBundles) {
					removeBundleFromEditor(bundle.bundleName);
				}
			}

			onBundlesChange(newBundles);
		},
		[bundles, onBundlesChange, removeBundleFromEditor],
	);

	// Handle model click - insert into editor at cursor
	const handleModelClick = useCallback(
		(model: ModelSubscriptionEntry) => {
			insertModelCardAtCursor({
				name: model.modelName,
				shortId: model.modelShortId,
				provider: model.modelProvider,
			});
		},
		[insertModelCardAtCursor],
	);

	// Handle bundle click - insert into editor at cursor
	const handleBundleClick = useCallback(
		(bundle: BundleSubscriptionEntry) => {
			insertBundleCardAtCursor({
				name: bundle.bundleName,
				shortId: bundle.bundleShortId,
			});
		},
		[insertBundleCardAtCursor],
	);

	// Handle add instruction - open panel for new
	const handleAddInstruction = useCallback(() => {
		setEditingInstruction("new");
	}, []);

	// Handle save from panel
	const handlePanelSave = useCallback(
		(updated: InstructionItem) => {
			if (editingInstruction === "new") {
				onInstructionsChange([...instructions, updated]);
			} else if (editingInstruction) {
				const idx = instructions.findIndex(
					(i) =>
						i.name === editingInstruction.name &&
						i.type === editingInstruction.type,
				);
				if (idx >= 0) {
					const next = [...instructions];
					next[idx] = updated;
					onInstructionsChange(next);
				}
			}
			setEditingInstruction(null);
		},
		[editingInstruction, instructions, onInstructionsChange],
	);

	// Handle delete from panel
	const handlePanelDelete = useCallback(() => {
		if (editingInstruction && editingInstruction !== "new") {
			const filtered = instructions.filter(
				(i) =>
					!(
						i.name === editingInstruction.name &&
						i.type === editingInstruction.type
					),
			);
			removeInstructionFromEditor(editingInstruction.name);
			onInstructionsChange(filtered);
		}
		setEditingInstruction(null);
	}, [
		editingInstruction,
		instructions,
		onInstructionsChange,
		removeInstructionFromEditor,
	]);

	// Calculate total monthly price from tools and bundles
	const totalMonthlyPrice = useMemo(() => {
		return sumNormalizedMonthlyAmounts([
			...tools.map((tool) => tool.price.fixed),
			...bundles.map((bundle) => bundle.price?.fixed),
		]);
	}, [tools, bundles]);

	// Group flattened project instructions back into per-project groups for
	// the unified file list.
	const projectGroups = useMemo<UnifiedFileListProjectGroup[]>(() => {
		const byProject = new Map<string, UnifiedFileListProjectGroup>();
		for (const item of projectInstructionsList) {
			if (!item.sourceProjectId) continue;
			const pid = String(item.sourceProjectId);
			const existing = byProject.get(pid);
			if (existing) {
				existing.instructions.push(item);
			} else {
				byProject.set(pid, {
					sourceId: pid,
					sourceLabel: item.sourceProjectName ?? "",
					instructions: [item],
				});
			}
		}
		return Array.from(byProject.values());
	}, [projectInstructionsList]);

	const stackInstructionsForList = useMemo(
		() =>
			stackId
				? {
						sourceId: String(stackId),
						sourceLabel: "Stack",
						instructions,
					}
				: null,
		[stackId, instructions],
	);

	const handleUnifiedInsertFile = useCallback(
		(args: {
			source: "stack" | "project";
			sourceId: string;
			stableKey: string;
			fileName: string;
			type: string;
			group: string | undefined;
		}) => {
			insertInstructionCard({
				source: args.source,
				sourceId: args.sourceId,
				stableKey: args.stableKey,
				fileName: args.fileName,
				type: args.type,
				group: args.group ?? null,
				description: null,
			});
		},
		[insertInstructionCard],
	);

	const handleUnifiedInsertGroup = useCallback(
		(args: {
			source: "stack" | "project";
			sourceId: string;
			group: string;
			fileCount: number;
		}) => {
			const sourceInstructions =
				args.source === "stack"
					? instructions
					: projectInstructionsList.filter(
							(i) =>
								(i as ProjectSourcedInstruction).sourceProjectId ===
								args.sourceId,
						);
			const typeCounts = new Map<string, number>();
			for (const instr of sourceInstructions) {
				if ((instr.group ?? "generic") === args.group) {
					typeCounts.set(
						instr.type,
						(typeCounts.get(instr.type) ?? 0) + instr.files.length,
					);
				}
			}
			const typeBreakdown = Array.from(typeCounts.entries()).map(
				([type, count]) => ({ type, count }),
			);
			insertInstructionGroup({
				source: args.source,
				sourceId: args.sourceId,
				group: args.group,
				description: null,
				fileCount: args.fileCount,
				typeBreakdown,
			});
		},
		[insertInstructionGroup, instructions, projectInstructionsList],
	);

	const showPanel = editingInstruction !== null;

	const renderSections = () => (
		<>
			{/* Tools Section - Collapsible */}
			<div>
				<button
					type="button"
					onClick={() => toggleSection("tools")}
					className={cn(
						"flex w-full items-center justify-between border-2 p-3 transition-all",
						activeSection === "tools"
							? "border-accent-lime bg-accent-lime/5"
							: "border-stroke-subtle bg-transparent hover:border-fg-muted",
					)}
				>
					<div className="flex items-center gap-2">
						<Wrench
							className={cn(
								"size-4",
								activeSection === "tools"
									? "text-accent-lime"
									: "text-fg-muted",
							)}
						/>
						<p
							className={cn(
								"font-mono text-[10px] uppercase tracking-wider",
								activeSection === "tools"
									? "text-accent-lime"
									: "text-fg-muted",
							)}
						>
							Tools
						</p>
					</div>
					<div className="flex items-center gap-2">
						<span className="font-mono text-[10px] text-fg-muted">
							{tools.length}
						</span>
						{activeSection === "tools" ? (
							<ChevronUp className="size-4 text-accent-lime" />
						) : (
							<ChevronDown className="size-4 text-fg-muted" />
						)}
					</div>
				</button>
				{activeSection === "tools" && (
					<div className="mt-3">
						<ToolPicker
							value={tools}
							onChange={handleToolsChange}
							bundleSubscriptions={bundles.map((b) => ({
								bundleSlug: b.bundleSlug,
								bundleName: b.bundleName,
							}))}
							onToolClick={handleToolClick}
							guestSession={guestSession}
							onSignInRequired={onSignInRequired}
						/>
					</div>
				)}
			</div>

			{/* Models Section - Collapsible */}
			<div>
				<button
					type="button"
					onClick={() => toggleSection("models")}
					className={cn(
						"flex w-full items-center justify-between border-2 p-3 transition-all",
						activeSection === "models"
							? "border-accent-lime bg-accent-lime/5"
							: "border-stroke-subtle bg-transparent hover:border-fg-muted",
					)}
				>
					<div className="flex items-center gap-2">
						<Brain
							className={cn(
								"size-4",
								activeSection === "models"
									? "text-accent-lime"
									: "text-fg-muted",
							)}
						/>
						<p
							className={cn(
								"font-mono text-[10px] uppercase tracking-wider",
								activeSection === "models"
									? "text-accent-lime"
									: "text-fg-muted",
							)}
						>
							Models
						</p>
					</div>
					<div className="flex items-center gap-2">
						<span className="font-mono text-[10px] text-fg-muted">
							{models.length}
						</span>
						{activeSection === "models" ? (
							<ChevronUp className="size-4 text-accent-lime" />
						) : (
							<ChevronDown className="size-4 text-fg-muted" />
						)}
					</div>
				</button>
				{activeSection === "models" && (
					<div className="mt-3">
						<ModelPicker
							value={models}
							onChange={handleModelsChange}
							onModelClick={handleModelClick}
						/>
					</div>
				)}
			</div>

			{/* Bundles Section - Collapsible */}
			<div>
				<button
					type="button"
					onClick={() => toggleSection("bundles")}
					className={cn(
						"flex w-full items-center justify-between border-2 p-3 transition-all",
						activeSection === "bundles"
							? "border-accent-lime bg-accent-lime/5"
							: "border-stroke-subtle bg-transparent hover:border-fg-muted",
					)}
				>
					<div className="flex items-center gap-2">
						<Package
							className={cn(
								"size-4",
								activeSection === "bundles"
									? "text-accent-lime"
									: "text-fg-muted",
							)}
						/>
						<p
							className={cn(
								"font-mono text-[10px] uppercase tracking-wider",
								activeSection === "bundles"
									? "text-accent-lime"
									: "text-fg-muted",
							)}
						>
							Bundles
						</p>
					</div>
					<div className="flex items-center gap-2">
						<span className="font-mono text-[10px] text-fg-muted">
							{bundles.length}
						</span>
						{activeSection === "bundles" ? (
							<ChevronUp className="size-4 text-accent-lime" />
						) : (
							<ChevronDown className="size-4 text-fg-muted" />
						)}
					</div>
				</button>
				{activeSection === "bundles" && (
					<div className="mt-3">
						<BundlePicker
							value={bundles}
							onChange={handleBundlesChange}
							onBundleClick={handleBundleClick}
							guestSession={guestSession}
							onSignInRequired={onSignInRequired}
						/>
					</div>
				)}
			</div>

			{/* Instructions Section - Collapsible */}
			<div>
				<button
					type="button"
					onClick={() => toggleSection("instructions")}
					className={cn(
						"flex w-full items-center justify-between border-2 p-3 transition-all",
						activeSection === "instructions"
							? "border-accent-lime bg-accent-lime/5"
							: "border-stroke-subtle bg-transparent hover:border-fg-muted",
					)}
				>
					<div className="flex items-center gap-2">
						<FileText
							className={cn(
								"size-4",
								activeSection === "instructions"
									? "text-accent-lime"
									: "text-fg-muted",
							)}
						/>
						<p
							className={cn(
								"font-mono text-[10px] uppercase tracking-wider",
								activeSection === "instructions"
									? "text-accent-lime"
									: "text-fg-muted",
							)}
						>
							Instructions
						</p>
					</div>
					<div className="flex items-center gap-2">
						<span className="font-mono text-[10px] text-fg-muted">
							{projectInstructionsList.length > 0
								? `${projectInstructionsList.length}+${instructions.length}`
								: instructions.length}
						</span>
						{activeSection === "instructions" ? (
							<ChevronUp className="size-4 text-accent-lime" />
						) : (
							<ChevronDown className="size-4 text-fg-muted" />
						)}
					</div>
				</button>
				{activeSection === "instructions" && (
					<div className="mt-3">
						<UnifiedFileList
							mode="edit"
							stackInstructions={stackInstructionsForList}
							projectInstructions={projectGroups}
							onInsertFile={handleUnifiedInsertFile}
							onInsertGroup={handleUnifiedInsertGroup}
							onAddManual={handleAddInstruction}
						/>
					</div>
				)}
			</div>
		</>
	);

	if (mobile) {
		return (
			<div className="flex flex-col">
				{/* Total Price Header */}
				<div className="border-b border-stroke-subtle bg-bg-panel p-4">
					<p className="font-mono text-[10px] uppercase tracking-widest text-accent-lime">
						{"// STACK COSTS"}
					</p>
					<div className="mt-2">
						<PriceDisplay
							amount={totalMonthlyPrice}
							rounding="exact"
							size="md"
							className="text-fg-primary"
						/>
					</div>
					<p className="mt-1 font-mono text-[10px] text-fg-muted">
						{tools.length} tool{tools.length !== 1 ? "s" : ""} •{" "}
						{bundles.length} bundle{bundles.length !== 1 ? "s" : ""}
					</p>
				</div>

				<div className="flex-grow overflow-y-auto overflow-x-hidden">
					<AnimatePresence mode="wait">
						{showPanel ? (
							<motion.div
								key="panel"
								initial={{ x: "100%", opacity: 0 }}
								animate={{ x: 0, opacity: 1 }}
								exit={{ x: "100%", opacity: 0 }}
								transition={{ duration: 0.25, ease: "easeInOut" }}
							>
								<InstructionPanel
									instruction={
										editingInstruction === "new" ? null : editingInstruction
									}
									onSave={handlePanelSave}
									onDelete={
										editingInstruction !== "new" ? handlePanelDelete : undefined
									}
									onBack={() => setEditingInstruction(null)}
								/>
							</motion.div>
						) : (
							<motion.div
								key="catalog"
								initial={{ x: "-100%", opacity: 0 }}
								animate={{ x: 0, opacity: 1 }}
								exit={{ x: "-100%", opacity: 0 }}
								transition={{ duration: 0.25, ease: "easeInOut" }}
							>
								<div className="space-y-2 p-4">
									{/* Same accordion sections as desktop - rendered inline */}
									{renderSections()}
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		);
	}

	return (
		<aside className="hidden w-96 border-l border-stroke-subtle bg-bg-panel/80 lg:block">
			<div className="sticky top-[58px] flex max-h-[calc(100vh-58px)] flex-col bg-bg-panel/80 backdrop-blur-sm">
				{/* Total Price Header - always visible */}
				<div className="border-b border-stroke-subtle bg-bg-panel p-4">
					<p className="font-mono text-[10px] uppercase tracking-widest text-accent-lime">
						{"// STACK COSTS"}
					</p>
					<div className="mt-2">
						<PriceDisplay
							amount={totalMonthlyPrice}
							rounding="exact"
							size="md"
							className="text-fg-primary"
						/>
					</div>
					<p className="mt-1 font-mono text-[10px] text-fg-muted">
						{tools.length} tool{tools.length !== 1 ? "s" : ""} •{" "}
						{bundles.length} bundle{bundles.length !== 1 ? "s" : ""}
					</p>
				</div>

				<div className="flex-grow overflow-y-auto overflow-x-hidden">
					<AnimatePresence mode="wait">
						{showPanel ? (
							<motion.div
								key="panel"
								initial={{ x: "100%", opacity: 0 }}
								animate={{ x: 0, opacity: 1 }}
								exit={{ x: "100%", opacity: 0 }}
								transition={{ duration: 0.25, ease: "easeInOut" }}
							>
								<InstructionPanel
									instruction={
										editingInstruction === "new" ? null : editingInstruction
									}
									onSave={handlePanelSave}
									onDelete={
										editingInstruction !== "new" ? handlePanelDelete : undefined
									}
									onBack={() => setEditingInstruction(null)}
								/>
							</motion.div>
						) : (
							<motion.div
								key="catalog"
								initial={{ x: "-100%", opacity: 0 }}
								animate={{ x: 0, opacity: 1 }}
								exit={{ x: "-100%", opacity: 0 }}
								transition={{ duration: 0.25, ease: "easeInOut" }}
							>
								<div className="space-y-2 p-4">{renderSections()}</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</aside>
	);
}

export { ToolsSidebar };
export type { ToolsSidebarProps };
