import type * as React from "react";

import { cn } from "@/lib/utils";

type FieldShellProps = React.HTMLAttributes<HTMLDivElement> & {
	label?: React.ReactNode;
	htmlFor?: string;
	helper?: React.ReactNode;
	error?: React.ReactNode;
	required?: boolean;
	labelAdornment?: React.ReactNode;
};

function FieldShell({
	label,
	htmlFor,
	helper,
	error,
	required = false,
	labelAdornment,
	className,
	children,
	...props
}: FieldShellProps) {
	return (
		<div
			data-slot="field-shell"
			className={cn("space-y-2", className)}
			{...props}
		>
			{label && (
				<div className="flex items-center justify-between gap-2">
					<label
						htmlFor={htmlFor}
						className="text-xs font-semibold tracking-[0.12em] text-fg-secondary uppercase"
					>
						{label}
						{required && <span className="ml-1 text-accent-lime">*</span>}
					</label>
					{labelAdornment && (
						<div className="text-xs text-fg-muted">{labelAdornment}</div>
					)}
				</div>
			)}
			<div className="rounded-xs border border-stroke-subtle bg-bg-panel-muted/40 p-1">
				{children}
			</div>
			{error ? (
				<p role="alert" className="text-xs font-medium text-destructive">
					{error}
				</p>
			) : (
				helper && <p className="text-xs text-fg-muted">{helper}</p>
			)}
		</div>
	);
}

export { FieldShell };
export type { FieldShellProps };
