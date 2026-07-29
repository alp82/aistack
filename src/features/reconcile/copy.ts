/**
 * Every user-facing string on the changes page, in one file.
 *
 * Wayfinder ticket #43 (map #29), building the variant J design locked by #39.
 * The vocabulary is part of that decision and BINDS THIS BUILD. None of the
 * words in the left column may appear in anything the owner reads:
 *
 *   reconcile ................ what's changed
 *   the measured layer ....... from your machine
 *   authored ................. what you've listed / your stack
 *   suggestion ............... thing to look at
 *   missing_from_authored .... "You use this, but it's not on your stack"
 *   missing_what_for ......... "You haven't said what you use this for"
 *   what-for note ............ note
 *   dismiss .................. hide
 *   undismiss ................ bring it back
 *   snapshot ................. your last check
 *   receivedAt ............... "checked 2h ago"
 *   focus mode ............... one at a time
 *   list mode ................ whole list
 *   ledger ................... history
 *   token share .............. "62% of everything you ran"
 *   harness .................. Claude Code
 *
 * Two terms are deliberately KEPT, because replacing them would be a lie:
 * "at API prices" (the dollar figure is not a bill — #37 was explicit) and
 * "Claude Code" (a product name, not jargon).
 */

/**
 * The kicker every surface of this feature leads with. A string rather than
 * JSX text because the `//` prefix reads as a comment to the linter.
 */
export const KICKER = "// from your machine";

/** The same, for the state where nothing has arrived yet. */
export const KICKER_EMPTY = "// nothing from your machine yet";

export type ReconcileItem = {
	atomKind: "model" | "tool" | "mcpServer" | "skill";
	atomKey: string;
	label: string;
	kind: "missing_from_authored" | "missing_what_for";
	tokenShare?: number;
	apiEquivalentUSD?: number;
};

/** What the item is asking the owner. */
export function askLine(item: ReconcileItem): string {
	return item.kind === "missing_from_authored"
		? "You use this, but it's not on your stack"
		: "You haven't said what you use this for";
}

/** "62% of everything you ran" — a share, never a raw token count. */
export function usageLine(item: ReconcileItem): string | null {
	if (item.tokenShare === undefined) return null;
	return `${Math.round(item.tokenShare * 100)}% of everything you ran`;
}

/** "≈$3,402 at API prices" — absent when the sync withheld cost. */
export function priceLine(item: ReconcileItem): string | null {
	if (item.apiEquivalentUSD === undefined) return null;
	return `≈$${Math.round(item.apiEquivalentUSD).toLocaleString("en-US")} at API prices`;
}

/** The one line the sticky banner leads with. */
export function headline(args: {
	hasSnapshot: boolean;
	openCount: number;
	doneCount: number;
}): string {
	if (args.openCount > 0) {
		return `${args.openCount} ${args.openCount === 1 ? "thing" : "things"} to look at`;
	}
	if (!args.hasSnapshot) return "We haven't looked at your machine yet";
	return args.doneCount > 0
		? "All caught up"
		: "Your stack matches how you work";
}

/**
 * The `Kept private` view — wayfinder #51, strings fixed by the grilling #48.
 *
 * The owner made the exact wording binding, so these are quoted, not authored.
 * They are short on purpose: the switch has to state what it does in the two
 * lines a person reads before their machine uploads anything.
 *
 * `KEEP_PRIVATE` is the one string #48 did not fix. It is the inverse of
 * `PUBLISH` — the same action read backwards — and it says the state the row
 * returns to, in the vocabulary the rest of the feature already uses.
 */
export const KEPT_PRIVATE = {
	SWITCH: "Review kept-private names here",
	SWITCH_HELP:
		"Your machine sends them so you can publish them. Off means we never see them.",
	TAB: "Kept private",
	PUBLISH: "publish",
	PUBLISH_ALL: "publish all",
	KEEP_PRIVATE: "keep private",
	TICKED: "Publishes on your next sync.",
	EMPTY: "Nothing kept private.",
	NEVER_SYNCED: "Sync to see names.",
} as const;

/** How long ago we last looked, said the way a person would say it. */
export function lastCheckedLine(
	hasSnapshot: boolean,
	checkedAgo: string,
): string {
	return hasSnapshot ? `Checked ${checkedAgo}` : "Never checked";
}
