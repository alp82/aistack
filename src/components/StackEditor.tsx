import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle, Save, Send } from "lucide-react";
import { useCallback, useRef } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ModelSubscriptionEntry } from "@/features/stack-editor/types";
import { SignInDialog } from "@/components/SignInDialog";
import {
	selectSavePayload,
	selectSaveValidationError,
} from "@/features/stack-editor/state/editorSelectors";
import { useEditorState } from "@/features/stack-editor/state/useEditorState";
import { EditorProvider } from "@/features/stack-editor/context/EditorContext";
import { DetailsStep } from "@/features/stack-editor/components/DetailsStep";
import { WorkflowStep } from "@/features/stack-editor/components/WorkflowStep";
import { ToolsSidebar } from "@/features/stack-editor/components/ToolsSidebar";
import type {
	CreatorProfile,
	StackEditorInitialValue,
	StackEditorMode,
} from "@/features/stack-editor/types";

type StackEditorProps = {
	mode: StackEditorMode;
	actor: CreatorProfile;
	guestSession?: boolean;
	initialValue?: StackEditorInitialValue;
	defaultAvatarUrl?: string;
};

export function StackEditor({
	mode,
	actor,
	initialValue,
	guestSession = false,
	defaultAvatarUrl,
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
		setInstructions,
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
		setProjectPageUrl,
		setAvatarUrl,
	} = useEditorState({
		mode,
		guestSession,
		actor,
		initialValue,
	});

	const allTools = useQuery(api.tools.listAll) ?? [];
	const allModels = useQuery(api.models.listAll) ?? [];

	// Use refs to avoid stale closures in the callback passed to the editor
	const stateRef = useRef(state);
	const allToolsRef = useRef(allTools);
	const allModelsRef = useRef(allModels);
	stateRef.current = state;
	allToolsRef.current = allTools;
	allModelsRef.current = allModels;

	const handleToolAdded = useCallback((tool: { _id: string; name: string; iconUrl?: string | null }) => {
		const currentState = stateRef.current;
		const currentAllTools = allToolsRef.current;

		// Check if tool is already in the list
		if (currentState.toolSubscriptions.some((t) => t.toolId === tool._id)) {
			return;
		}

		// Find the full tool data
		const fullTool = currentAllTools.find((t) => t._id === tool._id);
		if (!fullTool) return;

		const defaultTier = fullTool.tiers.find((t) => t.isDefault) ?? fullTool.tiers[0];
		if (!defaultTier) return;

		setToolSubscriptions([
			...currentState.toolSubscriptions,
			{
				toolId: fullTool._id as Id<"tools">,
				toolName: fullTool.name,
				toolSlug: fullTool.slug,
				toolCategory: fullTool.category,
				toolIconUrl: fullTool.iconUrl ?? undefined,
				tierId: defaultTier.tierId,
				kind: "main",
				primaryUsageLabel: defaultTier.name,
				price: {
					pricingType: defaultTier.pricing.pricingType,
					fixed: defaultTier.pricing.pricingType === "fixed" && defaultTier.pricing.fixed ? {
						currency: defaultTier.pricing.fixed.currency,
						amount: defaultTier.pricing.fixed.amount,
						period: defaultTier.pricing.fixed.period,
					} : undefined,
				},
				priceKind: "regular",
			},
		]);
	}, [setToolSubscriptions]);

	const handleModelAdded = useCallback((model: { _id: string; name: string; provider: string; iconUrl?: string | null }) => {
		const currentState = stateRef.current;
		const currentAllModels = allModelsRef.current;

		// Check if model is already in the list
		if (currentState.modelSubscriptions.some((m) => m.modelId === model._id)) {
			return;
		}

		// Find the full model data
		const fullModel = currentAllModels.find((m) => m._id === model._id);
		if (!fullModel) return;

		const entry: ModelSubscriptionEntry = {
			modelId: fullModel._id as Id<"models">,
			modelName: fullModel.name,
			modelSlug: fullModel.slug,
			modelProvider: fullModel.provider,
			modelCategory: fullModel.category,
			modelIconUrl: fullModel.iconUrl,
			role: "primary",
		};

		setModelSubscriptions([...currentState.modelSubscriptions, entry]);
	}, [setModelSubscriptions]);

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

			if (mode === "create") {
				const result = await createStack(payload);
				navigate({ to: "/stacks/$slug", params: { slug: result.slug } });
				return;
			}

			if (initialValue) {
				await updateStack({
					stackId: initialValue._id,
					...payload,
				});
				navigate({
					to: "/stacks/$slug",
					params: { slug: initialValue.slug },
				});
			}
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Failed to save stack");
		} finally {
			setSaving(false);
		}
	};

	return (
		<EditorProvider>
			<div className="bg-bg-canvas">
				{/* Grid background */}
				<div
					className="pointer-events-none fixed inset-0 z-0 opacity-10"
					style={{
						backgroundImage:
							"linear-gradient(to right, var(--stroke-subtle) 1px, transparent 1px), linear-gradient(to bottom, var(--stroke-subtle) 1px, transparent 1px)",
						backgroundSize: "4rem 4rem",
					}}
				/>
				<SignInDialog
					isOpen={state.showSignInDialog}
					onClose={() => setShowSignInDialog(false)}
					message="Please sign in to publish your stack. Your work is saved locally and will be available when you return."
				/>
				<div className="relative z-10 mx-auto max-w-content flex flex-col">
					<div className="flex">
						<main className="flex-1 px-6 py-8">
							{/* Sticky Header with Title and Actions */}
							<header className="sticky top-12 mb-12 py-4 z-20 bg-bg-canvas/95 backdrop-blur-sm border-b border-stroke-subtle">
								<div className="flex items-center justify-between gap-4">
									<h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase text-fg-primary">
										{mode === "create" ? "Create Stack" : "Edit Stack"}
									</h1>

									<div className="flex items-center gap-3 flex-shrink-0">
										{initialValue?.published ? (
											<>
												{/* Published/Unpublish Button - outline green with checkmark */}
												<button
													type="button"
													onClick={() => handleSave(false)}
													disabled={state.saving}
													className="group inline-flex items-center gap-2 px-4 py-2 border-2 border-accent-lime font-mono text-xs font-bold uppercase tracking-wider text-accent-lime transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50 cursor-pointer"
												>
													<CheckCircle className="size-4 group-hover:hidden" />
													<span className="hidden group-hover:inline">✕</span>
													<span className="relative">
														<span className="group-hover:hidden">Published</span>
														<span className="hidden group-hover:inline">Unpublish</span>
													</span>
												</button>

												{/* Save Button - lime filled */}
												<button
													type="button"
													onClick={() => handleSave(true)}
													disabled={state.saving}
													className="inline-flex items-center gap-2 px-4 py-2 border-2 border-accent-lime bg-accent-lime font-mono text-xs font-bold uppercase tracking-wider text-accent-lime-contrast hover:bg-accent-lime-strong transition-colors disabled:opacity-50 cursor-pointer"
												>
													<Save className="size-4" />
													{state.saving ? "Saving..." : "Save"}
												</button>
											</>
										) : (
											<>
												{/* Save Draft Button - outline */}
												<button
													type="button"
													onClick={() => handleSave(false)}
													disabled={state.saving}
													className="inline-flex items-center gap-2 px-4 py-2 border-2 border-stroke-strong font-mono text-xs uppercase tracking-wider text-fg-muted hover:border-accent-lime hover:text-fg-primary transition-colors disabled:opacity-50 cursor-pointer"
												>
													<Save className="size-4" />
													{state.saving ? "Saving..." : "Save Draft"}
												</button>

												{/* Publish Button - lime filled */}
												<button
													type="button"
													onClick={() => handleSave(true)}
													disabled={state.saving}
													className="inline-flex items-center gap-2 px-4 py-2 border-2 border-accent-lime bg-accent-lime font-mono text-xs font-bold uppercase tracking-wider text-accent-lime-contrast hover:bg-accent-lime-strong transition-colors disabled:opacity-50 cursor-pointer"
												>
													<Send className="size-4" />
													{state.saving ? "Publishing..." : "Publish"}
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
								projectPageUrl={state.projectPageUrl}
								onProjectPageUrlChange={setProjectPageUrl}
								avatarUrl={state.avatarUrl}
								onAvatarUrlChange={setAvatarUrl}
								defaultAvatarUrl={defaultAvatarUrl}
								isTeam={state.isTeam}
								onIsTeamChange={setIsTeam}
								teamSize={state.teamSize}
								onTeamSizeChange={setTeamSize}
							/>

							{/* HR between steps */}
							<hr className="my-12 border-stroke-subtle" />

							{/* Workflow Section */}
							<div>
								<WorkflowStep
									description={state.description}
									onDescriptionChange={setDescription}
									onToolAdded={handleToolAdded}
									onModelAdded={handleModelAdded}
								/>
							</div>
						</main>
						<ToolsSidebar
							tools={state.toolSubscriptions}
							onToolsChange={setToolSubscriptions}
							bundles={state.bundleSubscriptions}
							onBundlesChange={setBundleSubscriptions}
							models={state.modelSubscriptions}
							onModelsChange={setModelSubscriptions}
							instructions={state.instructions}
							onInstructionsChange={setInstructions}
							guestSession={guestSession}
							onSignInRequired={() => setShowSignInDialog(true)}
						/>
					</div>
				</div>
			</div>
		</EditorProvider>
	);
}

export type { StackEditorProps };
