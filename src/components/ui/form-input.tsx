import type * as React from "react";
import { FormField } from "./form-field";
import { Input } from "./input";

type FormInputProps = {
	label: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	type?: string;
	required?: boolean;
	description?: string;
	error?: string;
	className?: string;
	id?: string;
};

function FormInput({
	label,
	value,
	onChange,
	placeholder,
	type = "text",
	required,
	description,
	error,
	className,
	id,
}: FormInputProps) {
	const inputId =
		id || `form-input-${label.toLowerCase().replace(/\s+/g, "-")}`;

	return (
		<FormField
			label={label}
			htmlFor={inputId}
			description={description}
			error={error}
			required={required}
			className={className}
		>
			<Input
				id={inputId}
				type={type}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				className="border-2 border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary placeholder:text-fg-muted focus:border-accent-lime focus:outline-none"
			/>
		</FormField>
	);
}

export { FormInput };
export type { FormInputProps };
