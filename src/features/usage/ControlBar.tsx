import { RelativeTime } from "@/components/RelativeTime";
import { cn } from "@/lib/utils";
import { ALL_MACHINES, RANGES, type RangeId } from "./copy";

export type MachineChoice = {
	readonly ordinal: number;
	readonly label: string;
};

/**
 * The one control bar in the header meta (spec, "The section"): the range,
 * the machine selector, and "checked N ago". Every sum and share in the
 * section follows the range and the machine.
 */
export function ControlBar({
	range,
	onRange,
	machines,
	machine,
	onMachine,
	receivedAt,
}: {
	range: RangeId;
	onRange: (next: RangeId) => void;
	machines: readonly MachineChoice[];
	machine: number | null;
	onMachine: (next: number | null) => void;
	receivedAt: number | null;
}) {
	return (
		<div className="flex flex-wrap items-center gap-3 normal-case tracking-normal">
			<fieldset className="inline-flex border border-stroke-subtle">
				<legend className="sr-only">Range</legend>
				{RANGES.map((option) => (
					<button
						key={option.id}
						type="button"
						aria-pressed={range === option.id}
						onClick={() => onRange(option.id)}
						className={cn(
							"border-r border-stroke-subtle px-2.5 py-1 font-mono text-[11px] last:border-r-0",
							range === option.id
								? "bg-accent-lime font-bold text-accent-lime-contrast"
								: "text-fg-muted hover:text-fg-primary",
						)}
					>
						{option.label}
					</button>
				))}
			</fieldset>
			{machines.length > 1 && (
				<select
					aria-label="Machine"
					value={machine ?? ""}
					onChange={(event) =>
						onMachine(
							event.target.value === "" ? null : Number(event.target.value),
						)
					}
					className="border border-stroke-subtle bg-bg-canvas px-2 py-1 font-mono text-[11px] text-fg-primary"
				>
					<option value="">{ALL_MACHINES}</option>
					{machines.map((option) => (
						<option key={option.ordinal} value={String(option.ordinal)}>
							{option.label}
						</option>
					))}
				</select>
			)}
			{receivedAt !== null && (
				<span className="font-mono text-[11px] text-fg-muted">
					checked <RelativeTime at={receivedAt} />
				</span>
			)}
		</div>
	);
}
