import { useMutation } from "convex/react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../convex/_generated/api";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

type ModelCategory = "language" | "coding" | "reasoning" | "vision" | "audio" | "image" | "video" | "embedding" | "other";

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

type Step = "basic" | "details" | "review";

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
	const createModel = useMutation(api.models.create);
	const [step, setStep] = useState<Step>("basic");
	const [name, setName] = useState("");
	const [provider, setProvider] = useState("");
	const [category, setCategory] = useState<ModelCategory | "">("");
	const [websiteUrl, setWebsiteUrl] = useState("");
	const [contextWindow, setContextWindow] = useState<number | "">("");
	const [description, setDescription] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	if (!open) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (step !== "review") return;

		setSaving(true);
		setError("");

		try {
			const modelId = await createModel({
				name: name.trim(),
				provider: provider.trim(),
				category: category as ModelCategory,
				websiteUrl: websiteUrl.trim() || undefined,
				contextWindow: contextWindow ? Number(contextWindow) : undefined,
				description: description.trim() || undefined,
			});
			onModelCreated(modelId);
			handleClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create model");
		} finally {
			setSaving(false);
		}
	};

	const handleClose = () => {
		setStep("basic");
		setName("");
		setProvider("");
		setCategory("");
		setWebsiteUrl("");
		setContextWindow("");
		setDescription("");
		setError("");
		onClose();
	};

	const canProceedFromBasic = name.trim() && provider.trim() && category;
	const canSubmit = canProceedFromBasic;

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-bg-canvas/80 backdrop-blur-md"
				onClick={handleClose}
				onKeyDown={(e) => e.key === "Escape" && handleClose()}
			/>
			<div className="relative min-w-[400px] max-w-lg border-2 border-stroke-strong bg-bg-panel p-6 shadow-[6px_6px_0_var(--stroke-strong)]">
				<div className="mb-6 flex items-start justify-between gap-4">
					<div>
						<h2 className="font-mono text-lg font-bold text-fg-primary">
							Add New Model
						</h2>
						<p className="mt-1 font-mono text-xs text-fg-muted">
							{step === "basic" && "Step 1 of 3: Basic Information"}
							{step === "details" && "Step 2 of 3: Model Details"}
							{step === "review" && "Step 3 of 3: Review & Submit"}
						</p>
					</div>
					<button
						type="button"
						onClick={handleClose}
						className="flex size-8 shrink-0 items-center justify-center border border-stroke-subtle text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime"
					>
						<X className="size-4" />
					</button>
				</div>

				{/* Progress Indicator */}
				<div className="mb-6 flex items-center gap-2">
					<div
						className={`h-1 flex-1 ${
							step === "basic" || step === "details" || step === "review"
								? "bg-accent-lime"
								: "bg-stroke-subtle"
						}`}
					/>
					<div
						className={`h-1 flex-1 ${
							step === "details" || step === "review"
								? "bg-accent-lime"
								: "bg-stroke-subtle"
						}`}
					/>
					<div
						className={`h-1 flex-1 ${
							step === "review" ? "bg-accent-lime" : "bg-stroke-subtle"
						}`}
					/>
				</div>

				{error && (
					<div className="mb-4 border border-destructive/30 bg-destructive/10 p-3 font-mono text-xs text-destructive">
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-5">
					{/* Step 1: Basic Information */}
					{step === "basic" && (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="model-name" className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
									Model Name *
								</Label>
								<Input
									id="model-name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="e.g. GPT-4o, Claude 3.5 Sonnet"
									className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
									required
								/>
								<p className="text-xs text-fg-muted">
									The name of the AI model
								</p>
							</div>

							<div className="space-y-2">
								<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">Provider *</Label>
								<Select
									value={provider}
									onValueChange={(val) => {
										if (val) setProvider(val);
									}}
								>
									<SelectTrigger className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary">
										<SelectValue placeholder="Select a provider" />
									</SelectTrigger>
									<SelectContent>
										{providers.map((p) => (
											<SelectItem key={p} value={p}>
												{p}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-xs text-fg-muted">
									Who created this model?
								</p>
							</div>

							<div className="space-y-2">
								<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">Category *</Label>
								<Select
									value={category}
									onValueChange={(val) => {
										if (val) setCategory(val as ModelCategory);
									}}
								>
									<SelectTrigger className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary">
										<SelectValue placeholder="Select a category" />
									</SelectTrigger>
									<SelectContent>
										{categories.map((cat) => (
											<SelectItem key={cat.value} value={cat.value}>
												{cat.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-xs text-fg-muted">
									What type of model is this?
								</p>
							</div>
						</div>
					)}

					{/* Step 2: Details */}
					{step === "details" && (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label
									htmlFor="model-website"
									className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
								>
									Website URL (Optional)
								</Label>
								<Input
									id="model-website"
									value={websiteUrl}
									onChange={(e) => setWebsiteUrl(e.target.value)}
									placeholder="https://example.com"
									className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
								/>
								<p className="text-xs text-fg-muted">
									Official website or documentation
								</p>
							</div>

							<div className="space-y-2">
								<Label
									htmlFor="context-window"
									className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
								>
									Context Window (Optional)
								</Label>
								<Input
									id="context-window"
									type="number"
									value={contextWindow}
									onChange={(e) => setContextWindow(e.target.value ? Number(e.target.value) : "")}
									placeholder="e.g. 128000"
									className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
								/>
								<p className="text-xs text-fg-muted">
									Maximum context window in tokens
								</p>
							</div>

							<div className="space-y-2">
								<Label
									htmlFor="description"
									className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
								>
									Description (Optional)
								</Label>
								<Input
									id="description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Brief description of the model"
									className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
								/>
								<p className="text-xs text-fg-muted">
									A short description of the model's capabilities
								</p>
							</div>
						</div>
					)}

					{/* Step 3: Review */}
					{step === "review" && (
						<div className="space-y-4">
							<div className="border border-stroke-subtle bg-bg-panel-muted p-4">
								<h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
									Review Your Submission
								</h3>
								<dl className="space-y-2 text-sm">
									<div className="flex justify-between">
										<dt className="text-fg-muted">Name:</dt>
										<dd className="font-medium text-fg-primary">{name}</dd>
									</div>
									<div className="flex justify-between">
										<dt className="text-fg-muted">Provider:</dt>
										<dd className="font-medium text-fg-primary">{provider}</dd>
									</div>
									<div className="flex justify-between">
										<dt className="text-fg-muted">Category:</dt>
										<dd className="font-medium text-fg-primary capitalize">{category}</dd>
									</div>
									{websiteUrl && (
										<div className="flex justify-between">
											<dt className="text-fg-muted">Website:</dt>
											<dd className="truncate font-medium text-accent-lime">{websiteUrl}</dd>
										</div>
									)}
									{contextWindow && (
										<div className="flex justify-between">
											<dt className="text-fg-muted">Context Window:</dt>
											<dd className="font-medium text-fg-primary">{contextWindow.toLocaleString()} tokens</dd>
										</div>
									)}
								</dl>
							</div>
							<p className="text-xs text-fg-muted">
								Your model will be submitted for review. Once approved, it will appear in the models list.
							</p>
						</div>
					)}

					{/* Navigation Buttons */}
					<div className="flex gap-3 pt-2">
						{step !== "basic" && (
							<button
								type="button"
								onClick={() => setStep(step === "review" ? "details" : "basic")}
								className="inline-flex flex-1 items-center justify-center gap-2 border-2 border-stroke-subtle px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary transition-colors hover:border-fg-muted hover:text-fg-primary"
							>
								<ArrowLeft className="size-3.5" />
								Back
							</button>
						)}
						{step === "basic" && (
							<button
								type="button"
								onClick={() => setStep("details")}
								disabled={!canProceedFromBasic}
								className="inline-flex flex-1 items-center justify-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong disabled:cursor-not-allowed disabled:opacity-50"
							>
								Next
								<ArrowRight className="size-3.5" />
							</button>
						)}
						{step === "details" && (
							<button
								type="button"
								onClick={() => setStep("review")}
								className="inline-flex flex-1 items-center justify-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong"
							>
								Next
								<ArrowRight className="size-3.5" />
							</button>
						)}
						{step === "review" && (
							<button
								type="submit"
								disabled={saving || !canSubmit}
								className="inline-flex flex-1 items-center justify-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong disabled:cursor-not-allowed disabled:opacity-50"
							>
								<Check className="size-3.5" />
								{saving ? "Submitting..." : "Submit for Review"}
							</button>
						)}
					</div>
				</form>
			</div>
		</div>,
		document.body
	);
}
