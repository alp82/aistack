import { useMutation, useQuery } from "convex/react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog } from "./ui/Dialog";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

type ModelCategory =
	| "language"
	| "coding"
	| "reasoning"
	| "vision"
	| "audio"
	| "image"
	| "video"
	| "embedding"
	| "other";

const categories: { value: ModelCategory; label: string }[] = [
	{ value: "language", label: "Language" },
	{ value: "coding", label: "Coding" },
	{ value: "reasoning", label: "Reasoning" },
	{ value: "vision", label: "Vision" },
	{ value: "audio", label: "Audio" },
	{ value: "image", label: "Image Generation" },
	{ value: "video", label: "Video" },
	{ value: "embedding", label: "Embedding" },
	{ value: "other", label: "Other" },
];

const providers = [
	"OpenAI",
	"Anthropic",
	"Google",
	"Meta",
	"Mistral",
	"xAI",
	"DeepSeek",
	"Cohere",
	"Other",
];

export interface ModelData {
	_id: Id<"models">;
	name: string;
	provider: string;
	category: ModelCategory;
	websiteUrl?: string;
	iconUrl?: string;
	contextWindow?: number;
	description?: string;
}

interface AddModelFormProps {
	onCancel: () => void;
	onModelCreated: (modelId: string, name?: string) => void;
	editModel?: ModelData;
	onModelUpdated?: (modelId: Id<"models">) => void;
	isAdmin?: boolean;
}

