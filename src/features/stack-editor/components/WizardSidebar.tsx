import { FileText, Terminal, User } from "lucide-react";
import { cn } from "@/lib/utils";

type WizardStep = "details" | "tools" | "workflow";

type WizardStepConfig = {
	id: WizardStep;
	label: string;
	icon: typeof User;
};

const steps: WizardStepConfig[] = [
	{ id: "details", label: "Stack Details", icon: User },
	{ id: "tools", label: "Tools", icon: Terminal },
	{ id: "workflow", label: "Workflow", icon: FileText },
];

type WizardSidebarProps = {
	currentStep: WizardStep;
	onStepClick: (step: WizardStep) => void;
	completedSteps?: WizardStep[];
};

function WizardSidebar({ currentStep, onStepClick, completedSteps = [] }: WizardSidebarProps) {
	return (
		<aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-64 flex-col border-r border-stroke-subtle bg-bg-panel/80 backdrop-blur-sm lg:flex">
			<div className="flex-grow space-y-1 p-6">
				<div className="mb-6 border-b border-stroke-subtle pb-4">
					<p className="font-mono text-[10px] uppercase tracking-widest text-accent-lime">
						// Share Your Stack
					</p>
				</div>
				{steps.map((step, index) => {
					const Icon = step.icon;
					const isActive = currentStep === step.id;
					const isCompleted = completedSteps.includes(step.id);

					return (
						<button
							key={step.id}
							type="button"
							onClick={() => onStepClick(step.id)}
							className={cn(
								"group flex w-full items-center justify-between border-l-4 p-3 font-mono text-xs uppercase tracking-wider transition-all",
								isActive
									? "border-accent-lime bg-bg-panel-muted text-fg-primary"
									: "border-transparent text-fg-muted hover:border-stroke-subtle hover:bg-bg-panel-muted hover:text-fg-secondary",
							)}
						>
							<span className="flex items-center gap-3">
								<span className="flex size-6 items-center justify-center border border-stroke-subtle text-[10px]">
									{String(index + 1).padStart(2, "0")}
								</span>
								<Icon className="size-4" />
								{step.label}
							</span>
							{isCompleted && !isActive && (
								<span className="font-mono text-[10px] text-accent-lime">[ OK ]</span>
							)}
						</button>
					);
				})}
			</div>
		</aside>
	);
}

export { WizardSidebar, steps };
export type { WizardStep, WizardStepConfig, WizardSidebarProps };
