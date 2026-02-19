import { cn } from "@/lib/utils";

type AudienceFilter = "all" | "solo" | "team";

type ToolOption = {
	id: string;
	label: string;
	count: number;
};

type FeedFiltersProps = {
	audienceFilter: AudienceFilter;
	onAudienceFilterChange: (value: AudienceFilter) => void;
	toolFilter: string;
	onToolFilterChange: (value: string) => void;
	toolOptions: ToolOption[];
};

type SegmentedOption = {
	id: string;
	label: string;
	count?: number;
};

function SegmentedControls({
	legend,
	options,
	active,
	onChange,
}: {
	legend: string;
	options: SegmentedOption[];
	active: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="space-y-1.5">
			<p className="text-[0.65rem] uppercase tracking-[0.2em] text-fg-muted">{legend}</p>
			<div className="inline-flex max-w-full items-center gap-1 overflow-x-auto border border-stroke-subtle bg-bg-panel-muted p-1">
				{options.map((option) => {
					const isActive = option.id === active;
					return (
						<button
							key={option.id}
							type="button"
							onClick={() => onChange(option.id)}
							aria-pressed={isActive}
							className={cn(
								"inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 text-xs font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-lime focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas",
								isActive
									? "bg-accent-lime text-bg-canvas"
									: "bg-bg-panel text-fg-secondary hover:bg-bg-panel-elevated hover:text-fg-primary",
							)}
						>
							<span>{option.label}</span>
							{typeof option.count === "number" && (
								<span
									className={cn(
										"rounded-full px-1.5 py-0.5 text-[10px]",
										isActive ? "bg-bg-panel/25 text-bg-canvas" : "bg-bg-panel-muted text-fg-muted",
									)}
								>
									{option.count}
								</span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}

function FeedFilters({
	audienceFilter,
	onAudienceFilterChange,
	toolFilter,
	onToolFilterChange,
	toolOptions,
}: FeedFiltersProps) {
	const audienceOptions: SegmentedOption[] = [
		{ id: "all", label: "All" },
		{ id: "solo", label: "Solo" },
		{ id: "team", label: "Team" },
	];

	const toolSegments: SegmentedOption[] = [{ id: "all", label: "All" }, ...toolOptions];

	return (
		<div className="flex flex-wrap items-center gap-4 border border-stroke-subtle bg-bg-panel/60 p-3">
			<SegmentedControls
				legend="Builder profile"
				options={audienceOptions}
				active={audienceFilter}
				onChange={(value) => onAudienceFilterChange(value as AudienceFilter)}
			/>
			{toolOptions.length > 0 && (
				<SegmentedControls
					legend="Tool category"
					options={toolSegments}
					active={toolFilter}
					onChange={onToolFilterChange}
				/>
			)}
		</div>
	);
}

export { FeedFilters };
