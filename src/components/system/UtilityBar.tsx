import type * as React from "react";

import { cn } from "@/lib/utils";

type UtilityBarProps = React.HTMLAttributes<HTMLDivElement> & {
	left?: React.ReactNode;
	right?: React.ReactNode;
	dense?: boolean;
};

function UtilityBar({
	left,
	right,
	dense = false,
	className,
	children,
	...props
}: UtilityBarProps) {
	return (
		<div
			data-slot="utility-bar"
			className={cn(
				"flex items-center justify-between gap-3 border-2 border-stroke-subtle bg-bg-panel-muted",
				dense ? "min-h-10 px-3 py-2" : "min-h-12 px-4 py-2.5",
				className,
			)}
			{...props}
		>
			<div className="flex min-w-0 items-center gap-2">{left ?? children}</div>
			{right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
		</div>
	);
}

export { UtilityBar };
export type { UtilityBarProps };
