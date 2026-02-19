import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WizardStep } from "./WizardSidebar";
import { steps } from "./WizardSidebar";

type WizardNavigationProps = {
	currentStep: WizardStep;
	onPrevious: () => void;
	onNext: () => void;
};

function WizardNavigation({ currentStep, onPrevious, onNext }: WizardNavigationProps) {
	const currentIndex = steps.findIndex((s) => s.id === currentStep);
	const isFirst = currentIndex === 0;
	const isLast = currentIndex === steps.length - 1;

	return (
		<div className="flex items-center justify-between border-t border-stroke-subtle pt-6">
			<Button
				type="button"
				variant="ghost"
				onClick={onPrevious}
				disabled={isFirst}
				className="gap-2 font-mono text-xs uppercase tracking-wider text-fg-muted hover:text-fg-primary disabled:opacity-30"
			>
				<ArrowLeft className="size-4" />
				Previous
			</Button>

			<div className="flex items-center gap-2">
				{steps.map((step, index) => (
					<div
						key={step.id}
						className={`size-2 border transition-colors ${
							index === currentIndex
								? "border-accent-lime bg-accent-lime"
								: index < currentIndex
									? "border-accent-lime bg-transparent"
									: "border-stroke-subtle bg-transparent"
						}`}
					/>
				))}
			</div>

			{!isLast && (
				<Button
					type="button"
					variant="ghost"
					onClick={onNext}
					className="gap-2 border border-stroke-subtle font-mono text-xs uppercase tracking-wider text-fg-primary hover:border-accent-lime hover:text-accent-lime"
				>
					Next
					<ArrowRight className="size-4" />
				</Button>
			)}

			{isLast && <div className="w-24" />}
		</div>
	);
}

export { WizardNavigation };
export type { WizardNavigationProps };
