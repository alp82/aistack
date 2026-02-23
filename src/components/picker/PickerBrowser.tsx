import { Search } from "lucide-react";
import { type ReactNode } from "react";
import { Input } from "../ui/input";

type PickerBrowserProps = {
	search: string;
	onSearchChange: (value: string) => void;
	searchPlaceholder?: string;
	filterSlot?: ReactNode;
	children: ReactNode;
	emptyMessage?: string;
	isEmpty?: boolean;
	footer?: ReactNode;
	customInputSlot?: ReactNode;
};

export function PickerBrowser({
	search,
	onSearchChange,
	searchPlaceholder = "Search...",
	filterSlot,
	children,
	emptyMessage = "No items found.",
	isEmpty = false,
	footer,
	customInputSlot,
}: PickerBrowserProps) {
	return (
		<div className="space-y-3 border border-stroke-subtle bg-bg-panel p-3">
			{/* Search + Filter Row */}
			<div className="flex gap-2">
				<div className="relative flex-1">
					<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-fg-muted" />
					<Input
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder={searchPlaceholder}
						className="h-8 pl-8 text-xs"
					/>
				</div>
				{filterSlot}
			</div>

			{/* Content */}
			{isEmpty ? (
				<p className="py-2 text-center font-mono text-xs text-fg-muted">
					{emptyMessage}
				</p>
			) : (
				children
			)}

			{/* Custom Input Slot */}
			{customInputSlot}

			{/* Footer */}
			{footer}
		</div>
	);
}
