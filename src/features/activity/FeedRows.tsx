import { Link } from "@tanstack/react-router";
import type { FeedRow } from "./feed";
import { fmtDelta, fmtTokens, syncFacts, syncTokens } from "./feed";
import { RelativeTime } from "./RelativeTime";

/**
 * One row of the feed, in the grammar #84 locked:
 *
 *   **AI Stack** measured usage moved **+285M**
 *   Claude Code + Codex · 4.99B over 30 days · 596 sessions          4h ago
 *
 * MOVEMENT LEADS and the total is demoted, because `alp synced 4.99B` is the
 * same sentence every day — a snapshot is a rolling 30-day total, and a number
 * that never changes is a status light, not news.
 *
 * THE STACK NAME IS THE LINK, not the person. The feed is about what the site
 * measured, not about who pressed the button.
 */

function Headline({ row }: { readonly row: FeedRow }) {
	const event = row.event;

	if (event.type === "sync.landed") {
		if (row.deltaTokens !== null) {
			return (
				<>
					measured usage moved{" "}
					<span className="font-semibold text-accent-lime">
						{fmtDelta(row.deltaTokens)}
					</span>
				</>
			);
		}
		// No movement to state. `firstReading` is the only case where that is a
		// FACT about the stack rather than the absence of one, so it is the only
		// case that says "first".
		return (
			<>
				{row.firstReading ? "first reading — " : "measured "}
				<span className="font-semibold text-accent-lime">
					{fmtTokens(syncTokens(row))} tokens
				</span>
				{row.firstReading ? " measured" : ""}
			</>
		);
	}

	if (event.type === "stack.published") {
		return (
			<>
				joined with{" "}
				<span className="font-semibold text-accent-lime">
					{event.toolCount} {event.toolCount === 1 ? "tool" : "tools"}
				</span>
			</>
		);
	}

	return (
		<>
			{event.added.length > 0 ? (
				<>
					picked up{" "}
					<span className="font-semibold text-accent-lime">
						{event.added.map((a) => a.name).join(", ")}
					</span>
				</>
			) : null}
			{event.added.length > 0 && event.removed.length > 0 ? " · " : null}
			{event.removed.length > 0 ? (
				<>
					dropped{" "}
					<span className="font-semibold text-fg-secondary">
						{event.removed.map((a) => a.name).join(", ")}
					</span>
				</>
			) : null}
		</>
	);
}

export function FeedRowItem({ row }: { readonly row: FeedRow }) {
	const facts =
		row.event.type === "sync.landed"
			? syncFacts(row)
			: [`by ${row.stack.creator}`];

	return (
		<li className="flex gap-5 border-l-2 border-stroke-subtle py-4 pl-5">
			<div className="min-w-0 flex-1">
				<div className="text-base text-fg-muted">
					<Link
						to="/stacks/$slug"
						params={{ slug: row.stack.slug }}
						className="font-semibold text-fg-primary underline decoration-stroke-subtle underline-offset-4 hover:text-accent-lime hover:decoration-accent-lime"
					>
						{row.stack.name}
					</Link>{" "}
					<Headline row={row} />
				</div>
				<div className="mt-1.5 font-mono text-xs text-fg-muted/50">
					{facts.join(" · ")}
				</div>
			</div>
			<RelativeTime
				at={row.at}
				className="shrink-0 pt-1 font-mono text-xs text-fg-muted/50"
			/>
		</li>
	);
}
