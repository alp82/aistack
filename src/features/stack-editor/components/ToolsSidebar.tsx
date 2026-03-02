import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Brain, ChevronDown, ChevronUp, FileText, Package, Wrench } from "lucide-react";
import { ToolPicker, type ToolSubscriptionEntry } from "@/components/ToolPicker";
import { BundlePicker, type BundleSubscriptionEntry } from "@/components/BundlePicker";
import { ModelPicker, type ModelSubscriptionEntry } from "@/components/ModelPicker";
import { InstructionPicker } from "@/components/InstructionPicker";
import { cn } from "@/lib/utils";
import { useEditorContext } from "@/features/stack-editor/context/EditorContext";
import type { InstructionItem } from "@/features/stack-editor/types";

type SidebarSection = "tools" | "bundles" | "models" | "instructions" | null;

type ToolsSidebarProps = {
	tools: ToolSubscriptionEntry[];
	onToolsChange: (tools: ToolSubscriptionEntry[]) => void;
	bundles: BundleSubscriptionEntry[];
	onBundlesChange: (bundles: BundleSubscriptionEntry[]) => void;
	models: ModelSubscriptionEntry[];
	onModelsChange: (models: ModelSubscriptionEntry[]) => void;
	instructions: InstructionItem[];
	onInstructionsChange: (instructions: InstructionItem[]) => void;
	guestSession?: boolean;
	onSignInRequired?: () => void;
};

