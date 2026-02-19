import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"border-2 border-stroke-subtle bg-bg-panel placeholder:text-fg-muted focus-visible:border-accent-lime focus-visible:ring-2 focus-visible:ring-accent-lime/60 aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full border px-3 py-2 text-base shadow-terminal-sm transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-fg-primary",
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
