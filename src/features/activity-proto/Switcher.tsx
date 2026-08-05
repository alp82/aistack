/**
 * PROTOTYPE — throwaway. Wayfinder ticket #96 (map #76).
 *
 * The floating bar. Deliberately ugly against the site so nobody judges it as
 * part of the design. Hidden in production builds.
 */

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Density, PageVariantKey } from "./useActivityPrototype";

const NAMES: Record<PageVariantKey, string> = {
	C: "C · dense stream — replaces the band",
	F: "F · the band travels — 24h summary on top",
	G: "G · journal — thin-first, rich rows (join)",
	H: "H · ledger — table, sibling of /leaderboard",
};

type Props = {
	variant: PageVariantKey;
	density: Density;
	rowCount: number;
	onCycle: (step: number) => void;
	onDensity: (density: Density) => void;
	onInject: () => void;
};

export function Switcher({
	variant,
	density,
	rowCount,
	onCycle,
	onDensity,
	onInject,
}: Props) {
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

				<span className="flex min-w-[21rem] items-center gap-2 border-x-2 border-white/40 px-4 py-3">
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

				<span className="flex items-center gap-1 px-3">
					{(["real", "grown"] as const).map((key) => (
						<button
							type="button"
							key={key}
							onClick={() => onDensity(key)}
							className={`px-2 py-1 uppercase tracking-wider ${
								density === key
									? "bg-[#c6ff3d] text-black"
									: "text-white/60 hover:text-white"
							}`}
						>
							{key}
						</button>
					))}
					<span className="pl-1 text-white/40">{rowCount} rows</span>
				</span>

				<button
					type="button"
					onClick={onInject}
					className="flex items-center gap-1 border-l-2 border-white/40 px-3 uppercase tracking-wider hover:bg-white hover:text-black"
				>
					<Plus className="h-3 w-3" /> event
				</button>
			</div>
			<p className="mt-2 text-center font-mono text-[10px] text-white/50">
				← → to switch · real = the 3 rows actually on prod · judge REAL first
			</p>
		</div>
	);
}
