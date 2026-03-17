import type * as React from "react";
import { FormField } from "./form-field";
import { cn } from "@/lib/utils";

type FormSelectProps = {
	label: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
	options: Array<{ value: string; label: string }>;
	required?: boolean;
	description?: string;
	error?: string;
	className?: string;
	id?: string;
};

function FormSelect({
	label,
	value,
	onChange,
	options,
	required,
	description,
	error,
	className,
	id,
}: FormSelectProps) {
	const selectId =
		id || `form-select-${label.toLowerCase().replace(/\s+/g, "-")}`;

	return (
		<FormField
			label={label}
			htmlFor={selectId}
			description={description}
			error={error}
			required={required}
			className={className}
		>
			<select
				id={selectId}
				value={value}
				onChange={onChange}
				className={cn(
					"w-full border-2 border-stroke-subtle bg-bg-panel px-2 py-1.5 font-mono text-xs text-fg-primary focus:border-accent-lime focus:outline-none",
					className,
				)}
			>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</FormField>
	);
}

export { FormSelect };
export type { FormSelectProps };
