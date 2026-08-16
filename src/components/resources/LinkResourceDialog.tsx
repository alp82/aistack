import { useMutation } from "convex/react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/form-field";
import { FormInput } from "@/components/ui/form-input";
import { FormTextarea } from "@/components/ui/form-textarea";
import { isGithubRepoUrl } from "@/lib/github-repo";
import { knownGroups, knownResourceTypes } from "@/lib/resource-utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export interface LinkResourceDialogProps {
	open: boolean;
	onClose: () => void;
	target: { kind: "stack"; id: Id<"stacks"> };
}

export function LinkResourceDialog({
	open,
	onClose,
	target,
}: LinkResourceDialogProps) {
	const linkResource = useMutation(api.resources.linkResource);
	const typeInputId = useId();
	const typeListId = useId();
	const groupInputId = useId();
	const groupListId = useId();
	const [repoUrl, setRepoUrl] = useState("");
	const [path, setPath] = useState("");
	const [name, setName] = useState("");
	const [type, setType] = useState("");
	const [group, setGroup] = useState("generic");
	const [description, setDescription] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const reset = () => {
		setRepoUrl("");
		setPath("");
		setName("");
		setType("");
		setGroup("generic");
		setDescription("");
		setError(null);
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const handleSubmit = async () => {
		const trimmedRepoUrl = repoUrl.trim();
		const trimmedName = name.trim();
		if (!trimmedRepoUrl || !trimmedName || submitting) return;
		if (!isGithubRepoUrl(trimmedRepoUrl)) {
			setError("Enter a GitHub repository URL - github.com/owner/repo");
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			await linkResource({
				target,
				item: {
					type: type.trim() || "custom",
					name: trimmedName,
					description: description.trim() || undefined,
					group: group.trim() || "generic",
					stableKey: "pending",
					upstream: {
						repoUrl: trimmedRepoUrl,
						path: path.trim() || undefined,
					},
				},
			});
			reset();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to link resource");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onClose={handleClose} title="Link from GitHub">
			<div className="space-y-4">
				<FormInput
					label="Repository URL"
					required
					value={repoUrl}
					onChange={(e) => setRepoUrl(e.target.value)}
					placeholder="https://github.com/owner/repo"
				/>
				<FormInput
					label="Path (optional)"
					value={path}
					onChange={(e) => setPath(e.target.value)}
					placeholder="src/agents"
				/>
				<FormInput
					label="Name"
					required
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="AGENTS.md"
				/>
				<FormField label="Type" htmlFor={typeInputId}>
					<input
						id={typeInputId}
						type="text"
						list={typeListId}
						value={type}
						onChange={(e) => setType(e.target.value)}
						placeholder="custom"
						className="w-full border-2 border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
					/>
					<datalist id={typeListId}>
						{knownResourceTypes.map((t) => (
							<option key={t} value={t} />
						))}
					</datalist>
				</FormField>
				<FormField label="Group" htmlFor={groupInputId}>
					<input
						id={groupInputId}
						type="text"
						list={groupListId}
						value={group}
						onChange={(e) => setGroup(e.target.value)}
						placeholder="generic"
						className="w-full border-2 border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
					/>
					<datalist id={groupListId}>
						{knownGroups.map((g) => (
							<option key={g} value={g} />
						))}
					</datalist>
				</FormField>
				<FormTextarea
					label="Description"
					rows={2}
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="What this resource is..."
				/>
				{error && (
					<p role="alert" className="font-mono text-xs text-destructive">
						{error}
					</p>
				)}
				<div className="flex justify-end gap-2 pt-2">
					<Button
						type="button"
						variant="outline"
						onClick={handleClose}
						className="font-mono text-xs font-bold uppercase tracking-wider"
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={
							!repoUrl.trim() ||
							!isGithubRepoUrl(repoUrl.trim()) ||
							!name.trim() ||
							submitting
						}
						className="font-mono text-xs font-bold uppercase tracking-wider"
					>
						{submitting ? "Linking..." : "Link"}
					</Button>
				</div>
			</div>
		</Dialog>
	);
}
