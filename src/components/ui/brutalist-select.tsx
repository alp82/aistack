import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type BrutalistSelectOption<T extends string> = {
	value: T;
	label: string;
};

type BrutalistSelectProps<T extends string> = {
	options: BrutalistSelectOption<T>[];
	value: T;
	onChange: (value: T) => void;
	placeholder?: string;
	className?: string;
	size?: "default" | "sm";
};

export function BrutalistSelect<T extends string>({
	options,
	value,
	onChange,
	placeholder = "Select...",
	className,
	size = "default",
}: BrutalistSelectProps<T>) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const selectedOption = options.find((o) => o.value === value);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [isOpen]);

	return (
		<div ref={containerRef} className={cn("relative", className)}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={cn(
					"flex w-full items-center justify-between border-2 border-stroke-subtle bg-bg-panel font-mono uppercase tracking-wider transition-all cursor-pointer",
					size === "default" ? "text-xs px-3 h-10" : "text-[10px] px-2 h-8",
					isOpen && "border-accent-lime",
					"hover:border-fg-muted",
				)}
			>
				<span className={selectedOption ? "text-fg-primary" : "text-fg-muted"}>
					{selectedOption?.label ?? placeholder}
				</span>
				<ChevronDown
					className={cn(
						"size-4 text-fg-muted transition-transform",
						isOpen && "rotate-180",
					)}
				/>
			</button>

			{isOpen && (
				<div className="absolute left-0 right-0 top-full z-50 mt-1 border-2 border-stroke-subtle bg-bg-panel shadow-lg">
					{options.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => {
								onChange(option.value);
								setIsOpen(false);
							}}
							className={cn(
								"flex w-full items-center px-3 py-2 font-mono uppercase tracking-wider transition-colors cursor-pointer",
								size === "default" ? "text-xs" : "text-[10px]",
								option.value === value
									? "bg-accent-lime/20 text-accent-lime"
									: "text-fg-muted hover:bg-bg-panel-muted hover:text-fg-primary",
							)}
						>
							{option.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
