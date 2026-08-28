import { useQuery } from "convex/react";
import { useState } from "react";
import { AutoSyncBox } from "@/features/measured/AutoSyncBox";
import { KICKER, MEASURED_ANCHOR, TITLE } from "@/features/measured/copy";
import { isStale } from "@/features/measured/freshness";
import { Section, SectionHeader } from "@/features/stack-view/ui";
import { Lead } from "@/features/workflow/Lead";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { ControlBar, type MachineChoice } from "./ControlBar";
import { EMPTY_TAB, type RangeId, rangeDays } from "./copy";
import { packTab } from "./grid";
import { buildItems, type Group, pick, TOPIC, type UsageSource } from "./items";
import { NeverMeasured, OwnerNotMeasured } from "./NotMeasured";
import { Tabs } from "./Tabs";
import { TopBlock, type TopSource } from "./TopBlock";

/**
 * Journey section 01, Actual Usage: the merged measured section (#307, map
 * #302, spec `docs/specs/workflow-surface.md`, "The section").
 *
 * THREE READS, ONE CONTROL BAR. `getUsageByStackSlug` folds the per-day usage
 * rows for the range and the machine and answers both sides of the previous
 * period; `getWorkflowByStackSlug` folds the workflow rows for the same window
 * and machine; `getCurrentByStackSlug` (with its history) is the legacy 30-day
 * snapshot, the only reading a stack has before it publishes days.
 *
 * THE SECTION RANKS NOTHING. The first screen is a fixed editorial pick, the
 * tabs hold a fixed order, and the owner has no per-row control.
 *
 * A null reading renders an INVITATION addressed to the reader, never a
 * demerit on the author. The one exception is the owner looking at their own
 * unsynced stack: they get the command that closes the gap (#58).
 */
export function UsageSection({
	index,
	slug,
	stackId,
	isOwner,
	stackToolSlugs,
}: {
	index: number;
	slug: string;
	stackId: Id<"stacks">;
	isOwner: boolean;
	stackToolSlugs: string[];
}) {
	const [range, setRange] = useState<RangeId>("30d");
	const [selection, setSelection] = useState<{
		slug: string;
		ordinal: number;
	} | null>(null);
	const [tab, setTab] = useState<string>(TOPIC[0].id);
	const ordinal = selection?.slug === slug ? selection.ordinal : null;
	const machineArg = ordinal === null ? {} : { machineOrdinal: ordinal };

	const usage = useQuery(api.measured.getUsageByStackSlug, {
		slug,
		range,
		...machineArg,
	});
	const snapshot = useQuery(api.measured.getCurrentByStackSlug, {
		slug,
		...machineArg,
	});
	const hasDays = usage?.hasDays === true;
	// The snapshot series only serves the legacy path: with days the watermark
	// is the per-day series the usage read already carries.
	const history = useQuery(
		api.measured.getHistoryByStackSlug,
		usage === undefined || hasDays ? "skip" : { slug, ...machineArg },
	);
	const view = useQuery(api.workflow.getWorkflowByStackSlug, {
		slug,
		window: range,
		...machineArg,
	});

	const answered = usage !== undefined && snapshot !== undefined;
	const machines = machineChoices(usage, snapshot);
	const receivedAt = usage?.receivedAt ?? snapshot?.receivedAt ?? null;
	// Past 48 hours the switch is the page's remedy, so it stands BEFORE the
	// reading it keeps arriving. A stack that never synced is not late (it may
	// be hand-curated), so it never promotes anything (#107 decisions 1 and 3).
	const staleSince =
		receivedAt !== null && isStale(receivedAt) ? receivedAt : null;

	const top: TopSource | null =
		usage && hasDays
			? { kind: "days", usage }
			: snapshot
				? { kind: "snapshot", snapshot, points: history?.points ?? [] }
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
			: snapshot && range === "30d"
				? { kind: "snapshot", snapshot }
				: null;
	const items = buildItems(view, source, stackToolSlugs);
	const group = TOPIC.find((g) => g.id === tab) ?? TOPIC[0];
	const shown = pick(items, group.ids);
	const counts = (g: Group) => pick(items, g.ids).length;
	const hasLead = view !== null && view !== undefined && view.window.days > 0;

	return (
		<Section index={index} id={MEASURED_ANCHOR}>
			<SectionHeader
				index={String(index).padStart(2, "0")}
				kicker={KICKER}
				title={TITLE}
				metaAlwaysVisible
				meta={
					<ControlBar
						range={range}
						onRange={setRange}
						machines={machines}
						machine={ordinal}
						onMachine={(next) =>
							setSelection(next === null ? null : { slug, ordinal: next })
						}
						receivedAt={receivedAt}
					/>
				}
			/>
			{/* The owner box (#104) sits inside the section it governs and does
			    NOT wait for a reading, because it is the fix for a stack that has
			    none. Which side it sits on is the reading's answer, so it waits for
			    that. Renders nothing for a visitor, query and all. */}
			{answered && staleSince !== null && (
				<AutoSyncBox
					stackId={stackId}
					isOwner={isOwner}
					staleSince={staleSince}
				/>
			)}
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
					<Tabs groups={TOPIC} counts={counts} value={tab} onChange={setTab} />
					<div className="mt-8" role="tabpanel">
						{hasLead && group.id === "time" && <Lead view={view} />}
						{shown.length === 0 ? (
							<p className="font-mono text-sm text-fg-muted">{EMPTY_TAB}</p>
						) : (
							packTab(group.id, shown, range)
						)}
					</div>
				</>
			)}
			{answered && staleSince === null && (
				<AutoSyncBox stackId={stackId} isOwner={isOwner} />
			)}
		</Section>
	);
}

/**
 * The machines the selector offers, by their durable ordinal (#250). The usage
 * read lists every machine with rows or snapshots; a stack whose usage read is
 * null still gets the snapshot's harness machines.
 */
function machineChoices(
	usage:
		| { machines: { machine: string | null; machineOrdinal: number | null }[] }
		| null
		| undefined,
	snapshot:
		| { harnesses: { machine: string | null; machineOrdinal: number | null }[] }
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
	for (const h of snapshot?.harnesses ?? []) add(h.machine, h.machineOrdinal);
	return [...byOrdinal.values()].sort((a, b) => a.ordinal - b.ordinal);
}
