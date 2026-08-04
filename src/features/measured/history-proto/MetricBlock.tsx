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
 *   - CLICKING THE BLOCK deals the next framing. No separate button, because a
 *     control beside the number sat too far from what it changed.
 *
 * The open question is only what that click LOOKS like before you make it.
 * Three ingredients survived the last round - the dice, the dashed underline on
 * the number, and a worded hint - so every option below is built from those,
 * with the hint moved up beside the number it belongs to. All six are invisible
 * until the block is hovered.
 */
import { Dices } from "lucide-react";
import HoverCard from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { MONO_LABEL } from "../copy";
import { fmtTokens, fmtUSD, type ProtoPoint } from "./fixtures";
import { type TipKey, TokenTip, useTipDeck } from "./TokenTips";

export type LookKey =
	| "dice"
	| "underline"
	| "both"
	| "beside"
	| "swap"
	| "below";

export const LOOKS: { key: LookKey; label: string }[] = [
	{ key: "dice", label: "dice in the corner, no words" },
	{ key: "underline", label: "dashed underline on the number" },
	{ key: "both", label: "underline plus dice at the number" },
	{ key: "beside", label: "underline, dice and words beside the number" },
	{ key: "swap", label: "the caption swaps to the words on hover" },
	{ key: "below", label: "a chip right under the caption" },
];

/** One wording everywhere, so the placement is the only thing being judged. */
const HINT = "random fun fact";

/** Hidden until the block is hovered, per the owner's rule. */
const ON_HOVER =
	"opacity-0 transition-opacity duration-150 group-hover:opacity-100";

export function MetricBlock({
	point,
	children,
	backdrop,
	className,
	tip,
	look = "both",
}: {
	point: ProtoPoint;
	/** Trail rendered inside the hover area, under the two numbers. */
	children?: React.ReactNode;
	/** Trail rendered BEHIND the numbers, so history costs no vertical space. */
	backdrop?: React.ReactNode;
	className?: string;
	/** Pins one framing. Left undefined, the popup deals from a shuffled deck. */
	tip?: TipKey;
	/** How the block announces that clicking it deals another framing. */
	look?: LookKey;
}) {
	const deck = useTipDeck(tip);
	const canRoll = deck.shuffling;
	const on = (...keys: LookKey[]) => canRoll && keys.includes(look);

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
			{/* biome-ignore lint/a11y/noStaticElementInteractions: prototype-only click surface; the shipped version gets a real button */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: same */}
			<div
				onClick={canRoll ? deck.next : undefined}
				className={cn(
					"group relative w-full border border-transparent px-3 py-3 transition-colors hover:border-stroke-subtle hover:bg-bg-panel/40",
					canRoll ? "cursor-pointer" : "cursor-help",
				)}
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

				{on("dice") && (
					<span
						aria-hidden="true"
						className={cn(
							ON_HOVER,
							"pointer-events-none absolute right-3 top-3 text-accent-lime",
						)}
					>
						<Dices size={18} />
					</span>
				)}

				<p className="relative flex flex-wrap items-center gap-x-3 font-mono text-5xl font-black leading-none text-fg-primary md:text-6xl">
					<span
						className={cn(
							"inline-block border-b-2 border-transparent pb-1",
							on("underline", "both", "beside") &&
								"transition-colors group-hover:border-dashed group-hover:border-accent-lime",
						)}
					>
						{fmtTokens(point.tokens)}
					</span>

					{on("both", "beside") && (
						<span
							aria-hidden="true"
							className={cn(
								ON_HOVER,
								"pointer-events-none inline-flex items-center gap-2 text-accent-lime",
							)}
						>
							<Dices size={20} />
							{look === "beside" && (
								<span className={cn(MONO_LABEL, "font-semibold")}>{HINT}</span>
							)}
						</span>
					)}
				</p>

				{/* The caption line. `swap` borrows it rather than adding a row. */}
				<p className={cn(MONO_LABEL, "relative mt-2 text-fg-muted")}>
					{on("swap") ? (
						<>
							<span className="group-hover:hidden">
								tokens · last {point.windowDays} days
							</span>
							<span className="hidden items-center gap-2 text-accent-lime group-hover:inline-flex">
								<Dices size={12} />
								{HINT}
							</span>
						</>
					) : (
						<>tokens · last {point.windowDays} days</>
					)}
				</p>

				{on("below") && (
					<span
						aria-hidden="true"
						className={cn(
							ON_HOVER,
							MONO_LABEL,
							"pointer-events-none relative mt-2 inline-flex items-center gap-2 border border-accent-lime/50 px-2 py-1 text-accent-lime",
						)}
					>
						<Dices size={12} />
						{HINT}
					</span>
				)}

				<p className="relative mt-4 font-mono text-2xl font-black leading-none text-fg-secondary md:text-3xl">
					{point.usd !== null ? `≈${fmtUSD(point.usd)}` : "kept private"}
				</p>
				<p className={cn(MONO_LABEL, "relative mt-1.5 text-fg-muted")}>
					{point.usd !== null ? "at api list prices" : "cost not published"}
				</p>

				{children}
			</div>
		</HoverCard>
	);
}
