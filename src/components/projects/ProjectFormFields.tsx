import { useId } from "react";
import { TagBadge } from "@/components/TagBadge";
import { FormField } from "@/components/ui/form-field";
import { FormInput } from "@/components/ui/form-input";
import { FormTextarea } from "@/components/ui/form-textarea";

type ProjectFormFieldsProps = {
	name: string;
	onNameChange: (value: string) => void;
	description: string;
	onDescriptionChange: (value: string) => void;
	url: string;
	onUrlChange: (value: string) => void;
	tags: string[];
	tagInput: string;
	onTagInputChange: (value: string) => void;
	onAddTag: () => void;
	onRemoveTag: (tag: string) => void;
};

function ProjectFormFields({
	name,
	onNameChange,
	description,
	onDescriptionChange,
	url,
	onUrlChange,
	tags,
	tagInput,
	onTagInputChange,
	onAddTag,
	onRemoveTag,
}: ProjectFormFieldsProps) {
	const tagsId = useId();

	return (
		<div className="space-y-4">
			<FormInput
				label="Name"
				required
				value={name}
				onChange={(e) => onNameChange(e.target.value)}
				placeholder="Project name"
			/>
			<FormTextarea
				label="Description"
				rows={2}
				value={description}
				onChange={(e) => onDescriptionChange(e.target.value)}
				placeholder="Short description of the project..."
			/>
			<FormInput
				label="URL"
				value={url}
				onChange={(e) => onUrlChange(e.target.value)}
				placeholder="https://..."
			/>
			<FormField label="Tags" htmlFor={tagsId}>
				<input
					id={tagsId}
					type="text"
					value={tagInput}
					onChange={(e) => onTagInputChange(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							onAddTag();
						}
					}}
					placeholder="Add tag + Enter"
					className="w-full border-2 border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
				/>
				{tags.length > 0 && (
					<div className="mt-2 flex flex-wrap gap-1.5">
						{tags.map((tag) => (
							<TagBadge
								key={tag}
								tag={tag}
								size="md"
								onRemove={() => onRemoveTag(tag)}
							/>
						))}
					</div>
				)}
			</FormField>
		</div>
	);
}

export { ProjectFormFields };
export type { ProjectFormFieldsProps };
