import { FileText, Package, Settings, Terminal, User } from "lucide-react";
import type {
	EditorSectionKey,
	EditorSectionStatuses,
} from "@/features/stack-editor/editor-status";

interface StackEditorSidebarProps {
	activeSection: EditorSectionKey;
	sectionStatuses: EditorSectionStatuses;
}

const sections: Array<{
	id: EditorSectionKey;
	label: string;
	icon: typeof User;
}> = [
	{ id: "profile", label: "Profile & Bio", icon: User },
	{ id: "tools", label: "Stack Tools", icon: Terminal },
	{ id: "bundles", label: "Bundles", icon: Package },
	{ id: "description", label: "Description", icon: FileText },
	{ id: "settings", label: "Settings", icon: Settings },
];

export function StackEditorSidebar({
	activeSection,
	sectionStatuses,
}: StackEditorSidebarProps) {
	const scrollToSection = (sectionId: string) => {
		const element = document.getElementById(`section-${sectionId}`);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	};

	return (
		<aside className="sticky top-[73px] h-[calc(100vh-73px)] w-64 bg-zinc-900/80 border-r border-zinc-800 backdrop-blur-sm flex flex-col">
			<div className="flex-grow p-6 space-y-2">
				{sections.map((section) => {
					const Icon = section.icon;
					const isActive = activeSection === section.id;
					const status = sectionStatuses[section.id];
					const isError = status.state === "error";
					const isComplete = status.state === "complete";

					return (
						<button
							key={section.id}
							type="button"
							aria-current={isActive ? "step" : undefined}
							aria-invalid={isError ? "true" : undefined}
							onClick={() => scrollToSection(section.id)}
							className={`w-full text-left p-3 border-l-4 font-mono text-xs uppercase tracking-wider transition-all flex justify-between items-center group
								${
									isActive
										? "border-accent-lime bg-zinc-800 text-fg-primary"
										: "border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
								}
							`}
						>
							<span className="flex items-center gap-3">
								<Icon className="h-4 w-4" />
								{section.label}
							</span>
							{isError && (
								<span className="text-[10px] text-red-400 font-bold">
									[ ! ]
								</span>
							)}
							{isComplete && !isError && (
								<span className="text-[10px] text-accent-lime font-bold">
									[ OK ]
								</span>
							)}
						</button>
					);
				})}
			</div>
		</aside>
	);
}
