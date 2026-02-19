import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xs border-2 border-transparent text-sm font-semibold tracking-wide transition-colors outline-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 disabled:pointer-events-none disabled:opacity-45 focus-visible:border-accent-lime focus-visible:ring-2 focus-visible:ring-accent-lime/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/45",
	{
		variants: {
			variant: {
				default:
					"border-accent-lime bg-accent-lime text-accent-lime-contrast shadow-terminal-sm hover:border-accent-lime-strong hover:bg-accent-lime-strong",
				destructive:
					"border-destructive bg-destructive text-destructive-foreground shadow-terminal-sm hover:bg-destructive/90",
				outline:
					"border-stroke-strong bg-bg-panel text-fg-primary hover:border-accent-lime/60 hover:bg-bg-panel-elevated hover:text-accent-lime",
				secondary: "border-stroke-subtle bg-bg-panel-muted text-fg-primary hover:bg-bg-panel-elevated",
				ghost: "border-transparent bg-transparent text-fg-secondary hover:border-stroke-subtle hover:bg-bg-panel-muted hover:text-fg-primary",
				link: "border-transparent bg-transparent px-0 text-accent-lime underline-offset-4 hover:text-accent-lime-strong hover:underline",
			},
			size: {
				default: "h-10 px-4 py-2 has-[>svg]:px-3",
				sm: "h-8 gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
				lg: "h-11 px-6 text-sm has-[>svg]:px-4",
				icon: "size-10",
				"icon-sm": "size-8",
				"icon-lg": "size-12",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-size={size}
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
