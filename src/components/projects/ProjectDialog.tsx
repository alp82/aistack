import { useEffect, useState } from "react";
import { ProjectFormFields } from "@/components/projects/ProjectFormFields";
import { useTagInput } from "@/components/projects/useTagInput";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/Dialog";

export type ProjectFormValues = {
	name: string;
	description: string;
	url: string;
	tags: string[];
};

export type DialogState =
	| { mode: "create" }
	| { mode: "edit"; initial: { id: string } & ProjectFormValues }
	| null;

export type ManagerCreateValues = {
	name: string;
	description?: string;
	url?: string;
	tags?: string[];
};

export type ManagerUpdateValues = {
	name?: string;
	description?: string;
	url?: string;
	tags?: string[];
};

export function ProjectDialog({
	state,
	onClose,
	onCreate,
	onUpdate,
}: {
	state: DialogState;
	onClose: () => void;
	onCreate: (v: ManagerCreateValues) => Promise<unknown>;
	onUpdate: (id: string, v: ManagerUpdateValues) => Promise<unknown>;
}) {
	const mode = state?.mode ?? "create";
	const initial = state?.mode === "edit" ? state.initial : null;

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [url, setUrl] = useState("");
	const { tags, setTags, tagInput, setTagInput, addTag, removeTag } =
		useTagInput([]);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (initial) {
			setName(initial.name);
			setDescription(initial.description);
			setUrl(initial.url);
			setTags(initial.tags);
			setTagInput("");
			setError(null);
		} else {
			setName("");
			setDescription("");
			setUrl("");
			setTags([]);
			setTagInput("");
			setError(null);
		}
	}, [initial, setTags, setTagInput]);

	const handleClose = () => {
		setError(null);
		setTagInput("");
		onClose();
	};

	const handleSubmit = async () => {
		const trimmedName = name.trim();
		if (!trimmedName || submitting) return;
		setSubmitting(true);
		setError(null);
		try {
			if (mode === "edit" && initial) {
				await onUpdate(initial.id, {
					name: trimmedName,
					description: description.trim() || undefined,
					url: url.trim() || undefined,
					tags,
				});
			} else {
				await onCreate({
					name: trimmedName,
					description: description.trim() || undefined,
					url: url.trim() || undefined,
					tags: tags.length ? tags : undefined,
				});
			}
			handleClose();
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: mode === "edit"
						? "Failed to update project"
						: "Failed to create project",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog
			open={state !== null}
			onClose={handleClose}
			title={mode === "create" ? "New Project" : "Edit Project"}
		>
			<div className="space-y-4">
				<ProjectFormFields
					name={name}
					onNameChange={setName}
					description={description}
					onDescriptionChange={setDescription}
					url={url}
					onUrlChange={setUrl}
					tags={tags}
					tagInput={tagInput}
					onTagInputChange={setTagInput}
					onAddTag={addTag}
					onRemoveTag={removeTag}
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
						disabled={!name.trim() || submitting}
						className="font-mono text-xs font-bold uppercase tracking-wider"
					>
						{mode === "create"
							? submitting
								? "Creating..."
								: "Create"
							: submitting
								? "Saving..."
								: "Save"}
					</Button>
				</div>
			</div>
		</Dialog>
	);
}
