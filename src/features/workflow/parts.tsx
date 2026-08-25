import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fmtPercent, MONO_LABEL } from "./copy";

/**
 * The small marks the seven component bodies share.
 *
 * Wayfinder ticket #215 (map #200). These are plain DOM, not `@tanstack/charts`
 * marks: `src/features/charts` stays the one place that imports the library,
 * and a segmented bar of `<i>` elements needs neither a scale nor an axis.
 * `ModelShareRows` in the measured section set the same precedent.
 *
 * SQUARE ENDS EVERYWHERE, and no border-radius (AGENTS.md).
 */

export type Segment = {
	key: string;
	value: number;
	paint: string;
	label: string;
};

/** One horizontal bar split into segments, sized by share of the total. */
export function Strip({
	segments,
	className,
	height = "h-3",
}: {
	segments: readonly Segment[];
	className?: string;
	height?: string;
}) {
	const total = segments.reduce((sum, segment) => sum + segment.value, 0);
	if (total <= 0) return null;
	return (
		<div className={cn("flex w-full bg-bg-panel", height, className)}>
			{segments.map((segment) => (
				<i
					key={segment.key}
					title={`${segment.label} ${fmtPercent(segment.value / total)}`}
					className="block h-full"
					style={{
						flexGrow: segment.value,
						flexBasis: 0,
						background: segment.paint,
					}}
				/>
			))}
		</div>
	);
}

/** The legend a strip of two or more segments always carries. */
export function Legend({ segments }: { segments: readonly Segment[] }) {
	return (
		<ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
			{segments.map((segment) => (
				<li
					key={segment.key}
					className="flex items-center gap-1.5 font-mono text-[11px] text-fg-secondary"
				>
					<span
						aria-hidden="true"
						className="size-2 shrink-0"
						style={{ background: segment.paint }}
					/>
					{segment.label}
				</li>
			))}
		</ul>
	);
}

/** A ranked list row: name, proportional bar, figure. */
export function BarRow({
	rank,
	name,
	share,
	figure,
	paint = "var(--accent-lime)",
}: {
	rank: number;
	name: string;
	/** 0..1 of the widest row, for the bar's width. */
	share: number;
	figure: string;
	paint?: string;
}) {
	return (
		<div className="flex items-center gap-3 py-1.5">
			<span className="w-6 shrink-0 font-mono text-[11px] text-fg-muted">
				{String(rank).padStart(2, "0")}
			</span>
			<span className="w-40 shrink-0 truncate text-sm text-fg-primary">
				{name}
			</span>
			<span className="h-3 flex-1 bg-bg-panel">
				<span
					className="block h-full"
					style={{
						width: `${Math.max(1, share * 100)}%`,
						background: paint,
					}}
				/>
			</span>
			<span className="w-16 shrink-0 text-right font-mono text-sm text-fg-primary">
				{figure}
			</span>
		</div>
	);
}

/** A component body's own kicker, in the section's mono voice. */
export function BodyKicker({ children }: { children: ReactNode }) {
	return <p className={cn(MONO_LABEL, "mb-3 text-accent-lime")}>{children}</p>;
}

/** The line under a body that names what produced it. */
export function BodyFootnote({ children }: { children: ReactNode }) {
	return <p className="mt-4 font-mono text-[11px] text-fg-muted">{children}</p>;
}
