import type * as React from "react";
import { FormField } from "./form-field";
import { Textarea } from "./textarea";

type FormTextareaProps = {
	label: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	placeholder?: string;
	rows?: number;
	required?: boolean;
	description?: string;
	error?: string;
	className?: string;
	id?: string;
};

function FormTextarea({
	label,
	value,
	onChange,
	placeholder,
	rows = 4,
	required,
	description,
	error,
	className,
	id,
}: FormTextareaProps) {
	const textareaId =
		id || `form-textarea-${label.toLowerCase().replace(/\s+/g, "-")}`;

	return (
		<FormField
			label={label}
			htmlFor={textareaId}
			description={description}
			error={error}
			required={required}
			className={className}
		>
			<Textarea
				id={textareaId}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				rows={rows}
				className="w-full resize-y border-2 border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
			/>
		</FormField>
	);
}

export { FormTextarea };
export type { FormTextareaProps };
