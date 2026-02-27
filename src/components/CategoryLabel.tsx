import { cn } from "@/lib/utils";

type CategoryLabelProps = {
	category: string;
	className?: string;
};

function getCategoryColor(category: string): string {
	const colors: Record<string, string> = {
		ide: "border-green-500 text-green-400",
		"coding-agent": "border-emerald-500 text-emerald-400",
		"app-builder": "border-lime-500 text-lime-400",
		reasoning: "border-blue-500 text-blue-400",
		research: "border-yellow-500 text-yellow-400",
		"image-gen": "border-cyan-500 text-cyan-400",
		"video-gen": "border-teal-500 text-teal-400",
		"video-editing": "border-indigo-500 text-indigo-400",
		dictation: "border-orange-500 text-orange-400",
		"voice-gen": "border-purple-500 text-purple-400",
		design: "border-fuchsia-500 text-fuchsia-400",
		"3d": "border-sky-500 text-sky-400",
		"creative-suite": "border-rose-500 text-rose-400",
		assets: "border-amber-500 text-amber-400",
		notes: "border-pink-500 text-pink-400",
		communication: "border-gray-500 text-gray-400",
		automation: "border-red-500 text-red-400",
		analytics: "border-slate-500 text-slate-400",
		"code-review": "border-violet-500 text-violet-400",
		writing: "border-stone-500 text-stone-400",
		"music-gen": "border-fuchsia-600 text-fuchsia-300",
		deployment: "border-sky-600 text-sky-300",
		monitoring: "border-rose-600 text-rose-300",
		"project-management": "border-blue-600 text-blue-300",
		presentation: "border-amber-600 text-amber-300",
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
