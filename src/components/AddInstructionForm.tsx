import { useState, useEffect } from "react";
import type { InstructionType } from "@/features/stack-editor/types";
import { FormInput } from "@/components/ui/form-input";
import { FormTextarea } from "@/components/ui/form-textarea";
import { InstructionTypeNav } from "@/components/InstructionTypeNav";
import { Check } from "lucide-react";

interface AddInstructionFormProps {
	onCancel: () => void;
	onInstructionCreated: (
		instruction: { name: string; type: InstructionType; content?: string },
		name?: string,
	) => void;
	defaultType?: InstructionType;
	/** When provided, pre-fill the form for editing */
	editName?: string;
	editContent?: string;
}

export function AddInstructionForm({
	onCancel,
	onInstructionCreated,
	defaultType = "prompt",
	editName,
	editContent,
}: AddInstructionFormProps) {
	const [name, setName] = useState(editName ?? "");
	const [type, setType] = useState<InstructionType>(defaultType);
	const [content, setContent] = useState(editContent ?? "");
	const [error, setError] = useState("");

	useEffect(() => {
		setType(defaultType);
	}, [defaultType]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			setError("Name is required");
			return;
		}
		setError("");
		onInstructionCreated(
			{
				name: name.trim(),
				type,
				content: content.trim() || undefined,
			},
			name.trim(),
		);
	};

	return (
		<div>
			<div className="mb-6">
				<h2 className="font-mono text-lg font-bold text-fg-primary">
					Add New Instruction
				</h2>
				<p className="mt-1 font-mono text-xs text-fg-muted">
					Create an instruction to include in your stack.
				</p>
			</div>

			{error && (
				<div className="mb-4 border border-destructive/30 bg-destructive/10 p-3 font-mono text-xs text-destructive">
					{error}
				</div>
			)}

			{/* Type sub-navigation */}
			<div className="mb-6">
				<InstructionTypeNav activeType={type} onTypeChange={setType} />
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<FormInput
					label="Name"
					value={name}
					onChange={(e) => {
						setName(e.target.value);
						if (error) setError("");
					}}
					placeholder="e.g. Code Review Rules, System Prompt..."
				/>

				<FormTextarea
					label="Content"
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder="Markdown content..."
					rows={12}
				/>

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
							disabled={!name.trim()}
							className="inline-flex flex-1 items-center justify-center gap-2 border-2 border-accent-lime bg-accent-lime px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-accent-lime-contrast transition-colors hover:bg-accent-lime-strong disabled:cursor-not-allowed disabled:opacity-50"
						>
							<Check className="size-3.5" />
							Add Instruction
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
