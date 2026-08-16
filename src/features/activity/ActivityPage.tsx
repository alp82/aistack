import { FeedRowItem } from "./FeedRows";
import type { Band, FeedFilter, Stream } from "./feed";
import { dayBucket, MONO_LABEL } from "./feed";
import { PulseBand } from "./PulseBand";

/**
 * `/activity` - variant F of the #96 prototype, sibling of `/leaderboard`.
 *
 * THE BAND TRAVELS. The page opens with the same 24-hour claim the landing page
 * makes, and that is what keeps the thin case warm: three rows under four big
 * numbers read as a quiet site, not a broken page.
 *
 * THE CHIPS NARROW THE STREAM ONLY. The band always states the whole site's
 * last 24 hours - a filter must never rewrite the headline numbers.
 *
 * ROWS STAY ON EVENT-ONLY FACTS. A joined fact line per row lost in the
 * prototype; the snapshot join stays paid once, in the band.
 */

const FILTERS: { key: FeedFilter; label: string }[] = [
	{ key: "all", label: "all" },
	{ key: "sync.landed", label: "syncs" },
	{ key: "stack.published", label: "new stacks" },
	{ key: "stack.composition_changed", label: "changes" },
];

export function ActivityPage({
	band,
	stream,
	filter,
	nowMs,
	onFilter,
	onOlder,
}: {
	readonly band: Band;
	readonly stream: Stream;
	readonly filter: FeedFilter;
	readonly nowMs: number;
	readonly onFilter: (next: FeedFilter) => void;
	readonly onOlder: () => void;
}) {
	const atCap = !stream.hasMore && stream.rows.length >= stream.maxRows;
	let lastDay = "";

	return (
		<div className="min-h-screen bg-bg-canvas">
			<PulseBand band={band} />

			<div className="px-6 py-16">
				<div className="mx-auto w-full max-w-content">
					<div className="mb-12 flex flex-wrap gap-2">
						{FILTERS.map((f) => (
							<button
								type="button"
								key={f.key}
								aria-pressed={filter === f.key}
								onClick={() => onFilter(f.key)}
								className={`${MONO_LABEL} border-2 px-3 py-2 transition-colors ${
									filter === f.key
										? "border-accent-lime bg-accent-lime text-accent-lime-contrast"
										: "border-stroke-strong text-fg-muted hover:border-accent-lime hover:text-accent-lime"
								}`}
							>
								{f.label}
							</button>
						))}
					</div>

					{stream.rows.length === 0 ? (
						<p className="font-mono text-sm text-fg-muted/60">
							nothing here yet.
						</p>
					) : null}

					{stream.rows.map((row) => {
						const day = dayBucket(row.at, nowMs);
						const opensDay = day !== lastDay;
						lastDay = day;
						return (
							<div key={row.id}>
								{opensDay ? (
									<div
										className={`${MONO_LABEL} mb-4 mt-12 text-fg-muted first:mt-0`}
										suppressHydrationWarning
									>
										{day}
									</div>
								) : null}
								<ul>
									<FeedRowItem row={row} />
								</ul>
							</div>
						);
					})}

					{stream.hasMore ? (
						<button
							type="button"
							onClick={onOlder}
							className={`${MONO_LABEL} mt-12 border-2 border-stroke-strong px-6 py-3 text-fg-muted transition-colors hover:border-accent-lime hover:text-accent-lime`}
						>
							older →
						</button>
					) : null}

					{/* A cap that says nothing reads as "that was everything". */}
					{atCap ? (
						<p className="mt-12 font-mono text-xs text-fg-muted/40">
							showing the newest {stream.maxRows} events.
						</p>
					) : null}

					{!stream.hasMore && !atCap && stream.rows.length > 0 ? (
						<p className="mt-12 font-mono text-xs text-fg-muted/40">
							that is everything since instrumentation went live.
						</p>
					) : null}
				</div>
			</div>
		</div>
	);
}
