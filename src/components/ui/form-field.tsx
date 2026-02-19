import type * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

type FormFieldProps = {
	label: string;
	htmlFor?: string;
	description?: string;
	error?: string;
	required?: boolean;
	className?: string;
	children: React.ReactNode;
};

function FormField({
	label,
	htmlFor,
	description,
	error,
	required,
	className,
	children,
}: FormFieldProps) {
	return (
		<div className={cn("space-y-2", className)}>
			<Label
				htmlFor={htmlFor}
				className="font-mono text-xs uppercase tracking-wider text-fg-muted"
			>
				{label}
				{required && <span className="ml-1 text-accent-lime">*</span>}
			</Label>
			{children}
			{description && !error && (
				<p className="font-mono text-[10px] text-fg-muted">{description}</p>
			)}
			{error && (
				<p className="font-mono text-[10px] text-destructive">{error}</p>
			)}
		</div>
	);
}

export { FormField };
export type { FormFieldProps };
