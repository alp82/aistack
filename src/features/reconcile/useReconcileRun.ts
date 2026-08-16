import { useMutation, useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";
import { timeAgo } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { lastCheckedLine, type ReconcileItem } from "./copy";

export type Answer = "added" | "hidden";

export type HiddenItem = {
	atomKind: ReconcileItem["atomKind"];
	atomKey: string;
	label: string;
	hiddenAgo: string;
};

export type AddedItem = {
	atomKey: string;
	label: string;
	note?: string;
};

/**
 * One pass over what's changed, bound to the server.
 *
 * Everything durable lives in Convex - the open items are derived on read (#33
 * decision 12) and the hidden list is the only stored state. Three things are
 * session-local on purpose:
 *
 *   1. `notes` - what the owner is typing, before they save it.
 *   2. `added` - what they answered in THIS pass. Once answered, an item leaves
 *      the server's list for good, so the server cannot tell us what was just
 *      done and what was done last month.
 *   3. `answered` - the meter's denominator. It counts this pass, not all time,
 *      which is what makes 100% reachable.
 *
 * `answered` also hides an item the moment it is answered, so the card does not
 * sit there through the mutation round trip.
 */
export function useReconcileRun(stackId: Id<"stacks"> | undefined) {
	const data = useQuery(
		api.measured.getReconcileSuggestions,
		stackId ? { stackId } : "skip",
	);
	const dismissals = useQuery(
		api.measured.listDismissals,
		stackId ? { stackId } : "skip",
	);

	const applyWhatFor = useMutation(api.measured.applyWhatFor);
	const addMeasuredModel = useMutation(api.measured.addMeasuredModel);
	const dismiss = useMutation(api.measured.dismissSuggestion);
	const undismiss = useMutation(api.measured.undismissSuggestion);

	const [notes, setNotes] = useState<Record<string, string>>({});
	const [answered, setAnswered] = useState<AddedItem[]>([]);
	const [hiddenNow, setHiddenNow] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);

	const answeredKeys = useMemo(
		() => new Set([...answered.map((a) => a.atomKey), ...hiddenNow]),
		[answered, hiddenNow],
	);

	const open = useMemo(
		() => (data?.suggestions ?? []).filter((s) => !answeredKeys.has(s.atomKey)),
		[data, answeredKeys],
	);

	const hidden: HiddenItem[] = useMemo(
		() =>
			(dismissals ?? []).map((d) => ({
				atomKind: d.atomKind,
				atomKey: d.atomKey,
				label: d.label,
				hiddenAgo: timeAgo(d.dismissedAt),
			})),
		[dismissals],
	);

	const setNote = useCallback((atomKey: string, value: string) => {
		setNotes((prev) => ({ ...prev, [atomKey]: value }));
	}, []);

	const answer = useCallback(
		async (item: ReconcileItem, decision: Answer) => {
			if (!stackId) return;
			setError(null);
			const note = (notes[item.atomKey] ?? "").trim();

			// Optimistic: the item leaves the queue now, and comes back if the
			// write fails. Waiting for the round trip makes the keyboard flow
			// answer the wrong card.
			if (decision === "hidden")
				setHiddenNow((prev) => [...prev, item.atomKey]);
			else {
				setAnswered((prev) => [
					{ atomKey: item.atomKey, label: item.label, note: note || undefined },
					...prev,
				]);
			}

			try {
				if (decision === "hidden") {
					await dismiss({
						stackId,
						atomKind: item.atomKind,
						atomKey: item.atomKey,
					});
				} else if (item.kind === "missing_from_authored") {
					await addMeasuredModel({ stackId, modelSlug: item.atomKey });
				} else {
					await applyWhatFor({
						stackId,
						toolSlug: item.atomKey,
						whatFor: note,
					});
				}
			} catch (e) {
				if (decision === "hidden") {
					setHiddenNow((prev) => prev.filter((k) => k !== item.atomKey));
				} else {
					setAnswered((prev) => prev.filter((a) => a.atomKey !== item.atomKey));
				}
				setError(
					e instanceof Error ? e.message : "That did not save. Try again.",
				);
			}
		},
		[stackId, notes, dismiss, addMeasuredModel, applyWhatFor],
	);

	const bringBack = useCallback(
		async (item: HiddenItem) => {
			if (!stackId) return;
			setError(null);
			try {
				await undismiss({
					stackId,
					atomKind: item.atomKind,
					atomKey: item.atomKey,
				});
				// It is open again, so it must not stay filtered out of this pass.
				setHiddenNow((prev) => prev.filter((k) => k !== item.atomKey));
				setAnswered((prev) => prev.filter((a) => a.atomKey !== item.atomKey));
			} catch (e) {
				setError(
					e instanceof Error ? e.message : "That did not save. Try again.",
				);
			}
		},
		[stackId, undismiss],
	);

	const doneCount = answeredKeys.size;
	const total = open.length + doneCount;

	return {
		loading: data === undefined,
		hasSnapshot: data?.hasSnapshot ?? false,
		isFresh: data?.isFresh ?? false,
		checkedLine: lastCheckedLine(
			data?.hasSnapshot ?? false,
			data?.receivedAt ? timeAgo(data.receivedAt) : "never",
		),
		open,
		hidden,
		added: answered,
		notes,
		setNote,
		answer,
		bringBack,
		doneCount,
		total,
		percent: total === 0 ? 100 : Math.round((doneCount / total) * 100),
		error,
	};
}

export type ReconcileRun = ReturnType<typeof useReconcileRun>;
