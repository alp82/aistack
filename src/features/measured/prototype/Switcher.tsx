/**
 * PROTOTYPE (#107) — the floating bar that flips between variants.
 *
 * Lifted from the #98 prototype, which main has since deleted. It lives with
 * the prototype it serves now, and it goes when this folder goes.
 *
 * Throwaway. It is deliberately loud, so nobody mistakes it for the design it
 * is showing. Hidden in a production build, so a stray merge cannot ship it.
 */

import { useEffect } from "react";

type Axis = {
	readonly name: string;
	readonly keys: readonly string[];
	readonly labels: Record<string, string>;
	readonly current: string;
	readonly onPick: (key: string) => void;
	/** Left and right arrow keys cycle this axis. Only one axis may claim them. */
	readonly arrowKeys?: boolean;
};

function PrototypeSwitcher({
	axes,
	label = "Prototype",
}: {
	readonly axes: readonly Axis[];
	/** Which prototype this bar belongs to, so two of them never look alike. */
	readonly label?: string;
}) {
	const keyed = axes.find((a) => a.arrowKeys);

	useEffect(() => {
		if (!keyed) return;
		function onKey(e: KeyboardEvent) {
			if (!keyed) return;
			const el = document.activeElement;
			const tag = el?.tagName;
			if (
				tag === "INPUT" ||
				tag === "TEXTAREA" ||
				(el as HTMLElement | null)?.isContentEditable
			)
				return;
			if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
			const i = keyed.keys.indexOf(keyed.current);
			const next =
				e.key === "ArrowRight"
					? (i + 1) % keyed.keys.length
					: (i - 1 + keyed.keys.length) % keyed.keys.length;
			keyed.onPick(keyed.keys[next]);
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [keyed]);

	if (import.meta.env.PROD) return null;

	return (
		<div className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t-2 border-accent-lime bg-bg-canvas/95 px-3 py-2 shadow-[0_-6px_0_rgba(0,0,0,0.25)] backdrop-blur">
			<span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent-lime">
				{label}
			</span>
			{axes.map((axis) => (
				<div key={axis.name} className="flex items-center gap-1.5">
					<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-muted">
						{axis.name}
					</span>
					{axis.keys.map((k) => (
						<button
							key={k}
							type="button"
							onClick={() => axis.onPick(k)}
							className={
								k === axis.current
									? "border border-accent-lime bg-accent-lime px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-accent-lime-contrast"
									: "border border-stroke-strong px-2 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-fg-secondary hover:border-accent-lime hover:text-accent-lime"
							}
						>
							{axis.labels[k] ?? k}
						</button>
					))}
				</div>
			))}
		</div>
	);
}

export { PrototypeSwitcher };
export type { Axis as PrototypeAxis };
