import { useState } from "react";
import { CHART_PAINTS } from "@/features/charts";
import { cn } from "@/lib/utils";
import {
	BODY_KICKERS,
	fmtLines,
	fmtNumber,
	fmtPercent,
	harnessLabelOf,
	hourLabel,
	MONO_LABEL,
	type WorkflowView,
	weekdayLabel,
} from "./copy";
import { Playbook } from "./Playbook";
import {
	BarRow,
	BodyFootnote,
	BodyKicker,
	Legend,
	type Segment,
	Strip,
} from "./parts";

/**
 * The seven component bodies (spec, "The section").
 *
 * Wayfinder ticket #215 (map #200). Each one renders aggregates the machine
 * already shipped: the phase playbook, model routing, the kit, delegation, the
 * Git ledger, coding languages, and the week/time heatmap.
 *
 * POSITIVE CLAIMS ONLY (#40, carried on the map's Notes). Nothing here says a
 * listed thing went unused, and a component with nothing to show renders a line
 * about the reading rather than a demerit on the author.
 */
export function ComponentBody({
	componentId,
	view,
}: {
	componentId: string;
	view: WorkflowView;
}) {
	switch (componentId) {
		case "phase-playbook":
			return <Playbook view={view} />;
		case "model-routing":
			return <ModelRouting view={view} />;
		case "kit":
			return <Kit view={view} />;
		case "delegation":
			return <Delegation view={view} />;
		case "git-ledger":
			return <GitLedger view={view} />;
		case "coding-languages":
			return <CodingLanguages view={view} />;
		case "activity-heatmap":
			return <ActivityHeatmap view={view} />;
		default:
			return null;
	}
}

const paintFor = (index: number): string =>
	CHART_PAINTS[index % CHART_PAINTS.length] as string;

function sumBy<T>(rows: readonly T[], value: (row: T) => number): number {
	return rows.reduce((sum, row) => sum + value(row), 0);
}

