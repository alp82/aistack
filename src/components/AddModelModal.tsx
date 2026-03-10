import { useMutation } from "convex/react";
import { Check } from "lucide-react";
import { useState } from "react";
import { Dialog } from "./ui/Dialog";
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

interface AddModelFormProps {
	onCancel: () => void;
	onModelCreated: (modelId: string) => void;
}

export function AddModelForm({ onCancel, onModelCreated }: AddModelFormProps) {
	const createModel = useMutation(api.models.create);
	const [name, setName] = useState("");
	const [provider, setProvider] = useState("");
	const [category, setCategory] = useState<ModelCategory | "">("");
	const [websiteUrl, setWebsiteUrl] = useState("");
	const [contextWindow, setContextWindow] = useState<number | "">("");
	const [description, setDescription] = useState("");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !provider.trim() || !category) {
			setError("Name, provider, and category are required");
			return;
		}

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
		} catch (err) {
			let errorMessage = "Failed to create model";
			if (err instanceof Error) {
				const match = err.message.match(/Uncaught Error: (.+?)(?:\s+at\s+|$)/);
				errorMessage = match ? match[1] : err.message;
			}
			setError(errorMessage);
		} finally {
			setSaving(false);
		}
	};

	const canSubmit = name.trim() && provider.trim() && category;

	return (
		<div>
			<div className="mb-6">
				<h2 className="font-mono text-lg font-bold text-fg-primary">
					Add New Model
				</h2>
				<p className="mt-1 font-mono text-xs text-fg-muted">
					Fill in the details below. Your model will be submitted for review.
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
								placeholder="e.g. GPT-4o, Claude 3.5 Sonnet"
								className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
								Provider *
							</Label>
							<Select
								value={provider}
								onValueChange={(val) => {
									if (val) setProvider(val);
								}}
							>
								<SelectTrigger className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary">
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

						<div className="space-y-2">
							<Label className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary">
								Category *
							</Label>
							<Select
								value={category}
								onValueChange={(val) => {
									if (val) setCategory(val as ModelCategory);
								}}
							>
								<SelectTrigger className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary">
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
									{categories.map((cat) => (
										<SelectItem key={cat.value} value={cat.value}>
											{cat.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</fieldset>

				{/* Details */}
				<fieldset className="space-y-4">
					<legend className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent-lime">
						Details
					</legend>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label
								htmlFor="model-website"
								className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
							>
								Website URL
							</Label>
							<Input
								id="model-website"
								value={websiteUrl}
								onChange={(e) => setWebsiteUrl(e.target.value)}
								placeholder="https://example.com"
								className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
							/>
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="context-window"
								className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
							>
								Context Window (tokens)
							</Label>
							<Input
								id="context-window"
								type="number"
								value={contextWindow}
								onChange={(e) =>
									setContextWindow(e.target.value ? Number(e.target.value) : "")
								}
								placeholder="e.g. 128000"
								className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label
							htmlFor="model-description"
							className="font-mono text-xs font-semibold uppercase tracking-wide text-fg-secondary"
						>
							Description
						</Label>
						<Input
							id="model-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Brief description of the model's capabilities"
							className="h-10 border-stroke-subtle bg-bg-panel-muted font-mono text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent-lime"
						/>
					</div>
				</fieldset>

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
							{saving ? "Submitting..." : "Submit for Review"}
						</button>
					</div>
					<p className="text-center text-xs text-fg-muted">
						Your model submission will be reviewed before it appears publicly.
					</p>
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
