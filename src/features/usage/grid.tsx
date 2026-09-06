import { MONO_LABEL } from "@/features/measured/copy";
import { cn } from "@/lib/utils";
import type { RangeId } from "./copy";
import { Delta } from "./Delta";
import type { Item } from "./items";

/**
 * The two shapes an open topic prints (#356, prototype v37 "feature"):
 *
 *   - `LeadCard`, on the left: the topic's lead item with its body inline,
 *     under its name as a label. Lines changed prints no head figure: its
 *     green and red pair in the body is the figure.
 *   - `ScanRow`, on the right: one line per remaining item, the figure in the
 *     accent, then the name and the caption. No picture: the row is a line to
 *     scan, and the chart of the topic is the lead.
 */
export function LeadCard({
	it,
	range,
	className,
}: {
	it: Item;
	range: RangeId;
	className?: string;
}) {
	const body = it.body ? it.body() : it.picture(true);
	const bare = it.id === "component:git-ledger";
	return (
		<div
			data-testid="usage-cell"
			data-lead="true"
			className={cn("flex flex-col", className)}
		>
			<p className="flex flex-wrap items-baseline gap-x-3">
				<span className={cn(MONO_LABEL, "text-fg-muted")}>{it.name}</span>
				{!bare && (
					<>
						<span className="font-mono text-sm font-bold text-accent-lime">
							{it.figure}
						</span>
						<span className="text-xs text-fg-secondary">{it.caption}</span>
					</>
				)}
				<Delta comparison={it.comparison} range={range} />
			</p>
			{body !== null && body !== undefined && (
				<div className="mt-3 flex min-h-0 flex-1 flex-col [&>*]:flex-1">
					{body}
				</div>
			)}
		</div>
	);
}

export function ScanRow({ it, range }: { it: Item; range: RangeId }) {
	return (
		<div
			data-testid="usage-cell"
			className="flex items-baseline gap-3 border-b border-stroke-subtle py-2"
		>
			<b className="w-20 shrink-0 whitespace-nowrap text-right font-mono text-[15px] font-black leading-tight text-accent-lime">
				{it.figure}
			</b>
			<p className="min-w-0 text-[13px] leading-snug text-fg-secondary">
				<b className="font-semibold text-fg-primary">{it.name}</b>
				<span className="text-fg-muted"> · </span>
				{it.caption}
				{it.comparison && (
					<>
						{" "}
						<Delta comparison={it.comparison} range={range} />
					</>
				)}
			</p>
		</div>
	);
}
