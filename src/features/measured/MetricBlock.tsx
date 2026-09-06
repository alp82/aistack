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
 * Locked by #80, laid out as the prototype's headline strip since #356:
 *
 *   - TOKENS LEAD, SPLIT THREE WAYS. The hero tile and the stuck nav print the
 *     total; this block prints in, out and cached with each one's share, so it
 *     adds a reading instead of repeating the number. A read with no split (the
 *     legacy 30-day figure) prints the total alone. Spend sits beside, smaller,
 *     at the strip's right edge (under the figures on a narrow screen). It is
 *     optional by design (`publishCost`), so it can never be the thing the
 *     layout rests on.
 *   - HISTORY IS A WATERMARK, stretched to the block's bottom edge, never a row
 *     of its own. It costs no vertical space and it never competes with the
 *     number it stands behind.
 *   - CLICKING THE BLOCK deals the next framing. A control beside the number sat
 *     too far from what it changed, so the whole block is the control.
 *   - THE ROW MUST NOT RESIZE. Both captions live in one grid cell, so the row
 *     keeps the height of the taller one and only opacity changes on hover.
 *   - EVERY COLUMN CENTERS. One grid row of three cells, centred: the number,
 *     the caption column and the spend column share one vertical middle, so no
 *     figure hangs below its neighbour.
 *   - ONE VISIBLE COST LINE. The caption under the dollar figure is the
 *     section's whole visible pricing note. The price-table ids and the share
 *     of tokens they cover live in the hover card (AGENTS.md, "Pricing").
 *
 * The card itself is a hover surface and mounts through a portal, so it never
 * exists in the server HTML and the deck's shuffle stays invisible to hydration.
 */
export function MetricBlock({
	tokens,
	inputTokens,
	outputTokens,
	cacheReadTokens,
	usd,
	pricedShare = null,
	pricingTables = [],
	windowDays,
	trail,
}: {
	readonly tokens: number;
	/** Input-side tokens the model read fresh: prompt input plus cache writes. */
	readonly inputTokens?: number;
	readonly outputTokens?: number;
	readonly cacheReadTokens?: number;
	readonly usd: number | null;
	/** The share of tokens the dollar figure covers, where the read says. */
	readonly pricedShare?: number | null;
	/** The price-table ids the dollar figure cites, where the read says. */
	readonly pricingTables?: readonly string[];
	readonly windowDays: number;
	/** Every reading so far. Fewer than two draws no watermark. */
	readonly trail: readonly ChartPointInput[];
}) {
	const deck = useTipDeck();
	const split =
		inputTokens !== undefined &&
		outputTokens !== undefined &&
		cacheReadTokens !== undefined
			? [
					{ key: "in", figure: inputTokens },
					{ key: "out", figure: outputTokens },
					{ key: "cached", figure: cacheReadTokens },
				]
			: null;

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
				<TokenTip
					tokens={tokens}
					usd={usd}
					pricedShare={pricedShare}
					pricingTables={pricingTables}
					tip={deck.tip}
				/>
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
					className="relative grid w-full cursor-pointer gap-x-8 gap-y-3 border border-stroke-subtle px-5 py-4 text-left transition-colors hover:bg-bg-panel/40 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
				>
					{/* The caption row: the window, and on hover the deck's hint in its
					    place. Both live in one cell so the row never resizes. */}
					<span className="relative col-span-full grid">
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

					{split ? (
						// THE TOTAL PRINTS IN THE HERO AND THE STUCK NAV. Here the same
						// tokens split three ways, each with its share of the total, so
						// the section adds a reading instead of repeating a number.
						<span
							data-testid="token-split"
							className="relative grid grid-cols-3 gap-x-3 md:gap-x-8"
						>
							{split.map((part) => (
								<span key={part.key} className="flex min-w-0 flex-col">
									<span className="font-mono text-2xl font-black leading-none text-fg-primary sm:text-3xl md:text-4xl">
										{fmtTokens(part.figure)}
									</span>
									<span
										className={cn(
											MONO_LABEL,
											"mt-2 whitespace-nowrap tracking-[0.12em] text-accent-lime sm:tracking-[0.2em]",
										)}
									>
										{part.key}
										<span className="text-fg-muted">
											{" "}
											· {fmtSharePct(part.figure, tokens)}
										</span>
									</span>
								</span>
							))}
						</span>
					) : (
						<span className="relative font-mono text-5xl font-black leading-none text-fg-primary md:text-6xl">
							{fmtTokens(tokens)}
						</span>
					)}

					<span className="relative flex flex-col items-start justify-center text-left md:items-end md:text-right">
						<span className="block font-mono text-2xl font-black leading-none text-fg-secondary md:text-3xl">
							{usd !== null ? `≈${fmtUSD(usd)}` : COST_PRIVATE}
						</span>
						<span className={cn(MONO_LABEL, "mt-1.5 block text-fg-muted")}>
							{usd !== null ? COST_CAPTION : COST_PRIVATE_CAPTION}
						</span>
					</span>
				</button>
			</div>
		</HoverCard>
	);
}

/** "17%" of the total; a part below half a percent of a real total prints "<1%". */
function fmtSharePct(part: number, total: number): string {
	if (total <= 0) return "0%";
	const pct = Math.round((part / total) * 100);
	return pct === 0 && part > 0 ? "<1%" : `${pct}%`;
}

/**
 * Taller than the block on purpose: cropped by the wrapper, the fill bleeds off
 * the bottom edge instead of ending in a line across the middle of the text.
 */
const WATERMARK_HEIGHT = 200;
