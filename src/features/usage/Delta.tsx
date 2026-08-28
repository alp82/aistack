import { ratioChange } from "@aistack/workflow-rules";
import { cn } from "@/lib/utils";
import { fmtPercentChange, PREVIOUS_LABEL, type RangeId } from "./copy";

/** The two sides of one figure. Null on either side prints no chip. */
export type Comparison = {
	readonly current: number;
	readonly previous: number;
} | null;

/**
 * The previous-period chip: "▲ 12% vs the 30 days before".
 *
 * A figure with no per-day rows on either side prints no chip (spec, "The
 * section"). A previous period of zero has no ratio and prints none either.
 * Up wears the accent, down is muted, and an unchanged figure reads "±0%".
 */
export function Delta({
	comparison,
	range,
}: {
	comparison: Comparison;
	range: RangeId;
}) {
	if (!comparison) return null;
	const ratio = ratioChange(comparison.current, comparison.previous);
	if (ratio === null) return null;
	const up = ratio > 0;
	return (
		<span
			data-testid="delta"
			className={cn(
				"font-mono text-[11px]",
				up ? "text-accent-lime" : "text-fg-muted",
			)}
		>
			{fmtPercentChange(ratio)}{" "}
			<span className="text-fg-muted">{PREVIOUS_LABEL[range]}</span>
		</span>
	);
}
