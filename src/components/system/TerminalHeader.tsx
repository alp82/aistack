import type * as React from "react";

import { cn } from "@/lib/utils";

type TerminalHeaderProps = React.HTMLAttributes<HTMLElement> & {
	title: React.ReactNode;
	subtitle?: React.ReactNode;
	status?: React.ReactNode;
	actions?: React.ReactNode;
	icon?: React.ReactNode;
};

function TerminalHeader({
	title,
	subtitle,
	status,
	actions,
	icon,
	className,
	...props
}: TerminalHeaderProps) {
	return (
		<header
			data-slot="terminal-header"
			className={cn(
				"border-2 border-stroke-strong bg-bg-panel px-4 py-3",
				className,
			)}
			{...props}
		>
			<div className="mb-3 flex items-center justify-between gap-3 border-b border-stroke-subtle pb-2">
				<div className="flex items-center gap-2 text-xs text-fg-muted">
					<span className="h-2.5 w-2.5 rounded-full bg-destructive" aria-hidden="true" />
					<span className="h-2.5 w-2.5 rounded-full bg-accent-lime-soft" aria-hidden="true" />
					<span className="h-2.5 w-2.5 rounded-full bg-fg-muted/70" aria-hidden="true" />
					{status && <span className="ml-2 tracking-wide uppercase">{status}</span>}
				</div>
				{actions && <div className="flex items-center gap-2">{actions}</div>}
			</div>
			<div className="flex items-start gap-3">
				{icon && <div className="mt-0.5 text-accent-lime">{icon}</div>}
				<div className="min-w-0">
					<h1 className="text-base font-semibold tracking-wide text-fg-primary sm:text-lg">{title}</h1>
					{subtitle && <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>}
				</div>
			</div>
		</header>
	);
}

export { TerminalHeader };
export type { TerminalHeaderProps };