function ToolsSidebar({ 
	tools, 
	onToolsChange, 
	bundles, 
	onBundlesChange,
	models,
	onModelsChange,
	instructions,
	onInstructionsChange,
	guestSession = false,
	onSignInRequired,
}: ToolsSidebarProps) {
	// Accordion state - only one section open at a time, tools starts expanded
	const [activeSection, setActiveSection] = useState<SidebarSection>("tools");
	const { insertToolAtCursor, removeToolFromEditor, removeModelFromEditor, removeBundleFromEditor, removeInstructionFromEditor, insertModelAtCursor, insertBundleAtCursor, insertInstructionAtCursor } = useEditorContext();
	
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
	const handleToolClick = useCallback((tool: ToolSubscriptionEntry) => {
		insertToolAtCursor({
			name: tool.toolName,
			iconUrl: tool.toolIconUrl,
		});
	}, [insertToolAtCursor]);

	// Handle tool removal - also remove from editor
	const handleToolsChange = useCallback((newTools: ToolSubscriptionEntry[]) => {
		// Find removed tools
		const removedTools = tools.filter(
			(t) => !newTools.some((nt) => nt.toolSlug === t.toolSlug)
		);
		
		// Remove from editor
		for (const tool of removedTools) {
			removeToolFromEditor(tool.toolName);
		}
		
		onToolsChange(newTools);
	}, [tools, onToolsChange, removeToolFromEditor]);

	// Handle model removal - also remove from editor
	const handleModelsChange = useCallback((newModels: ModelSubscriptionEntry[]) => {
		const removedModels = models.filter(
			(m) => !newModels.some((nm) => nm.modelSlug === m.modelSlug)
		);
		for (const model of removedModels) {
			removeModelFromEditor(model.modelName);
		}
		onModelsChange(newModels);
	}, [models, onModelsChange, removeModelFromEditor]);

	// Handle bundle removal - also remove from editor
	const handleBundlesChange = useCallback((newBundles: BundleSubscriptionEntry[]) => {
		const removedBundles = bundles.filter(
			(b) => !newBundles.some((nb) => nb.bundleSlug === b.bundleSlug)
		);
		for (const bundle of removedBundles) {
			removeBundleFromEditor(bundle.bundleName);
		}
		onBundlesChange(newBundles);
	}, [bundles, onBundlesChange, removeBundleFromEditor]);

	// Handle instruction removal - also remove from editor
	const handleInstructionsChange = useCallback((newInstructions: InstructionItem[]) => {
		const removedInstructions = instructions.filter(
			(inst) => !newInstructions.some((ni) => ni.name === inst.name && ni.type === inst.type)
		);
		for (const inst of removedInstructions) {
			removeInstructionFromEditor(inst.name);
		}
		onInstructionsChange(newInstructions);
	}, [instructions, onInstructionsChange, removeInstructionFromEditor]);

	// Handle model click - insert into editor at cursor
	const handleModelClick = useCallback((model: ModelSubscriptionEntry) => {
		insertModelAtCursor({
			name: model.modelName,
			provider: model.modelProvider,
			iconUrl: model.modelIconUrl,
		});
	}, [insertModelAtCursor]);

	// Handle instruction click - insert into editor at cursor
	const handleInstructionClick = useCallback((instruction: InstructionItem) => {
		insertInstructionAtCursor({
			name: instruction.name,
			type: instruction.type,
			content: instruction.content,
		});
	}, [insertInstructionAtCursor]);

	// Handle bundle click - insert into editor at cursor
	const handleBundleClick = useCallback((bundle: BundleSubscriptionEntry) => {
		insertBundleAtCursor({
			name: bundle.bundleName,
			iconUrl: bundle.bundleIconUrl ?? undefined,
		});
	}, [insertBundleAtCursor]);

	// Calculate total monthly price from tools only (bundles don't have price in entry)
	const totalMonthlyPrice = useMemo(() => {
		let total = 0;
		
		for (const tool of tools) {
			if (tool.price.pricingType === "fixed" && tool.price.fixed) {
				const amount = tool.price.fixed.amount;
				const period = tool.price.fixed.period;
				if (period === "month") {
					total += amount;
				} else if (period === "year") {
					total += amount / 12;
				}
			}
		}

		return total;
	}, [tools]);

	return (
		<aside className="hidden w-96 border-l border-stroke-subtle bg-bg-panel/80 lg:block">
			<div className="sticky top-[58px] flex max-h-[calc(100vh-58px)] flex-col bg-bg-panel/80 backdrop-blur-sm">
			<div className="flex-grow overflow-y-auto">
				{/* Total Price Header */}
				<div className="border-b border-stroke-subtle bg-bg-panel p-4">
					<p className="font-mono text-[10px] uppercase tracking-widest text-accent-lime">
						// STACK COSTS
					</p>
					<div className="mt-2 flex items-baseline gap-2">
						<span className="text-2xl font-black text-fg-primary">
							${totalMonthlyPrice.toFixed(2)}
						</span>
						<span className="font-mono text-xs text-fg-muted">/month</span>
					</div>
					<p className="mt-1 font-mono text-[10px] text-fg-muted">
						{tools.length} tool{tools.length !== 1 ? "s" : ""} • {bundles.length} bundle{bundles.length !== 1 ? "s" : ""}
					</p>
				</div>

				<div className="space-y-2 p-4">
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
								<Wrench className={cn("size-4", activeSection === "tools" ? "text-accent-lime" : "text-fg-muted")} />
								<div className="text-left">
									<p className={cn("font-mono text-[10px] uppercase tracking-wider", activeSection === "tools" ? "text-accent-lime" : "text-fg-muted")}>
										Tools
									</p>
								</div>
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
								<Brain className={cn("size-4", activeSection === "models" ? "text-accent-lime" : "text-fg-muted")} />
								<div className="text-left">
									<p className={cn("font-mono text-[10px] uppercase tracking-wider", activeSection === "models" ? "text-accent-lime" : "text-fg-muted")}>
										Models
									</p>
								</div>
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
								<Package className={cn("size-4", activeSection === "bundles" ? "text-accent-lime" : "text-fg-muted")} />
								<div className="text-left">
									<p className={cn("font-mono text-[10px] uppercase tracking-wider", activeSection === "bundles" ? "text-accent-lime" : "text-fg-muted")}>
										Bundles
									</p>
								</div>
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
								<FileText className={cn("size-4", activeSection === "instructions" ? "text-accent-lime" : "text-fg-muted")} />
								<div className="text-left">
									<p className={cn("font-mono text-[10px] uppercase tracking-wider", activeSection === "instructions" ? "text-accent-lime" : "text-fg-muted")}>
										Instructions
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<span className="font-mono text-[10px] text-fg-muted">
									{instructions.length}
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
								<InstructionPicker 
									value={instructions} 
									onChange={handleInstructionsChange}
									onInstructionClick={handleInstructionClick}
								/>
							</div>
						)}
					</div>
				</div>
			</div>
			</div>
		</aside>
	);
}

export { ToolsSidebar };
export type { ToolsSidebarProps };
