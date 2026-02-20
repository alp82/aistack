import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ArrowLeft, CheckCircle, Save, Send } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { SignInDialog } from "@/components/SignInDialog";
import {
	selectSaveDraftPublishTarget,
	selectSavePayload,
	selectSaveValidationError,
} from "@/features/stack-editor/state/editorSelectors";
import { useEditorState } from "@/features/stack-editor/state/useEditorState";
import { DetailsStep } from "@/features/stack-editor/components/DetailsStep";
import { ToolsStep } from "@/features/stack-editor/components/ToolsStep";
import { WorkflowStep } from "@/features/stack-editor/components/WorkflowStep";
import { WizardSidebar, steps, type WizardStep } from "@/features/stack-editor/components/WizardSidebar";
import { WizardNavigation } from "@/features/stack-editor/components/WizardNavigation";
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
};

export function StackEditor({
	mode,
	actor,
	initialValue,
	guestSession = false,
}: StackEditorProps) {
	const navigate = useNavigate();
	const createStack = useMutation(api.stacks.create);
	const updateStack = useMutation(api.stacks.update);
	const updateCreatorProfile = useMutation(api.creators.updateProfile);
	const [currentStep, setCurrentStep] = useState<WizardStep>("details");

	const {
		state,
		setBundleSubscriptions,
		setDescription,
		setError,
		setIsTeam,
		setOneLiner,
		setSaving,
		setShowSignInDialog,
		setTeamSize,
		setToolSubscriptions,
		setXHandle,
		updateMetadata,
	} = useEditorState({
		mode,
		guestSession,
		actor,
		initialValue,
	});

	const handleStepClick = (step: WizardStep) => {
		setCurrentStep(step);
	};

	const handlePrevious = () => {
		const currentIndex = steps.findIndex((s) => s.id === currentStep);
		if (currentIndex > 0) {
			setCurrentStep(steps[currentIndex - 1].id);
		}
	};

	const handleNext = () => {
		const currentIndex = steps.findIndex((s) => s.id === currentStep);
		if (currentIndex < steps.length - 1) {
			setCurrentStep(steps[currentIndex + 1].id);
		}
	};

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

	const saveDraftPublishTarget = selectSaveDraftPublishTarget(state, mode, initialValue);

	const renderCurrentStep = () => {
		switch (currentStep) {
			case "details":
				return (
					<DetailsStep
						creator={actor}
						oneLiner={state.oneLiner}
						onOneLinerChange={setOneLiner}
						xHandle={state.xHandle}
						onXHandleChange={setXHandle}
						isTeam={state.isTeam}
						onIsTeamChange={setIsTeam}
						teamSize={state.teamSize}
						onTeamSizeChange={setTeamSize}
					/>
				);
			case "tools":
				return (
					<ToolsStep
						toolSubscriptions={state.toolSubscriptions}
						onToolsChange={setToolSubscriptions}
						bundleSubscriptions={state.bundleSubscriptions}
						onBundlesChange={setBundleSubscriptions}
						guestSession={guestSession}
						onSignInRequired={() => setShowSignInDialog(true)}
					/>
				);
			case "workflow":
				return (
					<WorkflowStep
						description={state.description}
						onDescriptionChange={setDescription}
						stackUrl={state.stackUrl}
						prompts={state.prompts}
						rules={state.rules}
						skills={state.skills}
						mcps={state.mcps}
						models={state.models}
						resources={state.resources}
						onMetadataUpdate={updateMetadata}
					/>
				);
		}
	};

	return (
		<div className="min-h-screen bg-bg-canvas">
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
			<div className="relative z-10 mx-auto max-w-content flex">
				<WizardSidebar
					currentStep={currentStep}
					onStepClick={handleStepClick}
				/>
				<main className="flex-1 max-w-4xl px-6 py-24 md:px-12">
					{/* Page Header with Actions */}
					<div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-8 border-b-2 border-stroke-strong pb-8">
						<div>
							<button
								type="button"
								onClick={() => navigate({ to: "/" })}
								className="inline-flex items-center gap-2 font-mono text-xs text-fg-muted transition-colors hover:text-accent-lime mb-6 group"
							>
								<ArrowLeft className="size-3.5 group-hover:-translate-x-1 transition-transform" />
								Back to home
							</button>
							<div className="font-mono text-accent-lime mb-4 flex items-center gap-4 text-sm">
								<span>// SHARE_YOUR_STACK</span>
								<span className="h-px w-12 bg-accent-lime/50" />
								<span>{mode === "edit" ? "EDIT" : "NEW"}</span>
							</div>
							<h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9] text-fg-primary">
								{mode === "edit" ? "EDIT STACK" : "CREATE STACK"}
							</h1>
						</div>

						<div className="flex items-center gap-3 flex-shrink-0">
							{mode === "edit" && initialValue?.published && (
								<div className="flex items-center gap-2 font-mono text-xs uppercase text-accent-lime">
									<CheckCircle className="size-4" />
									Published
								</div>
							)}
							{mode === "edit" && initialValue?.published && (
								<button
									type="button"
									onClick={() => handleSave(false)}
									disabled={state.saving}
									className="px-4 py-3 border-2 border-stroke-strong font-mono text-xs uppercase tracking-wider text-fg-muted hover:border-accent-lime hover:text-fg-primary transition-colors disabled:opacity-50"
								>
									Unpublish
								</button>
							)}
							<button
								type="button"
								onClick={() => handleSave(saveDraftPublishTarget)}
								disabled={state.saving}
								className="inline-flex items-center gap-2 px-4 py-3 border-2 border-stroke-strong font-mono text-xs uppercase tracking-wider text-fg-muted hover:border-accent-lime hover:text-fg-primary transition-colors disabled:opacity-50"
							>
								<Save className="size-4" />
								{state.saving ? "Saving..." : "Save Draft"}
							</button>
							<button
								type="button"
								onClick={() => handleSave(true)}
								disabled={state.saving}
								className="inline-flex items-center gap-2 px-4 py-3 border-2 border-accent-lime bg-accent-lime font-mono text-xs font-bold uppercase tracking-wider text-accent-lime-contrast hover:bg-accent-lime-strong transition-colors disabled:opacity-50"
							>
								<Send className="size-4" />
								{state.saving ? "Publishing..." : "Publish"}
							</button>
						</div>
					</div>

					{state.error && (
						<div className="mb-8 border-2 border-destructive/30 bg-destructive/10 p-4 font-mono text-sm text-destructive">
							{state.error}
						</div>
					)}

					{renderCurrentStep()}

					<div className="mt-12">
						<WizardNavigation
							currentStep={currentStep}
							onPrevious={handlePrevious}
							onNext={handleNext}
						/>
					</div>
				</main>
			</div>
		</div>
	);
}

export type { StackEditorProps };
