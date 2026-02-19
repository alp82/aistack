import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"h-10 w-full min-w-0 border-2 border-stroke-subtle bg-bg-panel px-3 py-2 text-sm text-fg-primary shadow-terminal-sm outline-none transition-colors placeholder:text-fg-muted selection:bg-accent-lime selection:text-accent-lime-contrast file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-fg-primary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45",
				"focus-visible:border-accent-lime focus-visible:ring-2 focus-visible:ring-accent-lime/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas",
				"aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/45",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
