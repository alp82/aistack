import type { LegacyFigure } from "@/features/measured/copy";
import { MetricBlock } from "@/features/measured/MetricBlock";

/** A pre-daily reading retains its published total, explicitly approximate. */
export function LegacyStats({ legacy }: { legacy: LegacyFigure }) {
	return (
		<div className="space-y-3">
			<MetricBlock
				tokens={legacy.tokens}
				usd={legacy.usd}
				windowDays={legacy.windowDays}
				trail={[]}
			/>
			<p className="font-mono text-[10px] text-fg-muted">approximate</p>
			<div className="flex gap-3 font-mono text-sm text-fg-primary">
				<span>
					{legacy.activeDays}/{legacy.windowDays} active days
				</span>
				<span>{legacy.sessions.toLocaleString("en-US")} sessions</span>
			</div>
		</div>
	);
}
