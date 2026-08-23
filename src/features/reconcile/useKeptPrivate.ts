import { useMutation, useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export type NameCategory =
	| "builtinTools"
	| "machines"
	| "mcpServers"
	| "skills"
	| "subagents"
	| "slashCommands";

export type KeptPrivateName = {
	category: NameCategory;
	name: string;
	count?: number;
	group: string | null;
	published: boolean;
};

/** One plugin's names, or the ungrouped remainder under a `null` group. */
export type KeptPrivateGroup = {
	group: string | null;
	names: KeptPrivateName[];
};

/**
 * The `Kept private` view's state - wayfinder #51, building #48.
 *
 * Two things are worth stating, because both are decisions rather than detail:
 *
 *   1. TICKING IS NOT PUBLISHING. A tick is a standing permission that takes
 *      effect at the NEXT sync, so nothing here writes a snapshot. #48 records
 *      the near-miss: a server-side snapshot on tick would bump `receivedAt` and
 *      let a web checkbox fake the 7-day living-stacks bar.
 *   2. A BULK TICK STORES EVERY NAME EXPANDED (#42 decision 3). The group is a
 *      way to look at the list, never a way to store it - a stored `foo:*` would
 *      be a standing grant to names that do not exist yet.
 */
export function useKeptPrivate(stackId: Id<"stacks"> | undefined) {
	const data = useQuery(
		api.measured.listKeptPrivate,
		stackId ? { stackId } : "skip",
	);
	const addOptIns = useMutation(api.measured.addPublishedNameOptIns);
	const removeOptIns = useMutation(api.measured.removePublishedNameOptIns);
	const setReview = useMutation(api.measured.setReviewKeptPrivate);

	const [error, setError] = useState<string | null>(null);
	const [justTicked, setJustTicked] = useState<string[]>([]);

	const names: KeptPrivateName[] = useMemo(() => data?.names ?? [], [data]);

	/** Grouped for display, standalone names last. */
	const groups: KeptPrivateGroup[] = useMemo(() => {
		const byGroup = new Map<string | null, KeptPrivateName[]>();
		for (const name of names) {
			const held = byGroup.get(name.group);
			if (held) held.push(name);
			else byGroup.set(name.group, [name]);
		}
		return [...byGroup.entries()]
			.map(([group, rows]) => ({ group, names: rows }))
			.sort((a, b) => {
				if (a.group === null) return 1;
				if (b.group === null) return -1;
				return a.group.localeCompare(b.group);
			});
	}, [names]);

	const run = useCallback(
		async (
			fn: () => Promise<unknown>,
			ticked: KeptPrivateName[],
			publishing: boolean,
		) => {
			if (!stackId) return;
			setError(null);
			try {
				await fn();
				const keys = ticked.map((n) => `${n.category}:${n.name}`);
				setJustTicked((prev) =>
					publishing
						? [...new Set([...prev, ...keys])]
						: prev.filter((k) => !keys.includes(k)),
				);
			} catch (e) {
				setError(
					e instanceof Error ? e.message : "That did not save. Try again.",
				);
			}
		},
		[stackId],
	);

	const publish = useCallback(
		(rows: KeptPrivateName[]) =>
			run(
				() =>
					addOptIns({
						stackId: stackId as Id<"stacks">,
						// Expanded, one row per name - never the group.
						names: rows.map((r) => ({ category: r.category, name: r.name })),
					}),
				rows,
				true,
			),
		[run, addOptIns, stackId],
	);

	const keepPrivate = useCallback(
		(rows: KeptPrivateName[]) =>
			run(
				() =>
					removeOptIns({
						stackId: stackId as Id<"stacks">,
						names: rows.map((r) => ({ category: r.category, name: r.name })),
					}),
				rows,
				false,
			),
		[run, removeOptIns, stackId],
	);

	const toggleReview = useCallback(
		async (enabled: boolean) => {
			if (!stackId) return;
			setError(null);
			try {
				await setReview({ stackId, enabled });
			} catch (e) {
				setError(
					e instanceof Error ? e.message : "That did not save. Try again.",
				);
			}
		},
		[stackId, setReview],
	);

	return {
		loading: data === undefined,
		reviewEnabled: data?.reviewEnabled ?? true,
		groups,
		/**
		 * The tab's number. It counts what is still held back - a published name
		 * shows in this view so it can be taken back, but it is not kept private,
		 * and counting it would make the number say the opposite of its label.
		 */
		count: names.filter((n) => !n.published).length,
		justTicked,
		publish,
		keepPrivate,
		toggleReview,
		error,
	};
}

export type KeptPrivateRun = ReturnType<typeof useKeptPrivate>;
