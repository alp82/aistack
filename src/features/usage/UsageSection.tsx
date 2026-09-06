import { useQuery } from "convex/react";
import { useState } from "react";
import { KICKER, MEASURED_ANCHOR, TITLE } from "@/features/measured/copy";
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { api } from "../../../convex/_generated/api";
import { UsageAccordion } from "./Accordion";
import { ControlBar, type MachineChoice } from "./ControlBar";
import { type RangeId, rangeDays } from "./copy";
import { buildItems, pick, TOPIC, type UsageSource } from "./items";
import { NeverMeasured, OwnerNotMeasured } from "./NotMeasured";
import { TopBlock, type TopSource } from "./TopBlock";
import { topicWatermark } from "./watermarks";

/**
 * Journey section 01, Stats: the merged measured section (#307, map #302,
 * spec `docs/specs/workflow-surface.md`, "The section"; compact layout #356).
 *
 * TWO READS, ONE RANGE. The range belongs to the page and is fixed at 30 days
 * (`PAGE_RANGE`): the route hands it down so the hero tile, the nav figure and
 * this section all name and read the same window. There is no control over it.
 * The section's meta line carries the machine selector and the checked stamp.
 * `getUsageByStackSlug` folds the per-day usage rows for the range and the
 * machine and answers both sides of the previous period, and carries the
 * legacy 30-day figure for a stack that never published days (ADR-0011);
 * `getWorkflowByStackSlug` folds the workflow rows for the same window and
 * machine.
 *
 * THE SECTION RANKS NOTHING. The top block is a fixed editorial pick, the
 * accordion holds a fixed order, and the owner has no per-row control.
 *
 * EVERY TOPIC STARTS CLOSED. The five summary rows are the section's second
 * layer; a click opens one, and the depth is one click away on every screen.
 *
 * A null reading renders an INVITATION addressed to the reader, never a
 * demerit on the author. The one exception is the owner looking at their own
 * unsynced stack: they get the command that closes the gap (#58).
 */
export function UsageSection({
	index,
	slug,
	isOwner,
	stackToolSlugs,
	range,
}: {
	index: number;
	slug: string;
	isOwner: boolean;
	stackToolSlugs: string[];
	/** The page's window. Fixed at 30 days; the reader cannot change it. */
	range: RangeId;
}) {
	const [selection, setSelection] = useState<{
		slug: string;
		ordinal: number;
	} | null>(null);
	const [openTopic, setOpenTopic] = useState<string | null>(null);
	const ordinal = selection?.slug === slug ? selection.ordinal : null;
	const machineArg = ordinal === null ? {} : { machineOrdinal: ordinal };

	const usage = useQuery(api.measured.getUsageByStackSlug, {
		slug,
		range,
		...machineArg,
	});
	const hasDays = usage?.hasDays === true;
	const legacy = usage?.legacy ?? null;
	const view = useQuery(api.workflow.getWorkflowByStackSlug, {
		slug,
		window: range,
		...machineArg,
	});

	const answered = usage !== undefined;
	const machines = machineChoices(usage);
	const receivedAt = usage?.receivedAt ?? null;

	const top: TopSource | null =
		usage && hasDays
			? { kind: "days", usage }
			: legacy
				? { kind: "legacy", legacy }
				: null;
	const source: UsageSource =
		usage && hasDays
			? usage.current
				? {
						kind: "days",
						current: usage.current,
						previous: usage.previous,
						days: rangeDays(range),
					}
				: null
			: legacy && range === "30d"
				? { kind: "legacy", legacy }
				: null;
	const items = buildItems(view, source, stackToolSlugs);

	return (
		<Section
			index={index}
			id={MEASURED_ANCHOR}
			header={
				<SectionHeader
					index={String(index).padStart(2, "0")}
					kicker={KICKER}
					title={TITLE}
					metaAlwaysVisible
					meta={
						<ControlBar
							machines={machines}
							machine={ordinal}
							onMachine={(next) =>
								setSelection(next === null ? null : { slug, ordinal: next })
							}
							receivedAt={receivedAt}
						/>
					}
				/>
			}
		>
			{/* Undefined is "not answered yet", and it must not read as "never
			    measured": the invitation waits until both reads have spoken. */}
			{!answered ? null : top === null ? (
				isOwner ? (
					<OwnerNotMeasured />
				) : (
					<NeverMeasured />
				)
			) : (
				<>
					<TopBlock source={top} range={range} />
					<UsageAccordion
						groups={TOPIC}
						items={(group) => pick(items, group.ids)}
						value={openTopic}
						onChange={setOpenTopic}
						range={range}
						watermark={(group) =>
							topicWatermark(
								group.id,
								view,
								source?.kind === "days" ? source.current : null,
								usage?.series ?? [],
							)
						}
					/>
				</>
			)}
		</Section>
	);
}

/**
 * The machines the selector offers, by their durable ordinal (#250). The usage
 * read lists every machine with a day row or an inventory row.
 */
function machineChoices(
	usage:
		| { machines: { machine: string | null; machineOrdinal: number | null }[] }
		| null
		| undefined,
): MachineChoice[] {
	const byOrdinal = new Map<number, MachineChoice>();
	const add = (machine: string | null, machineOrdinal: number | null) => {
		if (machineOrdinal === null) return;
		const held = byOrdinal.get(machineOrdinal);
		byOrdinal.set(machineOrdinal, {
			ordinal: machineOrdinal,
			label: machine ?? held?.label ?? `machine ${machineOrdinal}`,
		});
	};
	for (const m of usage?.machines ?? []) add(m.machine, m.machineOrdinal);
	return [...byOrdinal.values()].sort((a, b) => a.ordinal - b.ordinal);
}
