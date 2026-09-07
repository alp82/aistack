import type { ContextReading as HarnessContextReading } from "@aistack/workflow-rules";

/**
 * The Context row's reading (#359): what a typical API call carries against
 * each harness's window, folded by the server (#358). The per-harness shape
 * is the shared package's, which is what `getWorkflowByStackSlug` returns.
 */
export type ContextHarness = HarnessContextReading;

export type ContextReading = { harnesses: ContextHarness[] } | null;

/** The reading off a workflow answer; null when the fold carried no block. */
export function contextOf(
	view: { context?: ContextReading } | null | undefined,
): ContextReading {
	const context = view?.context;
	if (!context || context.harnesses.length === 0) return null;
	return context;
}

/** The three series wear palette slots, never the accent (Charts rule). */
export const CONTEXT_PAINT = {
	harness: "var(--chart-4)",
	instructions: "var(--chart-2)",
	usualChat: "var(--chart-1)",
} as const;

export const CONTEXT_HINT = {
	harness:
		"what the harness itself sends on every call: system prompt and tool definitions",
	instructions:
		"what the owner added: CLAUDE.md, memory, skills, agents, the first prompt",
	usualChat: "the median call, after the harness and instructions",
	longChat: "1 in 10 chats grow past this, after the harness and instructions",
} as const;

/** 200 cells in 20 columns: one cell is 0.5% of the window. */
export const WAFFLE_CELLS = 200;

export type WaffleCell =
	| "harness"
	| "instructions"
	| "usualChat"
	| "longChat"
	| "free";

/**
 * The fill of the grid, from the top left: harness, instructions and usual
 * chat up to the median call, outlined cells up to the p90, free after that.
 */
export function waffleCells(h: ContextHarness, window: number): WaffleCell[] {
	const cell = window / WAFFLE_CELLS;
	const harness = Math.round(h.harnessTokens / cell);
	const instructions = Math.round(h.instructionsTokens / cell);
	const filled = Math.max(
		harness + instructions,
		Math.round(h.medianCall / cell),
	);
	const p90 = Math.min(WAFFLE_CELLS, Math.round(h.p90Call / cell));
	return Array.from({ length: WAFFLE_CELLS }, (_, i) => {
		if (i < harness) return "harness";
		if (i < harness + instructions) return "instructions";
		if (i < filled) return "usualChat";
		if (i < p90) return "longChat";
		return "free";
	});
}

/** "12%": a share of the window, whole percent. */
export function fmtWholeShare(share: number): string {
	return `${Math.round(share * 100)}%`;
}
