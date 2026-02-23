import { cn } from "@/lib/utils";

export type BrutalistToggleOption<T extends string> = {
	value: T;
	label: string;
};

type BrutalistToggleProps<T extends string> = {
	options: BrutalistToggleOption<T>[];
	value: T;
	onChange: (value: T) => void;
	className?: string;
	size?: "default" | "sm";
};

export function BrutalistToggle<T extends string>({
	options,
	value,
	onChange,
	className,
	size = "default",
}: BrutalistToggleProps<T>) {
	return (
		<div className={cn("flex", className)}>
			{options.map((option, index) => {
				const isSelected = option.value === value;
				const isFirst = index === 0;

				return (
					<button
						key={option.value}
						type="button"
						onClick={() => onChange(option.value)}
						className={cn(
							"border-2 font-mono uppercase tracking-wider transition-all cursor-pointer",
							size === "default" ? "text-xs px-4 h-12" : "text-[10px] px-3 h-8",
							!isFirst && "border-l-0",
							isSelected
								? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
								: "border-stroke-subtle bg-transparent text-fg-muted hover:text-fg-primary",
						)}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}
