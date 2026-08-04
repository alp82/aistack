/**
 * PROTOTYPE — throwaway. Wayfinder ticket #84 (map #76).
 *
 * The D2a row, locked by the owner: movement leads, the total is demoted, the
 * stack name is the link. The three D2a* variants differ ONLY in how much of
 * the sync detail rides along, so the row itself is shared and takes a `detail`
 * level.
 */

import { fmtAgo, fmtDelta, fmtPercent, fmtTokens, harnessList } from "./format";
import type { DisplayRow } from "./useFeedPrototype";

export type DetailLevel = "minimal" | "wide" | "stacked";

function Headline({ row }: { row: DisplayRow }) {
	const event = row.event;

	if (event.type === "sync.landed") {
		if (row.deltaTokens === undefined) {
			return (
				<>
					first reading —{" "}
					<span className="font-semibold text-accent-lime">
						{fmtTokens(event.harnesses.reduce((s, h) => s + h.totalTokens, 0))}{" "}
						tokens
					</span>{" "}
					measured
				</>
			);
		}
		return (
			<>
				measured usage moved{" "}
				<span className="font-semibold text-accent-lime">
					{fmtDelta(row.deltaTokens)}
				</span>
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
			{event.added.length ? (
				<>
					picked up{" "}
					<span className="font-semibold text-accent-lime">
						{event.added.map((a) => a.name).join(", ")}
					</span>
				</>
			) : null}
			{event.added.length && event.removed.length ? " · " : null}
			{event.removed.length ? (
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

/**
 * The facts a sync row can carry, in the order they earn their place.
 *
 * Everything up to `sessions` is on the EVENT. Everything after it is on the
 * snapshot the sync wrote, so a row that shows it needs the read query to join
 * — which is the cost this variant is asking the owner to accept.
 */
function syncFacts(row: DisplayRow): string[] {
	if (row.event.type !== "sync.landed") return [];
	const e = row.event;
	const sessions = e.harnesses.reduce((s, h) => s + h.sessions, 0);
	const projects = e.harnesses.reduce((s, h) => s + h.projects, 0);
	const activeDays = Math.max(...e.harnesses.map((h) => h.activeDays));
	const windowDays = e.harnesses[0]?.windowDays ?? 30;
	const snap = row.snapshot;

	const facts = [
		harnessList(e.harnesses.map((h) => h.harness)),
		`${fmtTokens(e.harnesses.reduce((s, h) => s + h.totalTokens, 0))} over ${windowDays} days`,
		`${sessions} sessions`,
		`${projects} projects`,
		`${activeDays}/${windowDays} active days`,
	];

	if (!snap) return facts;
	facts.push(`${snap.modelIds.length} models`);
	facts.push(`${snap.toolNames.length} tools`);
	if (snap.mcpServers > 0) facts.push(`${snap.mcpServers} MCP`);
	if (snap.skills > 0) facts.push(`${snap.skills} skills`);
	if (snap.subagents > 0) facts.push(`${snap.subagents} subagents`);
	facts.push(`${fmtPercent(snap.cacheHitShare)} cached`);
	if (snap.subagentShare > 0) {
		facts.push(`${fmtPercent(snap.subagentShare)} subagent work`);
	}
	if (snap.keptPrivate > 0)
		facts.push(`${snap.keptPrivate} names kept private`);
	return facts;
}

export function Row({ row, detail }: { row: DisplayRow; detail: DetailLevel }) {
	const event = row.event;
	const facts =
		event.type === "sync.landed" ? syncFacts(row) : [`by ${row.stack.creator}`];
	// `minimal` keeps the event-only facts; the rest need the snapshot join.
	const shown = detail === "minimal" ? facts.slice(0, 3) : facts;

	return (
		<li
			className={`flex gap-5 border-l-2 py-4 pl-5 transition-colors duration-1000 ${
				row.isNew
					? "border-accent-lime bg-accent-lime/10"
					: "border-stroke-subtle"
			}`}
		>
			<div className="min-w-0 flex-1">
				<div className="text-base text-fg-muted">
					<a
						href={`/stacks/${row.stack.slug}`}
						className="font-semibold text-fg-primary underline decoration-stroke-subtle underline-offset-4 hover:text-accent-lime hover:decoration-accent-lime"
					>
						{row.stack.name}
					</a>{" "}
					<Headline row={row} />
				</div>

				{detail === "stacked" && event.type === "sync.landed" ? (
					<dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
						{shown.slice(1).map((fact) => {
							const [value, ...rest] = fact.split(" ");
							return (
								<div key={fact}>
									<dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted/40">
										{rest.join(" ")}
									</dt>
									<dd className="mt-0.5 font-mono text-sm tabular-nums text-fg-secondary">
										{value}
									</dd>
								</div>
							);
						})}
					</dl>
				) : (
					<div className="mt-1.5 font-mono text-xs text-fg-muted/50">
						{shown.join(" · ")}
					</div>
				)}
			</div>
			<span className="shrink-0 pt-1 font-mono text-xs text-fg-muted/50">
				{fmtAgo(row.minutesAgo)}
			</span>
		</li>
	);
}
