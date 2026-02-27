import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PageHeaderProps {
	/** Comment-style label like "TOOL_DATABASE" */
	label: string;
	/** Secondary label after the separator */
	labelSuffix?: string;
	/** Main title - can include line breaks with <br /> */
	title: ReactNode;
	/** Description text shown below title */
	description?: string;
	/** Optional action button */
	action?: {
		label: string;
		icon?: ReactNode;
		onClick: () => void;
	};
}

export function PageHeader({
	label,
	labelSuffix,
	title,
	description,
	action,
}: PageHeaderProps) {
	return (
		<div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-20 gap-8 border-b-2 border-stroke-strong pb-12">
			<div>
				<div className="font-mono text-accent-lime mb-6 flex items-center gap-4 text-sm">
					<span>// {label}</span>
					{labelSuffix && (
						<>
							<span className="h-px w-20 bg-accent-lime/50" />
							<span>{labelSuffix}</span>
						</>
					)}
				</div>
				<h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-fg-primary">
					{title}
				</h1>
				{description && (
					<p className="mt-6 text-xl text-fg-secondary max-w-2xl border-l-4 border-accent-lime pl-6">
						{description}
					</p>
				)}
			</div>

			{action && (
				<motion.button
					onClick={action.onClick}
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
					className="flex-shrink-0 inline-flex items-center gap-3 px-6 py-4 font-mono text-sm uppercase tracking-widest font-bold border-2 border-accent-lime bg-accent-lime text-accent-lime-contrast hover:bg-accent-lime-strong transition-colors"
				>
					{action.icon}
					{action.label}
				</motion.button>
			)}
		</div>
	);
}
