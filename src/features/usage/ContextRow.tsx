import { fmtShare, fmtTokens } from "@/features/measured/copy";
import { cn } from "@/lib/utils";
import {
	CONTEXT_HINT,
	CONTEXT_PAINT,
	type ContextHarness,
	type ContextReading,
	fmtWholeShare,
	type WaffleCell,
	waffleCells,
} from "./context";
import { harnessLabel } from "./HarnessShareRows";

/**
 * The Context row (#359, locked prototype `prototype/context-breakdown`): what
 * a typical API call carries against each harness's window.
 *
 * The head line prints the median call and its share of each harness's window.
 * The body prints one block per harness: the median call, then a 200-cell grid
 * (one cell is 0.5% of the window) next to its legend. Filled cells are the
 * median call split into harness, instructions and usual chat; outlined cells
 * run to the p90; the rest is free. A harness with no known window prints the
 * legend alone and drops out of the head line's shares.
 *
 * The grid is plain spans, so it server-renders like every other chart. The
 * row ranks nothing: harnesses print in the server's order.
 */

/** The head line: "118K median call · 12% of the Claude Code window · ...". */
export function ContextSummary({
	context,
}: {
	context: NonNullable<ContextReading>;
}) {
	const first = context.harnesses[0];
	if (!first) return null;
	return (
		<>
			<span>
				<b className="font-mono text-accent-lime">
					{fmtTokens(first.medianCall)}
				</b>{" "}
				{first.retainedCallsOnly ? "median retained call" : "median call"}
			</span>
			{context.harnesses.map((h) =>
				h.window === null ? null : (
					<span key={h.harness}>
						<b className="font-mono text-fg-primary">
							{fmtWholeShare(h.medianCall / h.window)}
						</b>{" "}
						of the {harnessLabel(h.harness)} window
					</span>
				),
			)}
		</>
	);
}

export function ContextBody({
	context,
}: {
	context: NonNullable<ContextReading>;
}) {
	return (
		<div
			data-testid="context-body"
			className="grid gap-x-12 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr))]"
		>
			{context.harnesses.map((h) => (
				<HarnessBlock key={h.harness} h={h} />
			))}
		</div>
	);
}

function HarnessBlock({ h }: { h: ContextHarness }) {
	const name = harnessLabel(h.harness);
	return (
		<div data-testid="context-harness">
			<p className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
				<b className="font-mono text-[15px] text-fg-primary">{name}</b>
				<span className="font-mono text-[22px] font-black leading-none text-fg-primary">
					{fmtTokens(h.medianCall)}
				</span>
				<span className="font-mono text-xs text-fg-muted">
					{h.window !== null && (
						<>
							of {fmtTokens(h.window)} ·{" "}
							{fmtWholeShare(h.medianCall / h.window)} full ·{" "}
						</>
					)}
					{h.calls.toLocaleString("en-US")}{" "}
					{h.retainedCallsOnly ? "retained calls" : "calls"}
				</span>
			</p>
			{h.retainedCallsOnly && (
				<p className="mb-3 text-xs text-fg-muted">
					Based on retained local logs. Some calls may be missing.
				</p>
			)}
			{h.breakdownAvailable === false && (
				<p className="mb-3 text-xs text-fg-muted">
					Harness and instructions breakdown unavailable.
				</p>
			)}
			{h.window === null ? (
				<Legend h={h} window={null} />
			) : (
				<div className="grid items-start gap-6 sm:grid-cols-[minmax(0,320px)_1fr]">
					<Waffle h={h} name={name} window={h.window} />
					<Legend h={h} window={h.window} />
				</div>
			)}
		</div>
	);
}

const CELL_STYLE: Record<WaffleCell, React.CSSProperties> = {
	harness: { background: CONTEXT_PAINT.harness },
	instructions: { background: CONTEXT_PAINT.instructions },
	usualChat: { background: CONTEXT_PAINT.usualChat },
	longChat: {
		background: "transparent",
		boxShadow: "inset 0 0 0 1px var(--stroke-strong)",
	},
	free: { background: "var(--bg-panel-muted)" },
};

function Waffle({
	h,
	name,
	window,
}: {
	h: ContextHarness;
	name: string;
	window: number;
}) {
	const cells = waffleCells(h, window);
	return (
		<div
			role="img"
			aria-label={`${name}: a typical call uses ${fmtTokens(h.medianCall)} of a ${fmtTokens(window)} window`}
			data-testid="context-waffle"
			className="grid max-w-[320px] grid-cols-[repeat(20,1fr)] gap-[3px]"
		>
			{cells.map((cell, i) => (
				<span
					// biome-ignore lint/suspicious/noArrayIndexKey: cells are positional and never reorder, so the index is the identity
					key={i}
					data-cell={cell}
					className="block aspect-square w-full"
					style={
						cell === "usualChat" && h.breakdownAvailable === false
							? { background: "var(--accent-lime)" }
							: CELL_STYLE[cell]
					}
				/>
			))}
		</div>
	);
}

function Legend({ h, window }: { h: ContextHarness; window: number | null }) {
	const share = (tokens: number) =>
		window === null ? null : fmtShare(tokens / window);
	return (
		<div data-testid="context-legend">
			{h.breakdownAvailable !== false && (
				<>
					<LegendRow
						label="harness"
						tokens={h.harnessTokens}
						share={share(h.harnessTokens)}
						title={CONTEXT_HINT.harness}
						swatch={CELL_STYLE.harness}
					/>
					<LegendRow
						label="instructions"
						tokens={h.instructionsTokens}
						share={share(h.instructionsTokens)}
						title={CONTEXT_HINT.instructions}
						swatch={CELL_STYLE.instructions}
					/>
				</>
			)}
			<LegendRow
				label={h.breakdownAvailable === false ? "median call" : "usual chat"}
				tokens={h.usualChat}
				share={share(h.usualChat)}
				title={
					h.breakdownAvailable === false
						? "the median recorded call"
						: CONTEXT_HINT.usualChat
				}
				swatch={
					h.breakdownAvailable === false
						? { background: "var(--accent-lime)" }
						: CELL_STYLE.usualChat
				}
			/>
			<LegendRow
				label={h.breakdownAvailable === false ? "p90 call" : "long chat"}
				tokens={h.longChat}
				share={share(h.longChat)}
				title={
					h.breakdownAvailable === false
						? "1 in 10 recorded calls exceed this size"
						: CONTEXT_HINT.longChat
				}
				swatch={CELL_STYLE.longChat}
				className="mt-1.5"
			/>
			{window !== null && (
				<LegendRow
					label="free"
					tokens={Math.max(0, window - h.medianCall)}
					share={share(Math.max(0, window - h.medianCall))}
					swatch={CELL_STYLE.free}
				/>
			)}
		</div>
	);
}

function LegendRow({
	label,
	tokens,
	share,
	title,
	swatch,
	className,
}: {
	label: string;
	tokens: number;
	share: string | null;
	title?: string;
	swatch: React.CSSProperties;
	className?: string;
}) {
	return (
		<div
			title={title}
			className={cn("flex items-baseline gap-2 py-[3px]", className)}
		>
			<span
				aria-hidden="true"
				className="size-2 shrink-0 self-center"
				style={swatch}
			/>
			<span className="min-w-[104px] font-mono text-xs text-fg-secondary">
				{label}
			</span>
			<b className="font-mono text-xs text-fg-primary">{fmtTokens(tokens)}</b>
			{share !== null && (
				<span className="font-mono text-xs text-fg-muted">{share}</span>
			)}
		</div>
	);
}
