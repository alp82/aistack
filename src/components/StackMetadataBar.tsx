import { BookOpen, Check, FileText, GitBranch, Plug, ScrollText, Sparkles, X } from "lucide-react";
import { UtilityBar } from "@/components/system/UtilityBar";

interface StackMetadataBarProps {
	stackUrl?: string;
	prompts?: boolean;
	rules?: boolean;
	skills?: boolean;
	mcps?: boolean;
	resources?: Array<{ label: string; url: string }>;
}

const metaItems = [
	{ key: "prompts" as const, label: "Prompts", icon: FileText },
	{ key: "rules" as const, label: "Rules", icon: ScrollText },
	{ key: "skills" as const, label: "Skills", icon: Sparkles },
	{ key: "mcps" as const, label: "MCPs", icon: Plug },
];

export function StackMetadataBar({ stackUrl, prompts, rules, skills, mcps, resources }: StackMetadataBarProps) {
	const flags = { prompts, rules, skills, mcps };
	const hasAnyMeta = metaItems.some((item) => flags[item.key] !== undefined);
	const hasResources = resources && resources.length > 0;
	if (!stackUrl && !hasAnyMeta && !hasResources) return null;

	return (
		<section className="max-w-7xl mx-auto px-6 pb-6">
			<UtilityBar
				dense
				className="rounded-lg border-gray-700 bg-slate-800/50 px-5 py-4"
				left={
					<div className="flex flex-wrap items-center gap-4">
						{stackUrl && (
							<a href={stackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
								<GitBranch className="h-4 w-4" />
								Repository
							</a>
						)}
						{stackUrl && hasAnyMeta && <span className="text-gray-600">|</span>}
						<ul className="flex flex-wrap items-center gap-3" aria-label="Stack metadata coverage">
							{metaItems.map((item) => {
								const value = flags[item.key];
								if (value === undefined) return null;
								return (
									<li
										key={item.key}
										aria-label={`${item.label}: ${value ? "included" : "missing"}`}
										className="inline-flex items-center gap-1.5 text-sm text-gray-300"
									>
										{value ? <Check className="h-3.5 w-3.5 text-green-400" /> : <X className="h-3.5 w-3.5 text-gray-500" />}
										{item.label}
									</li>
								);
							})}
						</ul>
					</div>
				}
				right={
					hasResources ? (
						<div className="flex flex-wrap items-center gap-3">
							{(stackUrl || hasAnyMeta) && <span className="text-gray-600">|</span>}
							{resources?.map((resource) => (
								<a key={resource.url} href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
									<BookOpen className="h-3.5 w-3.5" />
									{resource.label}
								</a>
							))}
						</div>
					) : undefined
				}
			/>
		</section>
	);
}
