/**
 * PROTOTYPE — throwaway. The floating bar. Deliberately ugly against the site
 * so nobody judges it as part of the design. Hidden in production builds.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PulseVariantKey } from "./usePulsePrototype";
import { VARIANT_ANNOTATED_NAME } from "./VariantAnnotated";
import { VARIANT_GROUND_NAME } from "./VariantGround";
import { VARIANT_ONE_NUMBER_NAME } from "./VariantOneNumber";
import { VARIANT_REEL_NAME } from "./VariantReel";
import { VARIANT_TICKER_NAME } from "./VariantTicker";

const NAMES: Record<PulseVariantKey, string> = {
	A: VARIANT_GROUND_NAME,
	B: VARIANT_ANNOTATED_NAME,
	C: VARIANT_TICKER_NAME,
	D: VARIANT_ONE_NUMBER_NAME,
	E: VARIANT_REEL_NAME,
};

export function PulsePrototypeSwitcher({
	variant,
	onCycle,
}: {
	readonly variant: PulseVariantKey;
	readonly onCycle: (step: number) => void;
}) {
	if (import.meta.env.PROD) return null;

	return (
		<div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
			<div className="flex items-stretch border-2 border-white bg-black font-mono text-xs text-white shadow-[4px_4px_0_rgba(255,255,255,0.35)]">
				<button
					type="button"
					onClick={() => onCycle(-1)}
					aria-label="previous variant"
					className="px-3 hover:bg-white hover:text-black"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
				<span className="flex min-w-[17rem] items-center gap-2 border-x-2 border-white/40 px-4 py-3">
					<strong className="text-[#c6ff3d]">{variant}</strong>
					<span className="truncate">{NAMES[variant]}</span>
				</span>
				<button
					type="button"
					onClick={() => onCycle(1)}
					aria-label="next variant"
					className="px-3 hover:bg-white hover:text-black"
				>
					<ChevronRight className="h-4 w-4" />
				</button>
			</div>
			<p className="mt-2 text-center font-mono text-[10px] text-white/50">
				← → to switch · pulse-band prototype
			</p>
		</div>
	);
}
