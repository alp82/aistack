import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle, ExternalLink, Save, Send, Wrench } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BundleSubscriptionEntry } from "@/components/BundlePicker";
import { GridBackground } from "@/components/GridBackground";
import { SignInDialog } from "@/components/SignInDialog";
import type { ToolSubscriptionEntry } from "@/components/ToolPicker";
import { DetailsStep } from "@/features/stack-editor/components/DetailsStep";
import { ToolsSidebar } from "@/features/stack-editor/components/ToolsSidebar";
import { WorkflowStep } from "@/features/stack-editor/components/WorkflowStep";
import {
	type BundleLookupData,
	EditorProvider,
	type ModelLookupData,
	type ResourceLookupData,
	type ToolLookupData,
	useEditorContext,
} from "@/features/stack-editor/context/EditorContext";
import { getDraftKey } from "@/features/stack-editor/state/editorReducer";
import {
	selectSavePayload,
	selectSaveValidationError,
} from "@/features/stack-editor/state/editorSelectors";
import { useEditorState } from "@/features/stack-editor/state/useEditorState";
import type {
	CreatorProfile,
	ModelSubscriptionEntry,
	StackEditorInitialValue,
	StackEditorMode,
} from "@/features/stack-editor/types";
import {
	buildManualStableKey,
	MANUAL_INSTRUCTION_GROUP,
} from "@/lib/resource-utils";
import { api } from "../../convex/_generated/api";

function LookupDataSync({
	tools,
	models,
	bundles,
}: {
	tools: ToolSubscriptionEntry[];
	models: ModelSubscriptionEntry[];
	bundles: BundleSubscriptionEntry[];
}) {
	const { setToolLookup, setModelLookup, setBundleLookup } = useEditorContext();

	useEffect(() => {
		const toolMap = new Map<string, ToolLookupData>();
		for (const tool of tools) {
			toolMap.set(tool.toolName, {
				name: tool.toolName,
				shortId: tool.toolShortId,
				categories: tool.toolCategories,
				iconUrl: tool.toolIconUrl,
				price: tool.price.fixed
					? { amount: tool.price.fixed.amount, period: tool.price.fixed.period }
					: undefined,
				tierName: tool.primaryUsageLabel,
				description: tool.description,
			});
		}
		setToolLookup(toolMap);
	}, [tools, setToolLookup]);

	useEffect(() => {
		const modelMap = new Map<string, ModelLookupData>();
		for (const model of models) {
			modelMap.set(model.modelName, {
				name: model.modelName,
				shortId: model.modelShortId,
				provider: model.modelProvider,
				iconUrl: model.modelIconUrl,
				category: model.modelCategory,
				description: model.description,
			});
		}
		setModelLookup(modelMap);
	}, [models, setModelLookup]);

	useEffect(() => {
		const bundleMap = new Map<string, BundleLookupData>();
		for (const bundle of bundles) {
			bundleMap.set(bundle.bundleName, {
				name: bundle.bundleName,
				shortId: bundle.bundleShortId,
				iconUrl: bundle.bundleIconUrl ?? undefined,
				price: bundle.price?.fixed
					? {
							amount: bundle.price.fixed.amount,
							period: bundle.price.fixed.period,
						}
					: undefined,
				tierName: bundle.tierName,
				description: bundle.description,
			});
		}
		setBundleLookup(bundleMap);
	}, [bundles, setBundleLookup]);

	return null;
}

type StackEditorProps = {
	mode: StackEditorMode;
	actor: CreatorProfile;
	guestSession?: boolean;
	initialValue?: StackEditorInitialValue;
	defaultAvatarUrl?: string;
	onNavigating?: () => void;
};

