import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Send, Save, Users, User } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ToolPicker, type ToolSubscriptionEntry } from "./ToolPicker";
import { BundlePicker, type BundleSubscriptionEntry } from "./BundlePicker";
import { MetadataEditor } from "./MetadataEditor";

interface CreatorProfile {
	_id: Id<"creators">;
	name: string;
	slug: string;
	xHandle?: string;
}

interface StackEditorProps {
	mode: "create" | "edit";
	creator: CreatorProfile;
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

export function StackEditor({ mode, creator, initialData }: StackEditorProps) {
	const navigate = useNavigate();
	const createStack = useMutation(api.stacks.create);
	const updateStack = useMutation(api.stacks.update);
	const updateCreatorProfile = useMutation(api.creators.updateProfile);

	const [oneLiner, setOneLiner] = useState(initialData?.oneLiner ?? "");
	const [description, setDescription] = useState(initialData?.description ?? "");
	const [stackUrl, setStackUrl] = useState(initialData?.stackUrl);
	const [prompts, setPrompts] = useState(initialData?.prompts);
	const [rules, setRules] = useState(initialData?.rules);
	const [skills, setSkills] = useState(initialData?.skills);
	const [mcps, setMcps] = useState(initialData?.mcps);
	const [resources, setResources] = useState<Array<{ label: string; url: string }>>(
		initialData?.resources ?? [],
	);
	const [isTeam, setIsTeam] = useState((initialData?.teamSize ?? 0) > 0);
	const [teamSize, setTeamSize] = useState(initialData?.teamSize ?? 2);
	const [toolSubscriptions, setToolSubscriptions] = useState<ToolSubscriptionEntry[]>(
		initialData?.toolSubscriptions ?? [],
	);
	const [bundleSubscriptions, setBundleSubscriptions] = useState<BundleSubscriptionEntry[]>(
		initialData?.bundleSubscriptions ?? [],
	);
	const [xHandle, setXHandle] = useState(creator.xHandle ?? "");

	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

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
			<div className="max-w-7xl mx-auto px-6 pt-6">
				<button
					type="button"
					onClick={() => navigate({ to: "/" })}
					className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
				>
					<ArrowLeft className="h-4 w-4" />
					Back
				</button>
			</div>

			{/* Header */}
			<header className="max-w-7xl mx-auto px-6 py-8">
				<div className="flex items-start gap-6">
					<div className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
						{creator.name.charAt(0)}
					</div>
					<div className="flex-1">
						<h1 className="text-3xl font-bold text-white mb-2">{creator.name}</h1>
						<div className="flex items-center gap-2 mb-3">
							<span className="text-gray-500">@</span>
							<Input
								value={xHandle}
								onChange={(e) => setXHandle(e.target.value)}
								placeholder="x_handle"
								className="h-7 w-40 text-sm bg-transparent border-gray-700 text-cyan-400 px-1"
							/>
						</div>
						<Input
							value={oneLiner}
							onChange={(e) => setOneLiner(e.target.value)}
							placeholder="One-liner summary of your stack..."
							className="bg-slate-700/30 border-gray-700 text-gray-300 text-sm"
							maxLength={200}
						/>
					</div>

					{/* Team size */}
					<div className="text-right space-y-2">
						<div className="flex items-center gap-2 justify-end">
							<button
								type="button"
								onClick={() => setIsTeam(false)}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
									!isTeam
										? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
										: "text-gray-500 hover:text-gray-300"
								}`}
							>
								<User className="h-3.5 w-3.5" />
								Solo
							</button>
							<button
								type="button"
								onClick={() => setIsTeam(true)}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
									isTeam
										? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
										: "text-gray-500 hover:text-gray-300"
								}`}
							>
								<Users className="h-3.5 w-3.5" />
								Team
							</button>
						</div>
						{isTeam && (
							<div className="flex items-center gap-2 justify-end">
								<Label className="text-xs text-gray-500">Size</Label>
								<Input
									type="number"
									min={2}
									value={teamSize}
									onChange={(e) => setTeamSize(Number(e.target.value))}
									className="h-7 w-16 text-sm text-center bg-slate-700/50 border-gray-600 text-white"
								/>
							</div>
						)}
					</div>
				</div>
			</header>

			{error && (
				<div className="max-w-7xl mx-auto px-6">
					<div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
						{error}
					</div>
				</div>
			)}

			{/* Content sections */}
			<div className="max-w-7xl mx-auto px-6 py-6 space-y-8">
				{/* Tools */}
				<section className="bg-slate-800/30 rounded-xl border border-gray-700/50 p-6">
					<ToolPicker value={toolSubscriptions} onChange={setToolSubscriptions} />
				</section>

				{/* Bundles */}
				<section className="bg-slate-800/30 rounded-xl border border-gray-700/50 p-6">
					<BundlePicker value={bundleSubscriptions} onChange={setBundleSubscriptions} />
				</section>

				{/* Description */}
				<section className="bg-slate-800/30 rounded-xl border border-gray-700/50 p-6">
					<h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
						Description
					</h3>
					<Textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="Describe your stack in detail (supports Markdown)..."
						className="bg-slate-700/30 border-gray-700 text-gray-300 min-h-32"
					/>
				</section>

				{/* Metadata */}
				<section className="bg-slate-800/30 rounded-xl border border-gray-700/50 p-6">
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

				{/* Actions */}
				<div className="flex items-center justify-between py-4 border-t border-gray-700">
					<div className="text-sm text-gray-500">
						{mode === "edit" && initialData?.published && "This stack is published."}
						{mode === "edit" && !initialData?.published && "This stack is a draft."}
					</div>
					<div className="flex gap-3">
						{mode === "edit" && (
							<Button
								type="button"
								variant="outline"
								onClick={() => handleSave(initialData?.published ?? false)}
								disabled={saving}
								className="border-gray-600 text-gray-300"
							>
								<Save className="h-4 w-4" />
								{saving ? "Saving..." : "Save"}
							</Button>
						)}
						<Button
							type="button"
							onClick={() => handleSave(true)}
							disabled={saving || !canPublish}
							className="bg-cyan-600 hover:bg-cyan-700 text-white"
						>
							<Send className="h-4 w-4" />
							{saving
								? "Publishing..."
								: mode === "create"
									? "Publish Stack"
									: "Save & Publish"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
