import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ArrowLeft, CheckCircle, Save, Send } from "lucide-react";
import { useEffect, useRef } from "react";
import { api } from "../../convex/_generated/api";
import { StackEditorSidebar } from "@/components/StackEditorSidebar";
import { SignInDialog } from "@/components/SignInDialog";
import { Button } from "@/components/ui/button";
import { getEditorSectionStatuses } from "@/features/stack-editor/editor-status";
import { sectionOrder } from "@/features/stack-editor/state/editorReducer";
import {
	selectCanPublish,
	selectSaveDraftPublishTarget,
	selectSavePayload,
	selectSaveValidationError,
} from "@/features/stack-editor/state/editorSelectors";
import { useEditorState } from "@/features/stack-editor/state/useEditorState";
import { BundlesSection } from "@/features/stack-editor/sections/BundlesSection";
import { DescriptionSection } from "@/features/stack-editor/sections/DescriptionSection";
import { ProfileSection } from "@/features/stack-editor/sections/ProfileSection";
import { SettingsSection } from "@/features/stack-editor/sections/SettingsSection";
import { ToolsSection } from "@/features/stack-editor/sections/ToolsSection";
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
	const {
		state,
		setActiveSection,
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
	const observerRef = useRef<IntersectionObserver | null>(null);

	useEffect(() => {
		observerRef.current = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const sectionId = entry.target.id.replace("section-", "") as (typeof sectionOrder)[number];
						setActiveSection(sectionId);
					}
				});
			},
			{ threshold: 0.3, rootMargin: "-100px 0px -50% 0px" },
		);

		const sections = document.querySelectorAll('[id^="section-"]');
		sections.forEach((section) => observerRef.current?.observe(section));

		return () => observerRef.current?.disconnect();
	}, []);

	const canPublish = selectCanPublish(state);
	const sectionStatuses = getEditorSectionStatuses({
		oneLiner: state.oneLiner,
		isTeam: state.isTeam,
		teamSize: state.teamSize,
		toolSubscriptions: state.toolSubscriptions,
		bundleSubscriptions: state.bundleSubscriptions,
		description: state.description,
		stackUrl: state.stackUrl,
		prompts: state.prompts,
		rules: state.rules,
		skills: state.skills,
		mcps: state.mcps,
		resources: state.resources,
	});

	const handleSave = async (publish: boolean) => {
		const validationError = selectSaveValidationError(state, publish);

		if (validationError) {
			setError(validationError);
			return;
		}

		if (guestSession && publish) {
			setShowSignInDialog(true);
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

	return (
		<div className="min-h-screen bg-bg-canvas">
			{/* Grid background */}
			<div 
				className="fixed inset-0 pointer-events-none z-0 opacity-10"
				style={{
					backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)',
					backgroundSize: '4rem 4rem'
				}}
			/>
			<SignInDialog
				isOpen={state.showSignInDialog}
				onClose={() => setShowSignInDialog(false)}
				message="Please sign in to publish your stack. Your work is saved locally and will be available when you return."
			/>
			<header className="sticky top-14 z-40 bg-bg-canvas/80 backdrop-blur-xl border-b border-zinc-800">
				<div className=" max-w-7xl mx-auto py-4 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							onClick={() => navigate({ to: "/" })}
							className="text-zinc-400 hover:text-accent-lime hover:bg-transparent p-0 h-auto font-mono text-xs uppercase tracking-wider"
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back
						</Button>
					</div>
					<div className="flex items-center gap-3">
						{mode === "edit" && initialValue?.published && (
							<div className="flex items-center gap-2 text-accent-lime text-xs font-mono uppercase">
								<CheckCircle className="h-4 w-4" />
								Published
							</div>
						)}
						{mode === "edit" && initialValue?.published && (
							<Button
								type="button"
								variant="outline"
								onClick={() => handleSave(false)}
								disabled={state.saving}
								className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-mono text-xs uppercase tracking-wider"
							>
								Unpublish
							</Button>
						)}
						<Button
							type="button"
							variant="ghost"
							onClick={() => handleSave(saveDraftPublishTarget)}
							disabled={state.saving}
							className="border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-fg-primary font-mono text-xs uppercase tracking-wider"
						>
							<Save className="h-4 w-4 mr-2" />
							{state.saving ? "Saving..." : "Save Draft"}
						</Button>
						<Button
							type="button"
							onClick={() => handleSave(true)}
							disabled={state.saving || !canPublish}
							className="bg-accent-lime hover:bg-accent-lime-strong text-accent-lime-contrast font-mono text-xs uppercase tracking-wider font-bold"
						>
							<Send className="h-4 w-4 mr-2" />
							{state.saving ? "Publishing..." : "Publish"}
						</Button>
					</div>
				</div>
			</header>

			<div className="flex relative z-10">
				<StackEditorSidebar activeSection={state.activeSection} sectionStatuses={sectionStatuses} />
				<main className="flex-1 max-w-3xl mx-auto px-6 md:px-12 py-12 space-y-12">
					{/* Page Header */}
					<div className="border-b border-zinc-800 pb-6">
						<div className="font-mono text-accent-lime text-xs mb-2">// CONFIGURATION</div>
						<h1 className="text-4xl font-black uppercase tracking-tighter text-fg-primary">
							{mode === "create" ? "Profile Details" : "Edit Stack"}
						</h1>
					</div>

					{state.error && (
						<div className="bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 font-mono">
							{state.error}
						</div>
					)}

					<ProfileSection
						creator={actor}
						oneLiner={state.oneLiner}
						onOneLinerChange={setOneLiner}
						xHandle={state.xHandle}
						onXHandleChange={setXHandle}
						isTeam={state.isTeam}
						onIsTeamChange={setIsTeam}
						teamSize={state.teamSize}
						onTeamSizeChange={setTeamSize}
						status={sectionStatuses.profile}
						isActive={state.activeSection === "profile"}
					/>
					<ToolsSection
						value={state.toolSubscriptions}
						onChange={setToolSubscriptions}
						status={sectionStatuses.tools}
						isActive={state.activeSection === "tools"}
					/>
					<BundlesSection
						value={state.bundleSubscriptions}
						onChange={setBundleSubscriptions}
						status={sectionStatuses.bundles}
						isActive={state.activeSection === "bundles"}
					/>
					<DescriptionSection
						value={state.description}
						onChange={setDescription}
						status={sectionStatuses.description}
						isActive={state.activeSection === "description"}
					/>
					<SettingsSection
						stackUrl={state.stackUrl}
						prompts={state.prompts}
						rules={state.rules}
						skills={state.skills}
						mcps={state.mcps}
						resources={state.resources}
						onUpdate={updateMetadata}
						status={sectionStatuses.settings}
						isActive={state.activeSection === "settings"}
					/>
				</main>
			</div>
		</div>
	);
}

export type { StackEditorProps };
