import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { ArrowLeft, CheckCircle, Save, Send, Twitter } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { BundlePicker, type BundleSubscriptionEntry } from "./BundlePicker";
import { MetadataEditor } from "./MetadataEditor";
import { SignInDialog } from "./SignInDialog";
import { StackEditorSidebar } from "./StackEditorSidebar";
import { ToolPicker, type ToolSubscriptionEntry } from "./ToolPicker";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface CreatorProfile {
	_id: Id<"creators">;
	name: string;
	slug: string;
	xHandle?: string;
}

interface StackEditorProps {
	mode: "create" | "edit";
	creator: CreatorProfile;
	isGuest?: boolean;
	initialData?: {
		_id: Id<"stacks">;
		slug: string;
		oneLiner: string;
		description?: string;
		stackUrl?: string;
		prompts?: boolean;
		rules?: boolean;
		skills?: boolean;
		mcps?: boolean;
		resources?: Array<{ label: string; url: string }>;
		teamSize?: number;
		published: boolean;
		toolSubscriptions: ToolSubscriptionEntry[];
		bundleSubscriptions: BundleSubscriptionEntry[];
	};
}

export function StackEditor({
	mode,
	creator,
	initialData,
	isGuest = false,
}: StackEditorProps) {
	const navigate = useNavigate();
	const createStack = useMutation(api.stacks.create);
	const updateStack = useMutation(api.stacks.update);
	const updateCreatorProfile = useMutation(api.creators.updateProfile);

	const [oneLiner, setOneLiner] = useState(initialData?.oneLiner ?? "");
	const [description, setDescription] = useState(
		initialData?.description ?? "",
	);
	const [stackUrl, setStackUrl] = useState(initialData?.stackUrl);
	const [prompts, setPrompts] = useState(initialData?.prompts);
	const [rules, setRules] = useState(initialData?.rules);
	const [skills, setSkills] = useState(initialData?.skills);
	const [mcps, setMcps] = useState(initialData?.mcps);
	const [resources, setResources] = useState<
		Array<{ label: string; url: string }>
	>(initialData?.resources ?? []);
	const [isTeam, setIsTeam] = useState((initialData?.teamSize ?? 0) > 0);
	const [teamSize, setTeamSize] = useState(initialData?.teamSize ?? 2);
	const [toolSubscriptions, setToolSubscriptions] = useState<
		ToolSubscriptionEntry[]
	>(initialData?.toolSubscriptions ?? []);
	const [bundleSubscriptions, setBundleSubscriptions] = useState<
		BundleSubscriptionEntry[]
	>(initialData?.bundleSubscriptions ?? []);
	const [xHandle, setXHandle] = useState(creator.xHandle ?? "");

	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [activeSection, setActiveSection] = useState("profile");
	const [showSignInDialog, setShowSignInDialog] = useState(false);
	const observerRef = useRef<IntersectionObserver | null>(null);

	// Load from localStorage for guests
	useEffect(() => {
		if (isGuest && mode === "create") {
			const saved = localStorage.getItem("guestStack");
			if (saved) {
				try {
					const data = JSON.parse(saved);
					if (data.oneLiner) setOneLiner(data.oneLiner);
					if (data.description) setDescription(data.description);
					if (data.stackUrl) setStackUrl(data.stackUrl);
					if (data.prompts !== undefined) setPrompts(data.prompts);
					if (data.rules !== undefined) setRules(data.rules);
					if (data.skills !== undefined) setSkills(data.skills);
					if (data.mcps !== undefined) setMcps(data.mcps);
					if (data.resources) setResources(data.resources);
					if (data.isTeam !== undefined) setIsTeam(data.isTeam);
					if (data.teamSize) setTeamSize(data.teamSize);
					if (data.toolSubscriptions)
						setToolSubscriptions(data.toolSubscriptions);
					if (data.bundleSubscriptions)
						setBundleSubscriptions(data.bundleSubscriptions);
					if (data.xHandle) setXHandle(data.xHandle);
				} catch (e) {
					console.error("Failed to load guest stack from localStorage", e);
				}
			}
		}
	}, [isGuest, mode]);

	// Auto-save to localStorage for guests
	useEffect(() => {
		if (isGuest) {
			const data = {
				oneLiner,
				description,
				stackUrl,
				prompts,
				rules,
				skills,
				mcps,
				resources,
				isTeam,
				teamSize,
				toolSubscriptions,
				bundleSubscriptions,
				xHandle,
			};
			localStorage.setItem("guestStack", JSON.stringify(data));
		}
	}, [
		isGuest,
		oneLiner,
		description,
		stackUrl,
		prompts,
		rules,
		skills,
		mcps,
		resources,
		isTeam,
		teamSize,
		toolSubscriptions,
		bundleSubscriptions,
		xHandle,
	]);

	useEffect(() => {
		observerRef.current = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const sectionId = entry.target.id.replace("section-", "");
						setActiveSection(sectionId);
					}
				});
			},
			{ threshold: 0.3, rootMargin: "-100px 0px -50% 0px" },
		);

		const sections = document.querySelectorAll('[id^="section-"]');
		sections.forEach((section) => observerRef.current?.observe(section));

		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
		};
	}, []);

	const canPublish = oneLiner.trim().length > 0 && toolSubscriptions.length > 0;

	const buildPayload = useCallback(
		(published: boolean) => ({
			oneLiner: oneLiner.trim(),
			description: description.trim() || undefined,
			stackUrl: stackUrl?.trim() || undefined,
			prompts,
			rules,
			skills,
			mcps,
			resources: resources.length > 0 ? resources : undefined,
			teamSize: isTeam ? teamSize : undefined,
			toolSubscriptions: toolSubscriptions.map((t) => ({
				toolId: t.toolId,
				tierId: t.tierId,
				kind: t.kind,
				primaryUsageLabel: t.primaryUsageLabel,
				price: t.price,
				priceKind: t.priceKind,
				bundleSlug: t.bundleSlug,
				notes: t.notes,
			})),
			bundleSubscriptions:
				bundleSubscriptions.length > 0
					? bundleSubscriptions.map((b) => ({
							bundleId: b.bundleId,
							tierId: b.tierId,
							notes: b.notes,
						}))
					: undefined,
			published,
		}),
		[
			oneLiner,
			description,
			stackUrl,
			prompts,
			rules,
			skills,
			mcps,
			resources,
			isTeam,
			teamSize,
			toolSubscriptions,
			bundleSubscriptions,
		],
	);

	const handleSave = async (publish: boolean) => {
		if (!oneLiner.trim()) {
			setError("One-liner summary is required");
			return;
		}
		if (publish && toolSubscriptions.length === 0) {
			setError("Add at least one tool before publishing");
			return;
		}

		// Guest users must sign in to publish
		if (isGuest && publish) {
			setShowSignInDialog(true);
			return;
		}

		// Guest users can only save to localStorage
		if (isGuest) {
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
			if (xHandle !== (creator.xHandle ?? "")) {
				await updateCreatorProfile({
					xHandle: xHandle.trim() || undefined,
				});
			}

			if (mode === "create") {
				const result = await createStack(buildPayload(publish));
				navigate({ to: "/stacks/$slug", params: { slug: result.slug } });
			} else if (initialData) {
				await updateStack({
					stackId: initialData._id,
					...buildPayload(publish),
				});
				navigate({
					to: "/stacks/$slug",
					params: { slug: initialData.slug },
				});
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save stack");
		} finally {
			setSaving(false);
		}
	};

	const handleMetadataUpdate = (updates: {
		stackUrl?: string;
		prompts?: boolean;
		rules?: boolean;
		skills?: boolean;
		mcps?: boolean;
		resources?: Array<{ label: string; url: string }>;
	}) => {
		if (updates.stackUrl !== undefined) setStackUrl(updates.stackUrl);
		if (updates.prompts !== undefined) setPrompts(updates.prompts);
		if (updates.rules !== undefined) setRules(updates.rules);
		if (updates.skills !== undefined) setSkills(updates.skills);
		if (updates.mcps !== undefined) setMcps(updates.mcps);
		if (updates.resources !== undefined) setResources(updates.resources);
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			<SignInDialog
				isOpen={showSignInDialog}
				onClose={() => setShowSignInDialog(false)}
				message="Please sign in to publish your stack. Your work is saved locally and will be available when you return."
			/>
			{/* Top Header with Actions */}
			<header className="sticky top-16 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-gray-800">
				<div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button
							variant="ghost"
							onClick={() => navigate({ to: "/" })}
							className="text-gray-400 hover:text-white hover:bg-transparent p-0 h-auto"
						>
							<ArrowLeft className="h-4 w-4" />
							Back
						</Button>
						<h1 className="text-xl font-bold text-white">Editing Stack</h1>
					</div>
					<div className="flex items-center gap-3">
						{mode === "edit" && initialData?.published && (
							<div className="flex items-center gap-2 text-green-400 text-sm">
								<CheckCircle className="h-4 w-4" />
								Published
							</div>
						)}
						{mode === "edit" && initialData?.published && (
							<Button
								type="button"
								variant="outline"
								onClick={() => handleSave(false)}
								disabled={saving}
								className="border-gray-600 text-gray-300 hover:bg-slate-800"
							>
								Unpublish
							</Button>
						)}
						<Button
							type="button"
							variant="ghost"
							onClick={() =>
								handleSave(
									mode === "edit" ? (initialData?.published ?? false) : false,
								)
							}
							disabled={saving}
							className="border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
						>
							<Save className="h-4 w-4" />
							{saving ? "Saving..." : "Save Draft"}
						</Button>
						<Button
							type="button"
							onClick={() => handleSave(true)}
							disabled={saving || !canPublish}
							className="bg-cyan-600 hover:bg-cyan-700 text-white"
						>
							<Send className="h-4 w-4" />
							{saving ? "Publishing..." : "Save & Publish"}
						</Button>
					</div>
				</div>
			</header>

			{/* Main Content with Sidebar */}
			<div className="flex">
				<StackEditorSidebar activeSection={activeSection} />
				<main className="flex-1 max-w-5xl mx-auto px-6 py-8 space-y-8">
					{error && (
						<div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 mb-6">
							{error}
						</div>
					)}

					{/* Profile & Bio Section */}
					<section
						id="section-profile"
						className="bg-slate-800/30 rounded-xl border border-gray-700/50 p-6"
					>
						<h2 className="text-xl font-bold text-white mb-6">
							Profile Details
						</h2>
						<div className="flex items-start gap-6 mb-6">
							<div className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
								{creator.name.charAt(0)}
							</div>
							<div className="flex-1 space-y-4">
								<div className="flex items-center justify-between">
									<div>
										<Label className="text-sm text-gray-400 mb-1">
											Display Name
										</Label>
										<div className="text-lg font-semibold text-white">
											{creator.name}
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Button
											type="button"
											onClick={() => setIsTeam(false)}
											className={`rounded-lg ${
												!isTeam
													? "bg-cyan-600 text-white hover:bg-cyan-700"
													: "bg-slate-700 text-gray-400 hover:text-white hover:bg-slate-600"
											}`}
										>
											Solo
										</Button>
										<Button
											type="button"
											onClick={() => setIsTeam(true)}
											className={`rounded-lg ${
												isTeam
													? "bg-cyan-600 text-white hover:bg-cyan-700"
													: "bg-slate-700 text-gray-400 hover:text-white hover:bg-slate-600"
											}`}
										>
											Team
										</Button>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label className="text-sm text-gray-400 mb-2">Handle</Label>
										<div className="flex items-center gap-2">
											<div className="flex items-center gap-1 text-gray-500">
												<Twitter className="h-4 w-4" />
												<span>@</span>
											</div>
											<Input
												value={xHandle}
												onChange={(e) => setXHandle(e.target.value)}
												placeholder="alperortac"
												className="flex-1 bg-slate-700/50 border-gray-600 text-white"
											/>
										</div>
									</div>
									{isTeam && (
										<div>
											<Label className="text-sm text-gray-400 mb-2">
												Team Size
											</Label>
											<Input
												type="number"
												min={2}
												value={teamSize}
												onChange={(e) => setTeamSize(Number(e.target.value))}
												className="bg-slate-700/50 border-gray-600 text-white"
											/>
										</div>
									)}
								</div>
							</div>
						</div>
						<div>
							<Label className="text-sm text-gray-400 mb-2">Short Bio</Label>
							<Input
								value={oneLiner}
								onChange={(e) => setOneLiner(e.target.value)}
								placeholder="What is this stack about?"
								className="bg-slate-700/50 border-gray-600 text-white"
								maxLength={200}
							/>
							<p className="text-xs text-gray-500 mt-1">
								Visible on search results and stack header.
							</p>
						</div>
					</section>

					{/* Tools Section */}
					<section
						id="section-tools"
						className="bg-slate-800/30 rounded-xl border border-gray-700/50 p-6"
					>
						<ToolPicker
							value={toolSubscriptions}
							onChange={setToolSubscriptions}
						/>
					</section>

					{/* Bundles Section */}
					<section
						id="section-bundles"
						className="bg-slate-800/30 rounded-xl border border-gray-700/50 p-6"
					>
						<BundlePicker
							value={bundleSubscriptions}
							onChange={setBundleSubscriptions}
						/>
					</section>

					{/* Description Section */}
					<section
						id="section-description"
						className="bg-slate-800/30 rounded-xl border border-gray-700/50 p-6"
					>
						<h2 className="text-xl font-bold text-white mb-4">
							Readme / Description
						</h2>
						<Textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="## This is my stack\n\nVery **good**."
							className="bg-slate-700/50 border-gray-600 text-white min-h-64 font-mono text-sm"
						/>
						<p className="text-xs text-gray-500 mt-2">Markdown supported</p>
					</section>

					{/* Settings Section */}
					<section
						id="section-settings"
						className="bg-slate-800/30 rounded-xl border border-gray-700/50 p-6"
					>
						<h2 className="text-xl font-bold text-white mb-6">Settings</h2>
						<MetadataEditor
							stackUrl={stackUrl}
							prompts={prompts}
							rules={rules}
							skills={skills}
							mcps={mcps}
							resources={resources}
							onUpdate={handleMetadataUpdate}
						/>
					</section>
				</main>
			</div>
		</div>
	);
}
