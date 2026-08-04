/**
 * PROTOTYPE - the headline metric block. Wayfinder ticket #80.
 *
 * LOCKED BY THE OWNER, so it is shared by every C-family variant instead of
 * being varied:
 *
 *   - TOKENS is the default metric and leads.
 *   - Spend sits below it, a bit smaller, over the same width.
 *   - One hover area covers BOTH numbers and opens the site's usual animated
 *     popup, which says the dollar figure is not real money spent.
 *
 * What varies between D, E and F is how history and the model mix are
 * expressed around this block - not the block itself.
 *
 * The one thing still under test here is HOW A READER REROLLS THE POPUP. The
 * corner dice sat too far from what it changed, so `roll=` offers four
 * treatments, and every one of them is invisible until the block is hovered.
 */
import { Dices, RefreshCw } from "lucide-react";
import HoverCard from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { MONO_LABEL } from "../copy";
import { fmtTokens, fmtUSD, type ProtoPoint } from "./fixtures";
import { type TipKey, TokenTip, useTipDeck } from "./TokenTips";

export type RollKey = "inline" | "under" | "block" | "hover";

export const ROLLS: { key: RollKey; label: string }[] = [
	{ key: "inline", label: "dice beside the number" },
	{ key: "under", label: "strip along the bottom edge" },
	{ key: "block", label: "click anywhere on the block" },
	{ key: "hover", label: "no control, each hover deals the next" },
];

/** Hidden until the block is hovered, per the owner's rule. */
const ON_HOVER =
	"opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100";

export function MetricBlock({
	point,
	children,
	backdrop,
	className,
	tip,
	roll = "inline",
}: {
	point: ProtoPoint;
	/** Trail rendered inside the hover area, under the two numbers. */
	children?: React.ReactNode;
	/** Trail rendered BEHIND the numbers, so history costs no vertical space. */
	backdrop?: React.ReactNode;
	className?: string;
	/** Pins one framing. Left undefined, the popup deals from a shuffled deck. */
	tip?: TipKey;
	/** How the reader asks for another framing. */
	roll?: RollKey;
}) {
	const deck = useTipDeck(tip);
	const canRoll = deck.shuffling;

	return (
		<HoverCard
			mode="wrapper"
			position="below"
			width={340}
			height="auto"
			maxRotation={5}
			maxOffset={8}
			offset={12}
			className={cn("w-full", className)}
			renderContent={() => (
				<TokenTip
					point={point}
					tip={deck.tip}
					index={deck.index}
					total={deck.total}
					shuffling={deck.shuffling}
				/>
			)}
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: prototype-only reroll surface, superseded by the chosen `roll` treatment */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: same */}
			<div
				className={cn(
					"group relative w-full border border-transparent px-3 py-3 transition-colors hover:border-stroke-subtle hover:bg-bg-panel/40",
					canRoll && roll === "block" ? "cursor-pointer" : "cursor-help",
				)}
				onClick={canRoll && roll === "block" ? deck.next : undefined}
				onMouseEnter={canRoll && roll === "hover" ? deck.next : undefined}
			>
				{/* The backdrop stretches to the block's bottom edge. Letterboxed, its
				    fill stopped mid-block and read as a box around part of the text. */}
				{backdrop && (
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 overflow-hidden"
					>
						{backdrop}
					</div>
				)}

				<p className="relative flex items-center gap-3 font-mono text-5xl font-black leading-none text-fg-primary md:text-6xl">
					{fmtTokens(point.tokens)}
					{canRoll && roll === "inline" && (
						<button
							type="button"
							title="another way to picture it"
							aria-label="another way to picture it"
							onClick={(e) => {
								e.stopPropagation();
								deck.next();
							}}
							className={cn(
								ON_HOVER,
								"cursor-pointer border border-stroke-subtle p-1.5 text-fg-muted hover:border-accent-lime hover:text-accent-lime",
							)}
						>
							<Dices size={16} />
						</button>
					)}
				</p>
				<p className={cn(MONO_LABEL, "relative mt-2 text-fg-muted")}>
					tokens · last {point.windowDays} days
				</p>

				<p className="relative mt-4 font-mono text-2xl font-black leading-none text-fg-secondary md:text-3xl">
					{point.usd !== null ? `≈${fmtUSD(point.usd)}` : "kept private"}
				</p>
				<p className={cn(MONO_LABEL, "relative mt-1.5 text-fg-muted")}>
					{point.usd !== null ? "at api list prices" : "cost not published"}
				</p>

				{children}

				{canRoll && roll === "under" && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							deck.next();
						}}
						className={cn(
							ON_HOVER,
							MONO_LABEL,
							"relative mt-3 flex w-full cursor-pointer items-center justify-center gap-2 border border-stroke-subtle py-1.5 text-fg-muted hover:border-accent-lime hover:text-accent-lime",
						)}
					>
						<RefreshCw size={11} />
						another way to picture it
					</button>
				)}

				{canRoll && roll === "block" && (
					<p
						className={cn(
							ON_HOVER,
							MONO_LABEL,
							"pointer-events-none absolute bottom-2 right-3 text-fg-muted",
						)}
					>
						click to reroll
					</p>
				)}
			</div>
		</HoverCard>
	);
}
