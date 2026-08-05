/**
 * PROTOTYPE — throwaway. Wayfinder ticket #92 (map #76).
 *
 * The floating bar. Deliberately ugly against the site so nobody judges it as
 * part of the design. Hidden in production builds.
 *
 * Four knobs, and each one is a question #92 asks:
 *   variant  — the spine
 *   density  — 4 / 50 / 500, the binding constraint
 *   weight   — token-weighted or stack-weighted shares
 *   clock    — move today forward five days and watch the board go quiet
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Weight } from "./aggregate";
import { type ClockKey, DENSITY_LABEL, type DensityKey } from "./fixtures";
import { VARIANT_A_NAME } from "./VariantA";
import { VARIANT_B_NAME } from "./VariantB";
import { VARIANT_C_NAME } from "./VariantC";
import { VARIANT_C2_NAME, VARIANT_C3_NAME } from "./VariantC2";

export type VariantKey = "A" | "B" | "C" | "C2" | "C3";

export const VARIANT_KEYS: readonly VariantKey[] = ["C3", "C2", "C", "A", "B"];

const NAMES: Record<VariantKey, string> = {
	A: VARIANT_A_NAME,
	B: VARIANT_B_NAME,
	C: VARIANT_C_NAME,
	C2: VARIANT_C2_NAME,
	C3: VARIANT_C3_NAME,
};

const CLOCK_LABEL: Record<ClockKey, string> = {
	now: "Aug 5",
	quiet: "Aug 9",
	dark: "Aug 12",
};

export function PrototypeSwitcher({
	variant,
	density,
	weight,
	clock,
	livingCount,
	staleCount,
	onCycle,
	onDensity,
	onWeight,
	onClock,
}: {
	readonly variant: VariantKey;
	readonly density: DensityKey;
	readonly weight: Weight;
	readonly clock: ClockKey;
	readonly livingCount: number;
	readonly staleCount: number;
	readonly onCycle: (step: number) => void;
	readonly onDensity: (d: DensityKey) => void;
	readonly onWeight: (w: Weight) => void;
	readonly onClock: (c: ClockKey) => void;
}) {
	if (import.meta.env.PROD) return null;

	return (
		<div className="fixed bottom-5 left-1/2 z-50 w-[min(94vw,72rem)] -translate-x-1/2">
			<div className="flex flex-wrap items-stretch border-2 border-white bg-black font-mono text-xs text-white shadow-[4px_4px_0_rgba(255,255,255,0.35)]">
				<button
					type="button"
					onClick={() => onCycle(-1)}
					aria-label="previous variant"
					className="px-3 hover:bg-white hover:text-black"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>

				<span className="flex min-w-[22rem] flex-1 items-center gap-2 border-x-2 border-white/40 px-4 py-3">
					<strong className="text-[#c6ff3d]">{variant}</strong>
					<span className="truncate">{NAMES[variant]}</span>
				</span>

				<button
					type="button"
					onClick={() => onCycle(1)}
					aria-label="next variant"
					className="border-r-2 border-white/40 px-3 hover:bg-white hover:text-black"
				>
					<ChevronRight className="h-4 w-4" />
				</button>

				<Group label="rows">
					{(["real", "grown", "scale"] as const).map((k) => (
						<Pill
							key={k}
							on={density === k}
							onClick={() => onDensity(k)}
							title={DENSITY_LABEL[k]}
						>
							{k === "real" ? "4" : k === "grown" ? "50" : "500"}
						</Pill>
					))}
				</Group>

				<Group label="share">
					{(["tokens", "stacks"] as const).map((k) => (
						<Pill key={k} on={weight === k} onClick={() => onWeight(k)}>
							{k}
						</Pill>
					))}
				</Group>

				<Group label="today">
					{(["now", "quiet", "dark"] as const).map((k) => (
						<Pill key={k} on={clock === k} onClick={() => onClock(k)}>
							{CLOCK_LABEL[k]}
						</Pill>
					))}
				</Group>

				<span className="flex items-center px-3 text-white/40">
					{livingCount} living · {staleCount} quiet
				</span>
			</div>
			<p className="mt-2 text-center font-mono text-[10px] text-white/50">
				← → switch variant · 4 rows = the stacks actually measured on prod · Aug
				9 leaves one ranked, Aug 12 leaves none
			</p>
		</div>
	);
}

function Group({
	label,
	children,
}: {
	readonly label: string;
	readonly children: React.ReactNode;
}) {
	return (
		<span className="flex items-center gap-1 border-r-2 border-white/40 px-3">
			<span className="pr-1 uppercase tracking-wider text-white/40">
				{label}
			</span>
			{children}
		</span>
	);
}

function Pill({
	on,
	onClick,
	title,
	children,
}: {
	readonly on: boolean;
	readonly onClick: () => void;
	readonly title?: string;
	readonly children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			className={`px-2 py-1 uppercase tracking-wider ${
				on ? "bg-[#c6ff3d] text-black" : "text-white/60 hover:text-white"
			}`}
		>
			{children}
		</button>
	);
}
