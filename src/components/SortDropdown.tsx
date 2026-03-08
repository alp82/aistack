import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SortOption<T extends string> = {
	value: T;
	label: string;
};

type SortDropdownProps<T extends string> = {
	options: SortOption<T>[];
	value: T;
	onChange: (value: T) => void;
	className?: string;
};

function SortDropdown<T extends string>({
	options,
	value,
	onChange,
	className,
}: SortDropdownProps<T>) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	const selectedOption = options.find((o) => o.value === value);

	return (
		<div ref={dropdownRef} className={cn("relative", className)}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 h-12 px-4 border border-stroke-strong bg-bg-canvas text-fg-muted hover:border-accent-lime hover:text-fg-primary transition-colors"
			>
				<span className="uppercase text-xs tracking-wider">Sort:</span>
				<span className="uppercase text-xs font-bold">
					{selectedOption?.label}
				</span>
				<ChevronDown
					className={cn("size-4 transition-transform", isOpen && "rotate-180")}
				/>
			</button>
			{isOpen && (
				<div className="absolute right-0 top-full mt-1 z-20 bg-bg-panel border border-stroke-strong shadow-lg min-w-[180px]">
					{options.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => {
								onChange(option.value);
								setIsOpen(false);
							}}
							className={cn(
								"w-full px-4 py-2 text-left uppercase text-xs font-bold transition-colors",
								value === option.value
									? "bg-accent-lime/10 text-accent-lime"
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

export { SortDropdown };
export type { SortDropdownProps, SortOption };
