import { FileText, Layers, Package, Settings, User } from "lucide-react";
import { Button } from "./ui/button";

interface StackEditorSidebarProps {
	activeSection: string;
}

const sections = [
	{ id: "profile", label: "Profile & Bio", icon: User },
	{ id: "tools", label: "Tools Stack", icon: Layers },
	{ id: "bundles", label: "Bundles", icon: Package },
	{ id: "description", label: "Description", icon: FileText },
	{ id: "settings", label: "Settings & Meta", icon: Settings },
];

export function StackEditorSidebar({ activeSection }: StackEditorSidebarProps) {
	const scrollToSection = (sectionId: string) => {
		const element = document.getElementById(`section-${sectionId}`);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	};

	return (
		<aside className="sticky top-[73px] h-[calc(100vh-73px)] w-64 bg-slate-900/50 border-r border-gray-800 p-4 space-y-2">
			<div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
				Sections
			</div>
			{sections.map((section) => {
				const Icon = section.icon;
				const isActive = activeSection === section.id;
				return (
					<Button
						key={section.id}
						type="button"
						variant="ghost"
						onClick={() => scrollToSection(section.id)}
						className={`w-full justify-start gap-3 px-4 rounded-lg relative ${
							isActive
								? "text-cyan-400 hover:text-cyan-400 hover:bg-transparent"
								: "text-gray-400 hover:text-white hover:bg-slate-800"
						}`}
					>
						{isActive && (
							<div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 rounded-r" />
						)}
						<Icon className="h-4 w-4" />
						{section.label}
					</Button>
				);
			})}
		</aside>
	);
}
