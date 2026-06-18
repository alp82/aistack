import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { ACCENT_PRESETS } from "@/features/stack-view/accentPresets";
import { cn } from "@/lib/utils";

type AccentPickerProps = {
	value: string;
	onChange: (key: string) => void;
	className?: string;
};

function AccentPicker({ value, onChange, className }: AccentPickerProps) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);

	const listboxId = useId();
	const currentKey = value || "lime";
	const current =
		ACCENT_PRESETS.find((p) => p.key === currentKey) ?? ACCENT_PRESETS[0];

	// Focus the selected option (or first option) when the panel opens
	useEffect(() => {
		if (!open) return;
		requestAnimationFrame(() => {
			if (!containerRef.current) return;
			const buttons = Array.from(
				containerRef.current.querySelectorAll<HTMLButtonElement>(
					'button[role="option"]',
				),
			);
			if (buttons.length === 0) return;
			const selected = buttons.find(
				(b) => b.getAttribute("aria-selected") === "true",
			);
			(selected ?? buttons[0]).focus();
		});
	}, [open]);

	useEffect(() => {
		if (!open) return;

		function handleMouseDown(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setOpen(false);
				triggerRef.current?.focus();
				return;
			}

			if (event.key === "ArrowDown" || event.key === "ArrowUp") {
				event.preventDefault();
				const buttons =
					containerRef.current?.querySelectorAll<HTMLButtonElement>(
						'button[role="option"]',
					);
				if (!buttons || buttons.length === 0) return;
				const list = Array.from(buttons);
				const index = list.indexOf(document.activeElement as HTMLButtonElement);
				const next =
					event.key === "ArrowDown"
						? index < 0
							? 0
							: (index + 1) % list.length
						: index < 0
							? list.length - 1
							: (index - 1 + list.length) % list.length;
				list[next].focus();
			}
		}

		document.addEventListener("mousedown", handleMouseDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handleMouseDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [open]);

	function handleSelect(key: string) {
		// Every preset (including lime) persists as its own key so picking lime
		// reliably overwrites a previously-saved color. accentClassFor("lime")
		// still resolves to "" so the default rendering is unchanged.
		onChange(key);
		setOpen(false);
		triggerRef.current?.focus();
	}

	return (
		<div ref={containerRef} className={cn("relative", className)}>
			<button
				ref={triggerRef}
				type="button"
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={listboxId}
				aria-label={`Accent color: ${current.name}`}
				onClick={() => setOpen((v) => !v)}
				className={cn(
					"flex w-full items-center gap-2 border-2 bg-bg-panel-muted px-3 h-12 font-mono text-xs uppercase tracking-wider cursor-pointer transition-all",
					open
						? "border-accent-lime"
						: "border-stroke-subtle hover:border-fg-muted",
				)}
			>
				<span
					aria-hidden="true"
					style={{ backgroundColor: current.swatchHex }}
					className="size-4 shrink-0 border border-stroke-strong"
				/>
				<span className="flex-1 text-left text-fg-primary truncate">
					{current.name}
				</span>
				<ChevronDown
					aria-hidden="true"
					className={cn(
						"size-4 shrink-0 text-fg-muted transition-transform",
						open && "rotate-180",
					)}
				/>
			</button>

			{open && (
				<div
					id={listboxId}
					role="listbox"
					aria-label="Accent color"
					className="absolute left-0 right-0 top-full z-50 mt-1 border-2 border-stroke-subtle bg-bg-panel shadow-lg"
				>
					{ACCENT_PRESETS.map((preset) => {
						const selected = preset.key === currentKey;
						return (
							<button
								key={preset.key}
								type="button"
								role="option"
								aria-selected={selected}
								onClick={() => handleSelect(preset.key)}
								className={cn(
									"flex w-full items-center gap-2 px-3 py-2 font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors text-left",
									selected
										? "bg-accent-lime/20 text-accent-lime"
										: "text-fg-muted hover:bg-bg-panel-muted hover:text-fg-primary",
								)}
							>
								<span
									aria-hidden="true"
									style={{ backgroundColor: preset.swatchHex }}
									className="size-4 shrink-0 border border-stroke-strong"
								/>
								<span className="flex-1">{preset.name}</span>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

export { AccentPicker };
