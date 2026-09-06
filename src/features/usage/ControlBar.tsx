import { RelativeTime } from "@/components/RelativeTime";
import { ALL_MACHINES } from "./copy";

export type MachineChoice = {
	readonly ordinal: number;
	readonly label: string;
};

/**
 * The section's meta line (#356): the machine selector when there is more than
 * one machine, and "checked N ago". The window is fixed at 30 days and the page
 * offers no control over it, so the only choice here is the machine. Every sum
 * and share in the section follows that machine.
 */
export function ControlBar({
	machines,
	machine,
	onMachine,
	receivedAt,
}: {
	machines: readonly MachineChoice[];
	machine: number | null;
	onMachine: (next: number | null) => void;
	receivedAt: number | null;
}) {
	return (
		<div className="flex flex-wrap items-center gap-3 normal-case tracking-normal">
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