export function StackEditor({
	mode,
	actor,
	initialValue,
	guestSession = false,
	defaultAvatarUrl,
	onNavigating,
}: StackEditorProps) {
	const navigate = useNavigate();
	const createStack = useMutation(api.stacks.create);
	const updateStack = useMutation(api.stacks.update);
	const updateCreatorProfile = useMutation(api.creators.updateProfile);

	const {
		state,
		setBundleSubscriptions,
		setDescription,
		setError,
		setResources,
		setIsTeam,
		setModelSubscriptions,
		setName,
		setOneLiner,
		setSaving,
		setShowSignInDialog,
		setTeamSize,
		setToolSubscriptions,
		setXHandle,
		setPersonalPageUrl,
		setStackImageUrl,
		revertDraft,
		dismissDraft,
		disableDraftSaving,
	} = useEditorState({
		mode,
		guestSession,
		actor,
		initialValue,
	});

	const allTools = useQuery(api.tools.listForEditor) ?? [];
	const allModels = useQuery(api.models.listForEditor) ?? [];

	const projectResourcesByProject = useQuery(
		api.projects.listProjectResourcesByStack,
		initialValue?._id
			? { stackId: initialValue._id, includeUnpublished: true }
			: "skip",
	);
	const flattenedProjectResources = (projectResourcesByProject ?? []).flatMap(
		(project) =>
			project.resources.map((inst) => ({
				...inst,
				sourceProjectId: project.projectId,
				sourceProjectName: project.projectName,
				sourceIsOwnProject: project.isOwnProject,
				sourceStableKey: inst.stableKey,
			})),
	);

	// Use refs to avoid stale closures in the callback passed to the editor
	const stateRef = useRef(state);
	const allToolsRef = useRef(allTools);
	const allModelsRef = useRef(allModels);
	stateRef.current = state;
	allToolsRef.current = allTools;
	allModelsRef.current = allModels;

	const handleToolAdded = useCallback(
		(tool: { _id: string; name: string; iconUrl?: string | null }) => {
			const currentState = stateRef.current;
			const currentAllTools = allToolsRef.current;

			// Find the full tool data
			const fullTool = currentAllTools.find((t) => t._id === tool._id);
			if (!fullTool) return;

			// Check if tool is already in the list
			if (
				currentState.toolSubscriptions.some((t) => t.toolSlug === fullTool.slug)
			) {
				return;
			}

			const defaultTier =
				fullTool.tiers.find((t) => t.isDefault) ?? fullTool.tiers[0];
			if (!defaultTier) return;

			setToolSubscriptions([
				...currentState.toolSubscriptions,
				{
					toolSlug: fullTool.slug,
					toolName: fullTool.name,
					toolShortId: fullTool.shortId,
					toolCategories: fullTool.categories,
					toolIconUrl: fullTool.iconUrl ?? undefined,
					tierId: defaultTier.tierId,
					kind: "main",
					primaryUsageLabel: defaultTier.name,
					price: {
						pricingType: defaultTier.pricing.pricingType,
						fixed:
							defaultTier.pricing.pricingType === "fixed" &&
							defaultTier.pricing.fixed
								? {
										currency: defaultTier.pricing.fixed.currency,
										amount: defaultTier.pricing.fixed.amount,
										period: defaultTier.pricing.fixed.period,
									}
								: undefined,
					},
					priceKind: "regular",
				},
			]);
		},
		[setToolSubscriptions],
	);

	const handleModelAdded = useCallback(
		(model: {
			_id: string;
			name: string;
			provider: string;
			iconUrl?: string | null;
		}) => {
			const currentState = stateRef.current;
			const currentAllModels = allModelsRef.current;

			// Find the full model data
			const fullModel = currentAllModels.find((m) => m._id === model._id);
			if (!fullModel) return;

			// Check if model is already in the list
			if (
				currentState.modelSubscriptions.some(
					(m) => m.modelSlug === fullModel.slug,
				)
			) {
				return;
			}

			const entry: ModelSubscriptionEntry = {
				modelSlug: fullModel.slug,
				modelName: fullModel.name,
				modelShortId: fullModel.shortId,
				modelProvider: fullModel.provider,
				modelCategory: fullModel.category,
				modelIconUrl: fullModel.iconUrl,
				role: "primary",
			};

			setModelSubscriptions([...currentState.modelSubscriptions, entry]);
		},
		[setModelSubscriptions],
	);

	const handleSave = async (publish: boolean) => {
		const validationError = selectSaveValidationError(state, publish);

		if (validationError) {
			setError(validationError);
			return;
		}

		if (guestSession && publish) {
			navigate({ to: "/signin-publish", search: { redirect: "/stacks/new" } });
			return;
		}

		if (guestSession) {
			setError("");
			setSaving(true);
			setTimeout(() => {
				setSaving(false);
				setError("Stack saved locally. Sign in to publish.");
			}, 500);
			return;
		}

		setError("");
		setSaving(true);

		try {
			if (state.xHandle !== (actor.xHandle ?? "")) {
				await updateCreatorProfile({
					xHandle: state.xHandle.trim() || undefined,
				});
			}

			const payload = selectSavePayload(state, publish);

			// Disable draft auto-save BEFORE the mutation to prevent race conditions
			disableDraftSaving();

			if (mode === "create") {
				const result = await createStack(payload);
				localStorage.removeItem(getDraftKey(undefined));
				onNavigating?.();
				navigate({ to: "/stacks/$slug", params: { slug: result.slug } });
				return;
			}

			if (initialValue) {
				await updateStack({
					stackId: initialValue._id,
					...payload,
				});
				localStorage.removeItem(getDraftKey(initialValue.slug));
				if (publish) {
					navigate({
						to: "/stacks/$slug",
						params: { slug: initialValue.slug },
					});
				}
			}
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Failed to save stack");
		} finally {
			setSaving(false);
		}
	};

	const handleResourceUpdate = useCallback(
		(oldName: string, updates: Partial<ResourceLookupData>) => {
			const currentResources = stateRef.current.resources;
			const found = currentResources.some((inst) => inst.name === oldName);
			if (found) {
				const updatedResources = currentResources.map((inst) =>
					inst.name === oldName
						? {
								...inst,
								name: updates.name ?? inst.name,
								description: updates.description ?? inst.description,
							}
						: inst,
				);
				setResources(updatedResources);
			} else {
				const nextName = updates.name ?? oldName;
				const nextType = updates.type ?? "prompt";
				setResources([
					...currentResources,
					{
						name: nextName,
						type: nextType,
						description: updates.description,
						group: MANUAL_INSTRUCTION_GROUP,
						stableKey: buildManualStableKey(nextType, nextName),
						files: [],
					},
				]);
			}
		},
		[setResources],
	);

	const handleToolDescriptionUpdate = useCallback(
		(idOrName: string, description: string) => {
			const updatedTools = stateRef.current.toolSubscriptions.map((t) =>
				t.toolShortId === idOrName || t.toolName === idOrName
					? { ...t, description }
					: t,
			);
			setToolSubscriptions(updatedTools);
		},
		[setToolSubscriptions],
	);

	const handleBundleDescriptionUpdate = useCallback(
		(idOrName: string, description: string) => {
			const updatedBundles = stateRef.current.bundleSubscriptions.map((b) =>
				b.bundleShortId === idOrName || b.bundleName === idOrName
					? { ...b, description }
					: b,
			);
			setBundleSubscriptions(updatedBundles);
		},
		[setBundleSubscriptions],
	);

	const handleModelDescriptionUpdate = useCallback(
		(idOrName: string, description: string) => {
			const updatedModels = stateRef.current.modelSubscriptions.map((m) =>
				m.modelShortId === idOrName || m.modelName === idOrName
					? { ...m, description }
					: m,
			);
			setModelSubscriptions(updatedModels);
		},
		[setModelSubscriptions],
	);

	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

	// Lock body scroll when mobile sidebar is open
	useEffect(() => {
		if (mobileSidebarOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [mobileSidebarOpen]);

	const toolCount =
		state.toolSubscriptions.length +
		state.bundleSubscriptions.length +
		state.modelSubscriptions.length +
		state.resources.length;

	return (
		<EditorProvider
			onResourceUpdate={handleResourceUpdate}
			onToolDescriptionUpdate={handleToolDescriptionUpdate}
			onBundleDescriptionUpdate={handleBundleDescriptionUpdate}
			onModelDescriptionUpdate={handleModelDescriptionUpdate}
		>
			<LookupDataSync
				tools={state.toolSubscriptions}
				models={state.modelSubscriptions}
				bundles={state.bundleSubscriptions}
			/>
			<div className="bg-bg-canvas">
				<GridBackground />
				<SignInDialog
					isOpen={state.showSignInDialog}
					onClose={() => setShowSignInDialog(false)}
					message="Please sign in to publish your stack. Your work is saved locally and will be available when you return."
				/>
				<div className="relative z-10 mx-auto max-w-content flex flex-col">
					<div className="flex">
						<main className="flex-1 px-3 py-4 sm:px-6 sm:py-8 min-w-0">
							{/* Sticky Header with Title and Actions */}
							<header className="sticky top-16 mb-6 sm:mb-12 py-3 sm:py-4 z-20 bg-bg-canvas border-b-2 border-stroke-subtle">
								<div className="flex items-center justify-between gap-2 sm:gap-4">
									<h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase text-fg-primary">
										{mode === "create" ? "Create Stack" : "Update Stack"}
									</h1>

									<div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
										{mode === "edit" &&
											initialValue?.published &&
											initialValue?.slug && (
												<Link
													to="/stacks/$slug"
													params={{ slug: `${initialValue.slug}` }}
													target="_blank"
													className="hidden sm:inline-flex items-center gap-2 px-4 py-2 border-2 border-stroke-subtle font-mono text-xs uppercase tracking-wider text-fg-muted hover:border-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
												>
													<ExternalLink className="size-4" />
													View Stack
												</Link>
											)}
										{initialValue?.published ? (
											<>
												{/* Published/Unpublish Button - hidden on mobile */}
												<button
													type="button"
													onClick={() => handleSave(false)}
													disabled={state.saving}
													className="group hidden sm:inline-flex items-center gap-2 px-4 py-2 border-2 border-accent-lime font-mono text-xs font-bold uppercase tracking-wider text-accent-lime transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50 cursor-pointer"
												>
													<CheckCircle className="size-4 group-hover:hidden" />
													<span className="hidden group-hover:inline">✕</span>
													<span className="relative">
														<span className="group-hover:hidden">
															Published
														</span>
														<span className="hidden group-hover:inline">
															Unpublish
														</span>
													</span>
												</button>

												{/* Save Button - lime filled */}
												<button
													type="button"
													onClick={() => handleSave(true)}
													disabled={state.saving}
													className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 border-2 border-accent-lime bg-accent-lime font-mono text-xs font-bold uppercase tracking-wider text-accent-lime-contrast hover:bg-accent-lime-strong transition-colors disabled:opacity-50 cursor-pointer"
												>
													<Save className="size-4" />
													<span className="hidden sm:inline">
														{state.saving ? "Saving..." : "Save"}
													</span>
												</button>
											</>
										) : (
											<>
												{/* Save Draft Button - outline, icon-only on mobile */}
												<button
													type="button"
													onClick={() => handleSave(false)}
													disabled={state.saving}
													className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 border-2 border-stroke-strong font-mono text-xs uppercase tracking-wider text-fg-muted hover:border-accent-lime hover:text-fg-primary transition-colors disabled:opacity-50 cursor-pointer"
												>
													<Save className="size-4" />
													<span className="hidden sm:inline">
														{state.saving ? "Saving..." : "Save Draft"}
													</span>
												</button>

												{/* Publish Button - lime filled */}
												<button
													type="button"
													onClick={() => handleSave(true)}
													disabled={state.saving}
													className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 border-2 border-accent-lime bg-accent-lime font-mono text-xs font-bold uppercase tracking-wider text-accent-lime-contrast hover:bg-accent-lime-strong transition-colors disabled:opacity-50 cursor-pointer"
												>
													<Send className="size-4" />
													<span className="hidden sm:inline">
														{state.saving
															? "Publishing..."
															: guestSession
																? "Signup & Publish"
																: "Publish"}
													</span>
												</button>
											</>
										)}
									</div>
								</div>

								{state.error && (
									<div className="mt-3 border-2 border-destructive/30 bg-destructive/10 p-3 font-mono text-sm text-destructive">
										{state.error}
									</div>
								)}
							</header>

							{state.restoredFromDraft && (
								<div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-2 border-amber-500/30 bg-amber-500/10 p-3 font-mono text-sm text-amber-400">
									<span>Unsaved changes restored from your last session.</span>
									<div className="flex items-center gap-2 flex-shrink-0">
										<button
											type="button"
											onClick={revertDraft}
											className="px-3 py-1 border border-amber-500/40 text-xs font-bold uppercase tracking-wider hover:bg-amber-500/20 transition-colors cursor-pointer"
										>
											Revert
										</button>
										<button
											type="button"
											onClick={dismissDraft}
											className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-fg-muted hover:text-fg-secondary transition-colors cursor-pointer"
										>
											Dismiss
										</button>
									</div>
								</div>
							)}

							{/* Stack Details Section */}
							<DetailsStep
								creator={actor}
								name={state.name}
								onNameChange={setName}
								oneLiner={state.oneLiner}
								onOneLinerChange={setOneLiner}
								xHandle={state.xHandle}
								onXHandleChange={setXHandle}
								personalPageUrl={state.personalPageUrl}
								onPersonalPageUrlChange={setPersonalPageUrl}
								stackImageUrl={state.stackImageUrl}
								onStackImageUrlChange={setStackImageUrl}
								defaultAvatarUrl={defaultAvatarUrl}
								isTeam={state.isTeam}
								onIsTeamChange={setIsTeam}
								teamSize={state.teamSize}
								onTeamSizeChange={setTeamSize}
							/>

							{/* HR between steps */}
							<hr className="my-8 sm:my-12 border-stroke-subtle" />

							{/* Workflow Section */}
							<div>
								<WorkflowStep
									description={state.description}
									onDescriptionChange={setDescription}
									onToolAdded={handleToolAdded}
									onModelAdded={handleModelAdded}
									stackResources={
										initialValue?._id
											? {
													stackId: String(initialValue._id),
													resources: state.resources,
												}
											: undefined
									}
								/>
							</div>
						</main>
						<ToolsSidebar
							stackId={initialValue?._id}
							tools={state.toolSubscriptions}
							onToolsChange={setToolSubscriptions}
							bundles={state.bundleSubscriptions}
							onBundlesChange={setBundleSubscriptions}
							models={state.modelSubscriptions}
							onModelsChange={setModelSubscriptions}
							resources={state.resources}
							onResourcesChange={setResources}
							projectResources={flattenedProjectResources}
							guestSession={guestSession}
							onSignInRequired={() => setShowSignInDialog(true)}
						/>
					</div>
				</div>
			</div>

			{/* Mobile sidebar overlay */}
			{mobileSidebarOpen && (
				<div
					style={{ position: "fixed", inset: 0, zIndex: 9999 }}
					className="lg:hidden"
				>
					<button
						type="button"
						style={{
							position: "absolute",
							inset: 0,
							background: "rgba(0,0,0,0.6)",
						}}
						onClick={() => setMobileSidebarOpen(false)}
						aria-label="Close sidebar"
					/>
					<div
						style={{
							position: "absolute",
							right: 0,
							top: 0,
							bottom: 0,
							width: "85vw",
							maxWidth: "384px",
						}}
						className="bg-bg-panel border-l-2 border-stroke-strong overflow-y-auto"
					>
						<div className="sticky top-0 z-10 flex items-center justify-between border-b border-stroke-subtle bg-bg-panel p-4">
							<span className="font-mono text-xs font-semibold uppercase tracking-wider text-fg-primary">
								Stack Items
							</span>
							<button
								type="button"
								onClick={() => setMobileSidebarOpen(false)}
								className="flex size-8 items-center justify-center text-fg-muted hover:text-fg-primary"
								aria-label="Close"
							>
								✕
							</button>
						</div>
						<ToolsSidebar
							stackId={initialValue?._id}
							tools={state.toolSubscriptions}
							onToolsChange={setToolSubscriptions}
							bundles={state.bundleSubscriptions}
							onBundlesChange={setBundleSubscriptions}
							models={state.modelSubscriptions}
							onModelsChange={setModelSubscriptions}
							resources={state.resources}
							onResourcesChange={setResources}
							projectResources={flattenedProjectResources}
							guestSession={guestSession}
							onSignInRequired={() => setShowSignInDialog(true)}
							mobile
						/>
					</div>
				</div>
			)}

			{/* Mobile FAB to open sidebar */}
			<button
				type="button"
				onClick={() => setMobileSidebarOpen(true)}
				style={{
					position: "fixed",
					bottom: "5rem",
					right: "1rem",
					zIndex: 9998,
				}}
				className="flex items-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-accent-lime-contrast shadow-[4px_4px_0_var(--stroke-strong)] transition-colors hover:bg-accent-lime-strong lg:hidden"
			>
				<Wrench className="size-4" />
				Tools
				{toolCount > 0 && (
					<span className="flex size-5 items-center justify-center bg-accent-lime-contrast text-accent-lime text-[10px] font-bold">
						{toolCount}
					</span>
				)}
			</button>
		</EditorProvider>
	);
}

export type { StackEditorProps };
