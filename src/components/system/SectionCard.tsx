import type * as React from "react";

import { cn } from "@/lib/utils";

type SectionCardTone = "default" | "accent";

type SectionCardProps = React.HTMLAttributes<HTMLElement> & {
	as?: "section" | "article" | "div";
	eyebrow?: React.ReactNode;
	title?: React.ReactNode;
	description?: React.ReactNode;
	actions?: React.ReactNode;
	tone?: SectionCardTone;
	contentClassName?: string;
};

function SectionCard({
	as = "section",
	eyebrow,
	title,
	description,
	actions,
	tone = "default",
	className,
	contentClassName,
	children,
	...props
}: SectionCardProps) {
	const Comp = as;

	return (
		<Comp
			data-slot="section-card"
			data-tone={tone}
			data-testid="section-card"
			className={cn(
				"border-2 bg-bg-panel p-4 sm:p-5",
				"border-stroke-subtle",
				tone === "accent" && "border-accent-lime/70 bg-bg-panel-elevated",
				className,
			)}
			{...props}
		>
			{(eyebrow || title || description || actions) && (
				<header className="mb-4 flex items-start justify-between gap-4 border-b border-stroke-subtle pb-3">
					<div className="min-w-0 space-y-1">
						{eyebrow && (
							<p className="text-[0.67rem] font-semibold tracking-[0.2em] text-accent-lime uppercase">
								{eyebrow}
							</p>
						)}
						{title && <h2 className="text-sm font-semibold tracking-wide text-fg-primary">{title}</h2>}
						{description && <p className="text-sm text-fg-muted">{description}</p>}
					</div>
					{actions && <div className="shrink-0">{actions}</div>}
				</header>
			)}
			<div className={cn("space-y-3", contentClassName)}>{children}</div>
		</Comp>
	);
}

export { SectionCard };
export type { SectionCardProps, SectionCardTone };
