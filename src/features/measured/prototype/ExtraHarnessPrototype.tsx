/**
 * PROTOTYPE - throwaway (alp82/aistack#293).
 *
 * Three treatments for a harness row whose harness is not a stack tool, on the
 * existing stack page, switchable with `?variant=A|B|C` and the arrow keys.
 * The row keeps its figure at full contrast in every variant. The treatment
 * says "extra", never "unused". No visible prose: the sole word is sr-only.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type ExtraVariant = "A" | "B" | "C";
const KEYS: ExtraVariant[] = ["A", "B", "C"];
const NAMES: Record<ExtraVariant, string> = {
	A: "Dimmed row",
	B: "Hollow bar",
	C: "Hatched bar",
};

export function useExtraVariant(): [ExtraVariant, (step: number) => void] {
	const [variant, setVariant] = useState<ExtraVariant>(() => {
		if (typeof window === "undefined") return "A";
		const v = new URLSearchParams(window.location.search).get("variant");
		return KEYS.includes(v as ExtraVariant) ? (v as ExtraVariant) : "A";
	});
	const cycle = (step: number) => {
		const next =
			KEYS[(KEYS.indexOf(variant) + step + KEYS.length) % KEYS.length];
		setVariant(next);
		const url = new URL(window.location.href);
		url.searchParams.set("variant", next);
		window.history.replaceState(null, "", url);
	};
	useEffect(() => {
		const onKey = (e: globalThis.KeyboardEvent) => {
			const t = e.target as HTMLElement | null;
			if (
				t &&
				(t.tagName === "INPUT" ||
					t.tagName === "TEXTAREA" ||
					t.isContentEditable)
			)
				return;
			if (e.key === "ArrowLeft") cycle(-1);
			if (e.key === "ArrowRight") cycle(1);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});
	return [variant, cycle];
}

export type HarnessRow = {
	name: string;
	label: string;
	tokens: number;
	share: number;
	extra: boolean;
	paint: string;
};

/** The bar and label for one row, per variant. The figures are rendered by the caller. */
export function ExtraTreatment({
	variant,
	row,
}: {
	variant: ExtraVariant;
	row: HarnessRow;
}) {
	const width = `${Math.max(1, row.share * 100)}%`;
	const extra = row.extra;

	// A: the whole row except the figures sits at reduced opacity.
	if (variant === "A") {
		return (
			<>
				<span
					className={cn(
						"w-40 shrink-0 truncate text-sm text-fg-secondary",
						extra && "opacity-50",
					)}
				>
					{row.label}
					{extra && <span className="sr-only"> (extra)</span>}
				</span>
				<span className={cn("h-3 flex-1 bg-bg-panel", extra && "opacity-50")}>
					<span
						data-testid="source-paint"
						className="block h-full"
						style={{ width, background: row.paint }}
					/>
				</span>
			</>
		);
	}

	// B: the bar is an outline of the same paint with no fill.
	if (variant === "B") {
		return (
			<>
				<span className="w-40 shrink-0 truncate text-sm text-fg-secondary">
					{row.label}
					{extra && <span className="sr-only"> (extra)</span>}
				</span>
				<span className="h-3 flex-1 bg-bg-panel">
					<span
						data-testid="source-paint"
						className="block h-full"
						style={
							extra
								? {
										width,
										boxShadow: `inset 0 0 0 1.5px ${row.paint}`,
										background: "transparent",
									}
								: { width, background: row.paint }
						}
					/>
				</span>
			</>
		);
	}

	// C: the bar is hatched with the same paint; label in mono, muted.
	return (
		<>
			<span
				className={cn(
					"w-40 shrink-0 truncate text-sm",
					extra ? "font-mono text-xs text-fg-muted" : "text-fg-secondary",
				)}
			>
				{row.label}
				{extra && <span className="sr-only"> (extra)</span>}
			</span>
			<span className="h-3 flex-1 bg-bg-panel">
				<span
					data-testid="source-paint"
					className="block h-full"
					style={
						extra
							? {
									width,
									background: `repeating-linear-gradient(135deg, ${row.paint} 0 3px, transparent 3px 6px)`,
								}
							: { width, background: row.paint }
					}
				/>
			</span>
		</>
	);
}

export function ExtraHarnessSwitcher({
	variant,
	onCycle,
}: {
	variant: ExtraVariant;
	onCycle: (step: number) => void;
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
				<span className="flex min-w-[14rem] items-center gap-2 border-x-2 border-white/40 px-4 py-3">
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
				← → to switch · extra-harness prototype (#293)
			</p>
		</div>
	);
}
