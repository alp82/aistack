import { cn } from "@/lib/utils";

type CategoryLabelProps = {
	category: string;
	className?: string;
};

function getCategoryColor(category: string): string {
	const colors: Record<string, string> = {
		coding: "border-purple-500 text-purple-400",
		thinking: "border-blue-500 text-blue-400",
		text: "border-emerald-500 text-emerald-400",
		research: "border-amber-500 text-amber-400",
		voice: "border-pink-500 text-pink-400",
		image: "border-orange-500 text-orange-400",
		video: "border-red-500 text-red-400",
		design: "border-cyan-500 text-cyan-400",
		automation: "border-indigo-500 text-indigo-400",
		notes: "border-teal-500 text-teal-400",
		analytics: "border-yellow-500 text-yellow-400",
	};
	return colors[category.toLowerCase()] || "border-zinc-500 text-zinc-400";
}

function toCategoryLabel(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

function CategoryLabel({ category, className }: CategoryLabelProps) {
	return (
		<span
			className={cn(
				"text-[10px] font-bold bg-bg-panel px-2 py-1 uppercase tracking-wider border",
				getCategoryColor(category),
				className
			)}
		>
			{toCategoryLabel(category)}
		</span>
	);
}

export { CategoryLabel, getCategoryColor, toCategoryLabel };
export type { CategoryLabelProps };