/** Fold `{name, value}` pairs into one ranked list, largest first. */
function rank(
	entries: readonly { name: string; value: number }[],
): { name: string; value: number }[] {
	const byName = new Map<string, number>();
	for (const entry of entries) {
		byName.set(entry.name, (byName.get(entry.name) ?? 0) + entry.value);
	}
	return [...byName.entries()]
		.map(([name, value]) => ({ name, value }))
		.filter((row) => row.value > 0)
		.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

function EmptyBody({ children }: { children: React.ReactNode }) {
	return <p className="text-sm text-fg-secondary">{children}</p>;
}

// ---------------------------------------------------------------------------
// Model routing: the main loop against the subagents.
// ---------------------------------------------------------------------------

function ModelRouting({ view }: { view: WorkflowView }) {
	const harnesses = view.section.harnesses.filter((h) => h.routing);
	const main = rank(
		harnesses.flatMap((h) =>
			(h.routing?.main ?? []).map((row) => ({
				name: row.model,
				value: row.tokens,
			})),
		),
	);
	const subagents = rank(
		harnesses.flatMap((h) =>
			(h.routing?.subagents ?? []).map((row) => ({
				name: row.model,
				value: row.tokens,
			})),
		),
	);
	if (main.length === 0 && subagents.length === 0) {
		return (
			<EmptyBody>
				No harness on this machine records a model per response.
			</EmptyBody>
		);
	}

	// ONE PALETTE ACROSS BOTH ROWS. A model must wear the same paint in the main
	// loop and in the subagents, or the two strips would answer different
	// questions with the same colors.
	const models = rank([...main, ...subagents]).map((row, index) => ({
		name: row.name,
		paint: paintFor(index),
	}));
	const paintOf = (name: string) =>
		models.find((model) => model.name === name)?.paint ??
		"var(--bg-panel-elevated)";
	const segments = (rows: { name: string; value: number }[]): Segment[] =>
		rows.map((row) => ({
			key: row.name,
			value: row.value,
			paint: paintOf(row.name),
			label: row.name,
		}));

	const mainTokens = sumBy(main, (row) => row.value);
	const subagentTokens = sumBy(subagents, (row) => row.value);
	const total = mainTokens + subagentTokens;

	return (
		<div>
			<BodyKicker>{BODY_KICKERS["model-routing"]}</BodyKicker>
			<RouteRow
				who="main loop"
				share={total > 0 ? mainTokens / total : 0}
				segments={segments(main)}
			/>
			<RouteRow
				who="subagents"
				share={total > 0 ? subagentTokens / total : 0}
				segments={segments(subagents)}
			/>
			<Legend
				segments={models.map((model) => ({
					key: model.name,
					value: 1,
					paint: model.paint,
					label: model.name,
				}))}
			/>
			<BodyFootnote>
				share of response tokens ·{" "}
				{harnesses.map((h) => harnessLabelOf(h.harness)).join(" · ")}
			</BodyFootnote>
		</div>
	);
}

function RouteRow({
	who,
	share,
	segments,
}: {
	who: string;
	share: number;
	segments: readonly Segment[];
}) {
	if (segments.length === 0) return null;
	return (
		<div className="mt-3">
			<p className="mb-1 flex items-baseline justify-between gap-4">
				<span className="text-sm text-fg-primary">{who}</span>
				<span className="font-mono text-xs text-fg-muted">
					{fmtPercent(share)} of tokens
				</span>
			</p>
			<Strip segments={segments} height="h-4" />
		</div>
	);
}

// ---------------------------------------------------------------------------
// The kit: skills and MCP servers, by share of the calls they were measured in.
// ---------------------------------------------------------------------------

function Kit({ view }: { view: WorkflowView }) {
	const skills = rank(
		view.kit.flatMap((harness) =>
			harness.skills.map((atom) => ({
				name: atom.name,
				value: atom.callShare,
			})),
		),
	);
	const servers = rank(
		view.kit.flatMap((harness) =>
			harness.mcpServers.map((atom) => ({
				name: atom.name,
				value: atom.callShare,
			})),
		),
	);
	const withheld = sumBy(
		view.kit,
		(harness) => harness.withheld.skills + harness.withheld.mcpServers,
	);
	if (skills.length === 0 && servers.length === 0) {
		return (
			<EmptyBody>No skill or MCP call is published for this machine.</EmptyBody>
		);
	}

	return (
		<div>
			<BodyKicker>{BODY_KICKERS.kit}</BodyKicker>
			<KitList title="skills" rows={skills} />
			<KitList title="mcp servers" rows={servers} />
			<BodyFootnote>
				share of calls in each category
				{withheld > 0 ? ` · ${withheld} names withheld on the machine` : ""}
			</BodyFootnote>
		</div>
	);
}

function KitList({
	title,
	rows,
}: {
	title: string;
	rows: readonly { name: string; value: number }[];
}) {
	if (rows.length === 0) return null;
	const widest = rows[0]?.value ?? 1;
	return (
		<div className="mt-4">
			<p className={cn(MONO_LABEL, "mb-1 text-fg-muted")}>{title}</p>
			{rows.slice(0, 6).map((row, index) => (
				<BarRow
					key={row.name}
					rank={index + 1}
					name={row.name}
					share={widest > 0 ? row.value / widest : 0}
					figure={fmtPercent(row.value)}
				/>
			))}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Delegation: the main loop against the subagents, and the two records.
// ---------------------------------------------------------------------------

function Delegation({ view }: { view: WorkflowView }) {
	const rows = view.section.harnesses
		.map((harness) => harness.delegation)
		.filter((row): row is NonNullable<typeof row> => row !== undefined);
	if (rows.length === 0) {
		return (
			<EmptyBody>
				No harness on this machine records a subagent call separately.
			</EmptyBody>
		);
	}
	const mainCalls = sumBy(rows, (row) => row.mainToolCalls);
	const subagentCalls = sumBy(rows, (row) => row.subagentToolCalls);
	const widestFanOut = Math.max(...rows.map((row) => row.widestFanOut));
	const mostSubagents = Math.max(...rows.map((row) => row.mostSubagents));
	const types = rank(
		view.kit.flatMap((harness) =>
			harness.subagents.map((atom) => ({
				name: atom.name,
				value: atom.callShare,
			})),
		),
	);
	const widest = types[0]?.value ?? 1;

	return (
		<div>
			<BodyKicker>{BODY_KICKERS.delegation}</BodyKicker>
			<div className="grid gap-6 md:grid-cols-2">
				<div>
					<p className="font-mono text-3xl font-black text-fg-primary">
						{ratio(mainCalls, subagentCalls)}
					</p>
					<p className={cn(MONO_LABEL, "mt-2 text-fg-muted")}>
						main-loop to subagent tool calls
					</p>
					<div className="mt-4 grid grid-cols-2 gap-px border border-stroke-subtle bg-stroke-subtle">
						<Record
							value={widestFanOut}
							label="widest parallel fan-out in one session"
						/>
						<Record
							value={mostSubagents}
							label="most subagents in one session"
						/>
					</div>
				</div>
				{types.length > 0 && (
					<div>
						<p className={cn(MONO_LABEL, "mb-1 text-fg-muted")}>
							subagent runs by type
						</p>
						{types.slice(0, 5).map((row, index) => (
							<BarRow
								key={row.name}
								rank={index + 1}
								name={row.name}
								share={widest > 0 ? row.value / widest : 0}
								figure={fmtPercent(row.value)}
							/>
						))}
					</div>
				)}
			</div>
			<BodyFootnote>
				{view.section.harnesses
					.filter((harness) => harness.delegation)
					.map((harness) => harnessLabelOf(harness.harness))
					.join(" · ")}
			</BodyFootnote>
		</div>
	);
}

/** "2 : 1", reduced against the smaller side. Both zero has no ratio to print. */
function ratio(main: number, subagents: number): string {
	if (subagents <= 0) return main > 0 ? `${fmtNumber(main)} : 0` : "0 : 0";
	return `${fmtNumber(main / subagents)} : 1`;
}

function Record({ value, label }: { value: number; label: string }) {
	return (
		<div className="bg-bg-canvas p-3">
			<p className="font-mono text-2xl font-black text-fg-primary">
				{fmtNumber(value)}
			</p>
			<p className="mt-1 text-[11px] leading-snug text-fg-muted">{label}</p>
		</div>
	);
}

// ---------------------------------------------------------------------------
// The Git ledger: removals in red, per-commit sizes as a log-scale dot strip.
// ---------------------------------------------------------------------------

/** Dots the strip draws before it stops. A 30-day window rarely reaches it. */
const MAX_DOTS = 240;

function GitLedger({ view }: { view: WorkflowView }) {
	const git = view.section.git;
	const changed = git.additions + git.removals;
	if (git.commits === 0) {
		return (
			<EmptyBody>
				No commit in this window sits in a repository a session touched.
			</EmptyBody>
		);
	}
	const dots = git.changedLinesPerCommit.slice(0, MAX_DOTS);
	const dropped = git.changedLinesPerCommit.length - dots.length;

	return (
		<div>
			<BodyKicker>{BODY_KICKERS["git-ledger"]}</BodyKicker>
			<div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
				<p className="font-mono text-2xl font-black text-accent-lime">
					+{fmtLines(git.additions)}
				</p>
				<p
					className="font-mono text-2xl font-black"
					style={{ color: "var(--destructive)" }}
				>
					-{fmtLines(git.removals)}
				</p>
				<p className="font-mono text-xs text-fg-muted">
					{git.commits.toLocaleString("en-US")} commits ·{" "}
					{fmtPercent(changed > 0 ? git.removals / changed : 0)} of changed
					lines are removals
				</p>
			</div>

			<Strip
				className="mt-3"
				height="h-4"
				segments={[
					{
						key: "additions",
						value: git.additions,
						paint: "var(--accent-lime)",
						label: "additions",
					},
					{
						key: "removals",
						value: git.removals,
						paint: "var(--destructive-fill)",
						label: "removals",
					},
				]}
			/>

			{dots.length > 0 && (
				<div className="mt-5">
					<p className={cn(MONO_LABEL, "mb-2 text-fg-muted")}>
						one dot per commit · log scale
					</p>
					<CommitDots sizes={dots} />
					{dropped > 0 && (
						<p className="mt-2 font-mono text-[11px] text-fg-muted">
							{dropped.toLocaleString("en-US")} further commits not drawn
						</p>
					)}
				</div>
			)}

			<BodyFootnote>
				{git.testFileCommits.toLocaleString("en-US")} commits touch a test file
				· {git.testFileRuleVersion}
				{git.commitSetRuleVersion ? ` · ${git.commitSetRuleVersion}` : ""}
			</BodyFootnote>
		</div>
	);
}

/**
 * One dot per commit, sized on a log scale.
 *
 * A LOG SCALE, because a 4,000-line commit beside a 4-line one on a linear
 * scale makes every ordinary commit an invisible speck. Order carries no
 * meaning: the wire ships the sizes unordered on purpose, so nothing here may
 * read as a timeline.
 */
function CommitDots({ sizes }: { sizes: readonly number[] }) {
	const largest = Math.max(...sizes, 1);
	const ceiling = Math.log10(largest + 1);
	return (
		<div className="flex flex-wrap items-end gap-1">
			{sizes.map((lines, index) => {
				const scaled = ceiling > 0 ? Math.log10(lines + 1) / ceiling : 0;
				const px = 3 + Math.round(scaled * 9);
				return (
					<span
						// The sizes are unordered and repeat, so the index is the identity.
						key={`${index}-${lines}`}
						title={`${lines.toLocaleString("en-US")} changed lines`}
						className="block shrink-0 bg-accent-lime"
						style={{ width: px, height: px }}
					/>
				);
			})}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Coding languages: changed lines by file type.
// ---------------------------------------------------------------------------

function CodingLanguages({ view }: { view: WorkflowView }) {
	const git = view.section.git;
	const rows = rank(
		git.changedLinesByExtension.map((row) => ({
			name: row.extension,
			value: row.changedLines,
		})),
	);
	if (rows.length === 0) {
		return (
			<EmptyBody>No approved file type carries a changed line here.</EmptyBody>
		);
	}
	// The withheld lines belong in the denominator: a stack whose top language is
	// unapproved would otherwise read as more concentrated than it is.
	const total = sumBy(rows, (row) => row.value) + git.withheldExtensionLines;
	const widest = rows[0]?.value ?? 1;

	return (
		<div>
			<BodyKicker>{BODY_KICKERS["coding-languages"]}</BodyKicker>
			{rows.slice(0, 8).map((row, index) => (
				<BarRow
					key={row.name}
					rank={index + 1}
					name={row.name}
					share={widest > 0 ? row.value / widest : 0}
					figure={fmtPercent(total > 0 ? row.value / total : 0)}
				/>
			))}
			<BodyFootnote>
				{fmtLines(total)} changed lines ·{" "}
				{git.withheldExtensionLines > 0
					? `${fmtLines(git.withheldExtensionLines)} in file types the machine withheld · `
					: ""}
				{git.fileTypeRuleVersion}
			</BodyFootnote>
		</div>
	);
}

// ---------------------------------------------------------------------------
// The week/time heatmap, with a per-cell popup.
// ---------------------------------------------------------------------------

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const WEEKDAY_ROWS = [1, 2, 3, 4, 5, 6, 0];

type HeatSeries = "sessions" | "commits";

/**
 * ONE component with ONE band (#279). The commit grid is a second series on
 * the same heatmap, not a second row: a near-identical row would compete for
 * placement against this one. The row's RANKED figure is the session share and
 * never follows the toggle, because the page ranks nothing and a reader's
 * switch must not move a row. The body figure under the grid recomputes for
 * whichever series is shown, so the reader always has a number for what they
 * are looking at.
 */
function ActivityHeatmap({ view }: { view: WorkflowView }) {
	const [selected, setSelected] = useState<string | null>(null);
	const [series, setSeries] = useState<HeatSeries>("sessions");
	const offset = view.utcOffsetMinutes;
	const cells = new Map<string, number>();
	const add = (weekdayUtc: number, hourUtc: number, count: number): void => {
		// SHIFTED INTO THE OWNER'S LOCAL TIME, for the reason the lead's rhythm
		// clause is: the reader's own clock would put a stranger's habit at the
		// wrong hour. Without an offset the grid stays in UTC and says so. Both
		// series shift by the same offset, so a commit and a session at the same
		// real moment land in the same cell.
		const shifted = shift(weekdayUtc, hourUtc, offset ?? 0);
		const key = `${shifted.weekday}-${shifted.hour}`;
		cells.set(key, (cells.get(key) ?? 0) + count);
	};
	if (series === "sessions") {
		for (const harness of view.section.harnesses) {
			for (const cell of harness.activity) {
				add(cell.weekdayUtc, cell.hourUtc, cell.events);
			}
		}
	} else {
		for (const cell of view.section.git.weekdayHourCells) {
			add(cell.weekdayUtc, cell.hourUtc, cell.commits);
		}
	}
	const hasCommits = view.section.git.weekdayHourCells.length > 0;
	const unit = series === "sessions" ? "events" : "commits";
	const busiest = cells.size > 0 ? Math.max(...cells.values()) : 0;
	const chosen = selected === null ? null : (cells.get(selected) ?? 0);

	const toggle = hasCommits ? (
		<div className="mb-2 flex gap-1">
			{(["sessions", "commits"] as const).map((option) => (
				<button
					key={option}
					type="button"
					onClick={() => {
						setSeries(option);
						setSelected(null);
					}}
					aria-pressed={series === option}
					className={cn(
						MONO_LABEL,
						"border px-2 py-0.5",
						series === option
							? "border-accent-lime text-fg-primary"
							: "border-border text-fg-muted",
					)}
				>
					{option}
				</button>
			))}
		</div>
	) : null;

	if (cells.size === 0) {
		return (
			<div>
				<BodyKicker>{BODY_KICKERS["activity-heatmap"]}</BodyKicker>
				{toggle}
				<EmptyBody>
					{series === "sessions"
						? "No harness on this machine records an event clock."
						: "No commit in this window sits in a repository a session touched."}
				</EmptyBody>
			</div>
		);
	}

	return (
		<div>
			<BodyKicker>{BODY_KICKERS["activity-heatmap"]}</BodyKicker>
			{toggle}
			<div className="overflow-x-auto">
				<div className="min-w-[34rem]">
					{WEEKDAY_ROWS.map((weekday) => (
						<div key={weekday} className="flex items-center gap-1">
							<span className="w-9 shrink-0 font-mono text-[10px] text-fg-muted">
								{weekdayLabel(weekday)}
							</span>
							{HOURS.map((hour) => {
								const key = `${weekday}-${hour}`;
								const count = cells.get(key) ?? 0;
								return (
									<button
										key={key}
										type="button"
										onClick={() =>
											setSelected((held) => (held === key ? null : key))
										}
										aria-label={`${weekdayLabel(weekday)} ${hourLabel(hour)}, ${count} ${unit}`}
										aria-pressed={selected === key}
										className={cn(
											"h-4 flex-1",
											selected === key &&
												"outline outline-1 outline-accent-lime",
										)}
										style={{ background: heatPaint(count, busiest) }}
									/>
								);
							})}
						</div>
					))}
					<div className="mt-1 flex items-center gap-1">
						<span className="w-9 shrink-0" />
						{HOURS.map((hour) => (
							<span
								key={hour}
								className="flex-1 text-center font-mono text-[9px] text-fg-muted"
							>
								{hour % 6 === 0 ? hour : ""}
							</span>
						))}
					</div>
				</div>
			</div>

			<p className="mt-3 font-mono text-xs text-fg-secondary">
				<b className="text-fg-primary">
					{fmtPercent(busiestHoursShare(cells))}
				</b>{" "}
				of {unit} fall in the three busiest hours
			</p>

			<p className="mt-1 font-mono text-xs text-fg-secondary">
				{selected === null ? (
					<span className="text-fg-muted">
						Select a cell for its{" "}
						{series === "sessions" ? "recorded events" : "commits"}.
					</span>
				) : (
					<>
						{weekdayLabel(Number(selected.split("-")[0]))}{" "}
						{hourLabel(Number(selected.split("-")[1]))} ·{" "}
						<b className="text-fg-primary">
							{(chosen ?? 0).toLocaleString("en-US")}
						</b>{" "}
						{series === "sessions" ? "recorded events" : "commits"}
					</>
				)}
			</p>

			<BodyFootnote>
				{offset === null
					? "hours in UTC · this reading carries no machine offset"
					: "hours in the owner's local time"}
			</BodyFootnote>
		</div>
	);
}

/**
 * The same arithmetic as the `activity-heatmap` component rule, over the
 * series on screen. The shift is a whole number of hours, so summing the
 * shifted cells by hour gives the rule's figure exactly for the session series.
 */
function busiestHoursShare(cells: Map<string, number>): number {
	const byHour = new Map<number, number>();
	for (const [key, count] of cells) {
		const hour = Number(key.split("-")[1]);
		byHour.set(hour, (byHour.get(hour) ?? 0) + count);
	}
	const total = sumBy([...byHour.values()], (n) => n);
	if (total <= 0) return 0;
	const top = [...byHour.values()].sort((a, b) => b - a).slice(0, 3);
	return sumBy(top, (n) => n) / total;
}

function shift(
	weekdayUtc: number,
	hourUtc: number,
	offsetMinutes: number,
): { weekday: number; hour: number } {
	const minutes = weekdayUtc * 24 * 60 + hourUtc * 60 + offsetMinutes;
	const week = 7 * 24 * 60;
	const wrapped = ((minutes % week) + week) % week;
	return {
		weekday: Math.floor(wrapped / (24 * 60)),
		hour: Math.floor((wrapped % (24 * 60)) / 60),
	};
}

/** Five steps, so a busy cell and a quiet one never read as the same tint. */
function heatPaint(events: number, busiest: number): string {
	if (events <= 0) return "var(--bg-panel)";
	const share = busiest > 0 ? events / busiest : 0;
	const mix = share < 0.12 ? 18 : share < 0.3 ? 38 : share < 0.6 ? 62 : 90;
	return `color-mix(in oklab, var(--accent-lime) ${mix}%, var(--bg-panel))`;
}
