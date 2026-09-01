import { Dices } from "lucide-react";
import HoverCard from "@/components/ui/hover-card";
import type { ChartPointInput } from "@/features/charts";
import { Sparkline } from "@/features/charts";
import { cn } from "@/lib/utils";
import {
	COST_CAPTION,
	COST_PRIVATE,
	COST_PRIVATE_CAPTION,
	DECK_HINT,
	DECK_LABEL,
	fmtTokens,
	fmtUSD,
	MONO_LABEL,
	TOKENS_CAPTION,
} from "./copy";
import { TokenTip, useTipDeck } from "./tokens/TokenTips";

/**
 * The headline: the number people come for, with its history behind it.
 *
 * Locked by #80 and unchanged here:
 *
 *   - TOKENS LEAD. Spend sits below, smaller, over the same width - it is
 *     optional by design (`publishCost`), so it can never be the thing the
 *     layout rests on.
 *   - HISTORY IS A WATERMARK, stretched to the block's bottom edge, never a row
 *     of its own. It costs no vertical space and it never competes with the
 *     number it stands behind.
 *   - CLICKING THE BLOCK deals the next framing. A control beside the number sat
 *     too far from what it changed, so the whole block is the control.
 *   - THE ROW MUST NOT RESIZE. Both captions live in one grid cell, so the row
 *     keeps the height of the taller one and only opacity changes on hover.
 *
 * The card itself is a hover surface and mounts through a portal, so it never
 * exists in the server HTML and the deck's shuffle stays invisible to hydration.
 */
export function MetricBlock({
	tokens,
	freshTokens,
	cacheReadTokens,
	usd,
	windowDays,
	trail,
}: {
	readonly tokens: number;
	readonly freshTokens?: number;
	readonly cacheReadTokens?: number;
	readonly usd: number | null;
	readonly windowDays: number;
	/** Every reading so far. Fewer than two draws no watermark. */
	readonly trail: readonly ChartPointInput[];
}) {
	const deck = useTipDeck();

	return (
		<HoverCard
			mode="wrapper"
			position="below"
			width={340}
			height="auto"
			maxRotation={5}
			maxOffset={8}
			offset={12}
			className="w-full"
			renderContent={() => (
				<TokenTip tokens={tokens} usd={usd} tip={deck.tip} />
			)}
		>
			<div className="group relative w-full">
				{/* The watermark runs off the block's bottom edge, which is why it is
				    drawn taller than the block and cropped. Letterboxed inside the
				    block, its fill stopped mid-way and read as a box drawn around part
				    of the text and not the rest.

				    It sits OUTSIDE the button: the chart renders a `div`, and a button
				    may only contain phrasing content. */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.16]"
				>
					<Sparkline
						points={trail}
						ariaLabel="tokens at every reading"
						area
						fluid
						width={400}
						height={WATERMARK_HEIGHT}
					/>
				</div>

				<button
					type="button"
					onClick={deck.next}
					aria-label={DECK_LABEL}
					className="relative block w-full cursor-pointer border border-transparent px-3 py-3 text-left transition-colors hover:border-stroke-subtle hover:bg-bg-panel/40"
				>
					<span className="relative block font-mono text-5xl font-black leading-none text-fg-primary md:text-6xl">
						{fmtTokens(tokens)}
					</span>

					{/* Both captions share one grid cell: the row keeps the height of the
				    taller one at rest, so nothing below it can move. */}
					<span className="relative mt-2 grid">
						<span
							className={cn(
								MONO_LABEL,
								"col-start-1 row-start-1 flex items-center text-fg-muted transition-opacity duration-150 group-hover:opacity-0",
							)}
						>
							{TOKENS_CAPTION(windowDays)}
						</span>
						<span
							aria-hidden="true"
							className={cn(
								MONO_LABEL,
								"pointer-events-none col-start-1 row-start-1 flex items-center gap-2 font-semibold text-accent-lime opacity-0 transition-opacity duration-150 group-hover:opacity-100",
							)}
						>
							<Dices size={18} />
							{DECK_HINT}
						</span>
					</span>
					{freshTokens !== undefined && cacheReadTokens !== undefined && (
						<span className="relative mt-2 block font-mono text-xs text-fg-muted">
							{fmtTokens(freshTokens)} fresh · {fmtTokens(cacheReadTokens)}{" "}
							cached
						</span>
					)}

					{/* Roomier than the caption gap above, so the swapped row never crowds
				    the second number. */}
					<span className="relative mt-6 block font-mono text-2xl font-black leading-none text-fg-secondary md:text-3xl">
						{usd !== null ? `≥${fmtUSD(usd)}` : COST_PRIVATE}
					</span>
					<span
						className={cn(MONO_LABEL, "relative mt-1.5 block text-fg-muted")}
					>
						{usd !== null ? COST_CAPTION : COST_PRIVATE_CAPTION}
					</span>
				</button>
			</div>
		</HoverCard>
	);
}

/**
 * Taller than the block on purpose: cropped by the wrapper, the fill bleeds off
 * the bottom edge instead of ending in a line across the middle of the text.
 */
const WATERMARK_HEIGHT = 200;