export function AddModelForm({
	onCancel,
	onModelCreated,
	editModel,
	onModelUpdated,
	isAdmin,
}: AddModelFormProps) {
	const createModel = useMutation(api.models.create);
	const updateModelAdmin = useMutation(api.admin.updateModelFull);
	const isEditMode = !!editModel;
	const [name, setName] = useState("");
	const [provider, setProvider] = useState("");
	const [category, setCategory] = useState<ModelCategory | "">("");
	const [websiteUrl, setWebsiteUrl] = useState("");
	const [iconUrl, setIconUrl] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [showDetails, setShowDetails] = useState(false);
	const [validationErrors, setValidationErrors] = useState<{
		websiteUrl?: boolean;
		iconUrl?: boolean;
		category?: boolean;
	}>({});

	// Query provider data for auto-population
	const providerData = useQuery(
		api.models.getFirstByProvider,
		provider && provider !== "Other" ? { provider } : "skip",
	);

	// Clear icon and URL when selecting "Other" provider
	useEffect(() => {
		if (provider === "Other") {
			setIconUrl("");
			setWebsiteUrl("");
		}
	}, [provider]);

	useEffect(() => {
		if (editModel) {
			setName(editModel.name);
			setProvider(editModel.provider);
			setCategory(editModel.category);
			setWebsiteUrl(editModel.websiteUrl || "");
			setIconUrl(editModel.iconUrl || "");
		}
	}, [editModel]);

	// Auto-populate URL and icon when provider changes
	useEffect(() => {
		if (providerData !== undefined && provider !== "Other") {
			if (providerData) {
				setWebsiteUrl(providerData.websiteUrl || "");
				setIconUrl(providerData.iconUrl || "");
			} else {
				setWebsiteUrl("");
				setIconUrl("");
			}
		}
	}, [providerData, provider]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !provider.trim()) {
			setError("Provider and model name are required");
			return;
		}

		const errors: typeof validationErrors = {};
		if (isEditMode && isAdmin) {
			if (!websiteUrl.trim()) errors.websiteUrl = true;
			if (!iconUrl.trim()) errors.iconUrl = true;
			if (!category) errors.category = true;
		}

		setValidationErrors(errors);
		if (Object.keys(errors).length > 0) {
			const msgs: string[] = [];
			if (errors.websiteUrl) msgs.push("Website URL is required");
			if (errors.iconUrl) msgs.push("Icon URL is required");
			if (errors.category) msgs.push("Category is required");
			setError(msgs.join(". "));
			return;
		}

		setSaving(true);
		setError("");

		try {
			if (isEditMode && editModel && isAdmin) {
				await updateModelAdmin({
					modelId: editModel._id,
					name: name.trim(),
					provider: provider.trim(),
					category: (category || "other") as ModelCategory,
					websiteUrl: websiteUrl.trim() || undefined,
					iconUrl: iconUrl.trim() || undefined,
				});
				onModelUpdated?.(editModel._id);
			} else {
				const modelId = await createModel({
					name: name.trim(),
					provider: provider.trim(),
					category: (category || "other") as ModelCategory,
					websiteUrl: websiteUrl.trim() || undefined,
				});
				onModelCreated(modelId, name.trim());
			}
		} catch (err) {
			let errorMessage = isEditMode
				? "Failed to update model"
				: "Failed to create model";
			if (err instanceof Error) {
				const match = err.message.match(/Uncaught Error: (.+?)(?:\s+at\s+|$)/);
				errorMessage = match ? match[1] : err.message;
			}
			setError(errorMessage);
		} finally {
			setSaving(false);
		}
	};

	const canSubmit = name.trim() && provider.trim();

	return (
		<div>
			<div className="mb-6">
				<h2 className="font-mono text-lg font-bold text-fg-primary">
					{isEditMode ? "Edit Model" : "Add New Model"}
				</h2>
				<p className="mt-1 font-mono text-xs text-fg-muted">
					{isEditMode
						? "Update the model details below."
						: "Fill in the details below. Your model will be submitted for review."}
				</p>
			</div>

			{error && (
				<div className="mb-4 border border-destructive/30 bg-destructive/10 p-3 font-mono text-xs text-destructive">
					{error}
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Basic Information */}
				<fieldset className="space-y-4">
					<legend className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-lime">
						Basic Information
					</legend>

					<div className="grid grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
								Provider *
							</Label>
							<div className="flex items-center gap-2">
								<div className="size-8 shrink-0 border border-stroke-subtle bg-bg-panel p-1">
									{iconUrl && (
										<img
											src={iconUrl}
											alt={provider}
											className="size-full object-contain"
										/>
									)}
								</div>
								<Select
									value={provider}
									onValueChange={(val) => {
										if (val) setProvider(val);
									}}
								>
									<SelectTrigger className="h-10 flex-1 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary">
										<SelectValue placeholder="Select provider" />
									</SelectTrigger>
									<SelectContent>
										{providers.map((p) => (
											<SelectItem key={p} value={p}>
												{p}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2 col-span-2">
							<Label
								htmlFor="model-name"
								className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
							>
								Model Name *
							</Label>
							<Input
								id="model-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g. GPT 5.4, Claude Opus 4.6"
								className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
								required
							/>
						</div>
					</div>

					{/* Website URL — only for "Other" provider or admin edit */}
					{(provider === "Other" || (isEditMode && isAdmin)) && (
						<div className="space-y-2">
							<Label
								htmlFor="model-website"
								className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
							>
								Website URL{isEditMode && isAdmin ? " *" : ""}
							</Label>
							<Input
								id="model-website"
								value={websiteUrl}
								onChange={(e) => {
									setWebsiteUrl(e.target.value);
									if (validationErrors.websiteUrl)
										setValidationErrors((prev) => ({ ...prev, websiteUrl: false }));
								}}
								placeholder="https://example.com"
								className={`h-10 bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime ${validationErrors.websiteUrl ? "border-destructive" : "border-stroke-subtle"}`}
							/>
						</div>
					)}

					{/* Icon URL — admin edit only */}
					{isEditMode && isAdmin && (
						<div className="space-y-2">
							<Label
								htmlFor="model-icon"
								className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
							>
								Icon URL *
							</Label>
							<Input
								id="model-icon"
								value={iconUrl}
								onChange={(e) => {
									setIconUrl(e.target.value);
									if (validationErrors.iconUrl)
										setValidationErrors((prev) => ({ ...prev, iconUrl: false }));
								}}
								placeholder="https://example.com/icon.png"
								className={`h-10 bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime ${validationErrors.iconUrl ? "border-destructive" : "border-stroke-subtle"}`}
							/>
						</div>
					)}
				</fieldset>

				{/* More Details Toggle */}
				{!isEditMode && (
					<button
						type="button"
						onClick={() => setShowDetails((v) => !v)}
						className="flex items-center gap-2 font-mono text-xs text-fg-muted hover:text-fg-primary transition-colors"
					>
						{showDetails ? (
							<ChevronDown className="size-3.5" />
						) : (
							<ChevronRight className="size-3.5" />
						)}
						<span className="uppercase tracking-wide">
							{showDetails ? "Hide details" : "Add more details"}
						</span>
						{!showDetails && (
							<span className="normal-case tracking-normal">— category</span>
						)}
					</button>
				)}

				{(showDetails || isEditMode) && (
					<fieldset className="space-y-3">
						<legend className={`font-mono text-[10px] font-semibold uppercase tracking-widest ${validationErrors.category ? "text-destructive" : "text-accent-lime"}`}>
							Category{isEditMode && isAdmin ? " *" : ""}
						</legend>
						<div className="flex flex-wrap gap-2">
							{categories.map((cat) => (
								<button
									key={cat.value}
									type="button"
									onClick={() => {
										setCategory((prev) => prev === cat.value ? "" : cat.value);
										if (validationErrors.category)
											setValidationErrors((prev) => ({ ...prev, category: false }));
									}}
									className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wide border transition-colors ${
										category === cat.value
											? "border-accent-lime bg-accent-lime/20 text-accent-lime"
											: "border-stroke-subtle bg-bg-panel-muted text-fg-muted hover:border-fg-muted"
									}`}
								>
									{cat.label}
								</button>
							))}
						</div>
					</fieldset>
				)}

				{/* Action Buttons */}
				<div className="flex flex-col gap-3 pt-2">
					<div className="flex gap-3">
						<button
							type="button"
							onClick={onCancel}
							className="inline-flex items-center gap-2 border border-stroke-subtle px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-fg-muted hover:text-fg-primary"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={saving || !canSubmit}
							className="inline-flex flex-1 items-center justify-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong disabled:cursor-not-allowed disabled:opacity-50"
						>
							<Check className="size-3.5" />
							{saving
								? isEditMode
									? "Saving..."
									: "Submitting..."
								: isEditMode
									? "Save Changes"
									: "Submit for Review"}
						</button>
					</div>
					{!isEditMode && (
						<p className="text-center text-xs text-fg-muted">
							Your model submission will be reviewed before it appears publicly.
						</p>
					)}
				</div>
			</form>
		</div>
	);
}

interface AddModelModalProps {
	open: boolean;
	onClose: () => void;
	onModelCreated: (modelId: string) => void;
}

export function AddModelModal({
	open,
	onClose,
	onModelCreated,
}: AddModelModalProps) {
	return (
		<Dialog open={open} onClose={onClose} size="lg">
			<AddModelForm
				onCancel={onClose}
				onModelCreated={(modelId) => {
					onModelCreated(modelId);
					onClose();
				}}
			/>
		</Dialog>
	);
}
