import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BrutalButtonProps = {
	children: ReactNode;
	primary?: boolean;
	className?: string;
	onClick?: () => void;
	type?: "button" | "submit" | "reset";
	disabled?: boolean;
	asChild?: boolean;
};

function BrutalButton({
	children,
	primary = false,
	className = "",
	onClick,
	type = "button",
	disabled = false,
}: BrutalButtonProps) {
	return (
		<motion.button
			type={type}
			onClick={onClick}
			disabled={disabled}
			whileHover={{
				scale: 1.02,
				x: -2,
				y: -2,
				boxShadow: "4px 4px 0px 0px rgba(163, 230, 53, 1)",
			}}
			whileTap={{
				scale: 0.98,
				x: 0,
				y: 0,
				boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)",
			}}
			transition={{ duration: 0.15 }}
			className={cn(
				"relative px-6 py-4 font-mono text-sm uppercase tracking-widest font-bold border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
				primary
					? "bg-accent-lime text-accent-lime-contrast border-accent-lime hover:bg-accent-lime-strong"
					: "bg-transparent text-fg-primary border-fg-primary hover:bg-bg-panel",
				className,
			)}
		>
			<div className="flex items-center gap-3">{children}</div>
		</motion.button>
	);
}

function BrutalButtonLink({
	children,
	primary = false,
	className = "",
	href,
}: {
	children: ReactNode;
	primary?: boolean;
	className?: string;
	href: string;
}) {
	return (
		<motion.a
			href={href}
			whileHover={{
				scale: 1.02,
				x: -2,
				y: -2,
				boxShadow: "4px 4px 0px 0px rgba(163, 230, 53, 1)",
			}}
			whileTap={{
				scale: 0.98,
				x: 0,
				y: 0,
				boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)",
			}}
			transition={{ duration: 0.15 }}
			className={cn(
				"relative inline-flex items-center gap-3 px-6 py-4 font-mono text-sm uppercase tracking-widest font-bold border-2 transition-colors",
				primary
					? "bg-accent-lime text-accent-lime-contrast border-accent-lime hover:bg-accent-lime-strong"
					: "bg-transparent text-fg-primary border-fg-primary hover:bg-bg-panel",
				className,
			)}
		>
			{children}
		</motion.a>
	);
}

export { BrutalButton, BrutalButtonLink };
