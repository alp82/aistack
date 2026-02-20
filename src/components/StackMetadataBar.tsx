import { BookOpen, FileText, GitBranch, Plug, ScrollText, Sparkles } from "lucide-react";

interface PromptItem {
	name: string;
	description: string;
	content?: string;
}

interface RuleItem {
	name: string;
	description: string;
}

interface SkillItem {
	name: string;
	description: string;
	trigger?: string;
}

interface McpItem {
	name: string;
	purpose: string;
	url?: string;
}

interface StackMetadataBarProps {
	stackUrl?: string;
	prompts?: PromptItem[];
	rules?: RuleItem[];
	skills?: SkillItem[];
	mcps?: McpItem[];
	resources?: Array<{ label: string; url: string }>;
}

const metaItems = [
	{ key: "prompts" as const, label: "Prompts", icon: FileText },
	{ key: "rules" as const, label: "Rules", icon: ScrollText },
	{ key: "skills" as const, label: "Skills", icon: Sparkles },
	{ key: "mcps" as const, label: "MCPs", icon: Plug },
];

export function StackMetadataBar({ stackUrl, prompts, rules, skills, mcps, resources }: StackMetadataBarProps) {
	const arrays = { prompts, rules, skills, mcps };
	const hasAnyMeta = metaItems.some((item) => {
		const arr = arrays[item.key];
		return arr && arr.length > 0;
	});
	const hasResources = resources && resources.length > 0;
	if (!stackUrl && !hasAnyMeta && !hasResources) return null;

	return (
		<section className="max-w-content mx-auto px-6 md:px-12 pb-6">
			<div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-2 border-stroke-strong bg-bg-panel px-5 py-4">
				{/* Repository Link */}
				{stackUrl && (
					<a 
						href={stackUrl} 
						target="_blank" 
						rel="noopener noreferrer" 
						className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-accent-lime hover:text-accent-lime-strong transition-colors"
					>
						<GitBranch className="size-4" />
						Repository
					</a>
				)}

				{stackUrl && hasAnyMeta && <span className="text-stroke-strong">|</span>}

				{/* Meta items with counts */}
				<ul className="flex flex-wrap items-center gap-4" aria-label="Stack metadata coverage">
					{metaItems.map((item) => {
						const arr = arrays[item.key];
						if (!arr || arr.length === 0) return null;
						const Icon = item.icon;
						return (
							<li
								key={item.key}
								aria-label={`${item.label}: ${arr.length} items`}
								className="inline-flex items-center gap-1.5 font-mono text-xs text-fg-primary"
							>
								<Icon className="size-3.5 text-accent-lime" />
								<span>{item.label}</span>
								<span className="text-fg-muted">({arr.length})</span>
							</li>
						);
					})}
				</ul>

				{hasResources && (stackUrl || hasAnyMeta) && <span className="text-stroke-strong">|</span>}

				{/* Resources */}
				{hasResources && (
					<div className="flex flex-wrap items-center gap-4">
						{resources?.map((resource) => (
							<a 
								key={resource.url} 
								href={resource.url} 
								target="_blank" 
								rel="noopener noreferrer" 
								className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-accent-lime hover:text-accent-lime-strong transition-colors"
							>
								<BookOpen className="size-3.5" />
								{resource.label}
							</a>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
