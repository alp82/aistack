import type { PlaybookTrack } from "@aistack/workflow-rules";
import { type FocusEvent, type MouseEvent, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
	ACCENT,
	fmtCount,
	fmtLines,
	fmtMinutes,
	fmtNumber,
	fmtPercent,
	harnessLabelOf,
	hourLabel,
	PHASE_ORDER,
	PHASE_PAINT,
	shortModel,
	type WorkflowView,
	weekdayLabel,
} from "./copy";
import {
	delegation,
	effortShares,
	type HeatSeries,
	heatCells,
	languages,
	mcpServers,
	peakOf,
	playbookOf,
	routing,
	skills,
	startProfile,
	subagentTypes,
	sumBy,
	thinkingByHarness,
	turnHistogram,
} from "./derive";
import { delegationSegments, effortSegments } from "./heads";
import {
	BarRow,
	ColLabel,
	Cols,
	Histogram,
	heatPaint,
	Legend,
	type Segment,
	Strip,
	Sub,
} from "./parts";

/**
 * The bodies: what a row shows when it opens (#284, decision 4).
 *
 * A ROW EXPANDS ONLY WHEN ITS BODY ADDS A PICTURE THE HEAD CANNOT HOLD. The
 * four flat rows (late-night commits, questions asked, web searches, parallel
 * projects) have no entry here, and the row set never asks for one.
 *
 * NO KICKER, NO FOOTNOTE, NO PROVENANCE (#284, decision 5). A body is its
 * picture, its figures, and the one mono line a picture needs to be read.
 *
 * POSITIVE CLAIMS ONLY (#40). Nothing here says a listed thing went unused, and
 * a body with nothing to show says so about the reading, never about the author.
 */
export function RowBody({
	rowId,
	view,
}: {
	rowId: string;
	view: WorkflowView;
}) {
	switch (rowId) {
		case "component:activity-heatmap":
			return <ActivityHeatmap view={view} />;
		case "component:start-hours":
			return <StartHours view={view} />;
		case "component:phase-playbook":
			return <SessionLength view={view} />;
		case "component:git-ledger":
			return <GitLedger view={view} />;
		case "component:coding-languages":
			return <Languages view={view} />;
		case "component:kit":
			return <Kit view={view} />;
		case "component:model-routing":
			return <ModelRouting view={view} />;
		case "component:delegation":
			return <Delegation view={view} />;
		case "metric:effort-levels":
			return <EffortLevels view={view} />;
		case "metric:thinking-share":
			return <ThinkingTokens view={view} />;
		case "metric:turn-duration":
			return <TurnLength view={view} />;
		default:
			return null;
	}
}

function EmptyBody({ children }: { children: React.ReactNode }) {
	return <p className="text-sm text-fg-secondary">{children}</p>;
}

// ---------------------------------------------------------------------------
// When work happens: the week/time heatmap with a floating hover popup.
// ---------------------------------------------------------------------------

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const WEEKDAY_ROWS = [1, 2, 3, 4, 5, 6, 0];

/**
 * ONE component with ONE band (#279). The commit grid is a second series on
 * the same heatmap, not a second row. The row's figure in the head is the
 * session share and never follows the toggle, because the page ranks nothing
 * and a reader's switch must not move a row.
 *
 * THE POPUP FLOATS (#284). It follows the hovered or focused cell with the
 * section's offset shadow, and there is no static sentence under the grid:
 * the head already carries the figure.
 */
function ActivityHeatmap({ view }: { view: WorkflowView }) {
	const [series, setSeries] = useState<HeatSeries>("sessions");
	const [popup, setPopup] = useState<{
		key: string;
		left: number;
		top: number;
	} | null>(null);
	const rootRef = useRef<HTMLDivElement>(null);
	const cells = heatCells(view, series);
	const hasCommits = view.section.git.weekdayHourCells.length > 0;
	const unit = series === "sessions" ? "recorded events" : "commits";
	const busiest = cells.size > 0 ? Math.max(...cells.values()) : 0;

	const show = (key: string, target: EventTarget & HTMLElement): void => {
		const root = rootRef.current?.getBoundingClientRect();
		const cell = target.getBoundingClientRect();
		if (!root) return;
		let left = cell.left - root.left + 10;
		if (left + 260 > root.width)
			left = Math.max(cell.left - root.left - 250, 0);
		setPopup({ key, left, top: cell.top - root.top - 34 });
	};

	const toggle = hasCommits ? (
		<div className="mb-2.5 inline-flex border border-stroke-subtle">
			{(["sessions", "commits"] as const).map((option) => (
				<button
					key={option}
					type="button"
					onClick={() => {
						setSeries(option);
						setPopup(null);
					}}
					aria-pressed={series === option}
					className={cn(
						"px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
						series === option
							? "border-b-2 border-accent-lime text-fg-primary"
							: "text-fg-muted",
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
				{toggle}
				<EmptyBody>
					{series === "sessions"
						? "No harness on this machine records an event clock."
						: "No commit in this window sits in a repository a session touched."}
				</EmptyBody>
			</div>
		);
	}

	const popupCell = popup ? (cells.get(popup.key) ?? 0) : 0;

	return (
		<div ref={rootRef} className="relative">
			{toggle}
			<div className="overflow-x-auto">
				<div className="min-w-[34rem]">
					{WEEKDAY_ROWS.map((weekday) => (
						<div key={weekday} className="flex items-center gap-0.5">
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
										tabIndex={-1}
										aria-label={`${weekdayLabel(weekday)} ${hourLabel(hour)}, ${count} ${unit}`}
										onMouseEnter={(event: MouseEvent<HTMLButtonElement>) =>
											show(key, event.currentTarget)
										}
										onFocus={(event: FocusEvent<HTMLButtonElement>) =>
											show(key, event.currentTarget)
										}
										onMouseLeave={() => setPopup(null)}
										onBlur={() => setPopup(null)}
										className="mb-0.5 h-4 flex-1 hover:outline hover:outline-1 hover:-outline-offset-1 hover:outline-fg-primary"
										style={{ background: heatPaint(count, busiest) }}
									/>
								);
							})}
						</div>
					))}
					<div className="flex items-center gap-0.5">
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
			{popup && (
				<output
					className="pointer-events-none absolute z-20 whitespace-nowrap border border-stroke-strong bg-bg-panel-elevated px-2.5 py-1.5 font-mono text-[11px] shadow-[4px_4px_0_var(--stroke-strong)]"
					style={{ left: popup.left, top: popup.top }}
				>
					{weekdayLabel(Number(popup.key.split("-")[0]))}{" "}
					{hourLabel(Number(popup.key.split("-")[1]))} ·{" "}
					<b className="text-accent-lime">{fmtCount(popupCell)}</b> {unit}
				</output>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Session start times: the 24-hour histogram, owner-local.
// ---------------------------------------------------------------------------

function StartHours({ view }: { view: WorkflowView }) {
	const cells = startProfile(view);
	if (sumBy(cells, (n) => n) === 0) {
		return (
			<EmptyBody>No harness on this machine records a session start.</EmptyBody>
		);
	}
	return (
		<Histogram
			values={cells}
			labels={HOURS.map((hour) => String(hour).padStart(2, "0"))}
			lit={peakOf(cells)}
			labelEvery={6}
			unit="sessions"
		/>
	);
}

// ---------------------------------------------------------------------------
// Session length: two metrics, two picture types (#284, decision 5).
// ---------------------------------------------------------------------------

/**
 * THE TRACKS ARE A MEASURED SPLIT, NOT AN INTENT. Nothing recorded what a
 * session was for, so `playbook-rules/v2` splits on the median measured
 * session and both track names say exactly that.
 *
 * THE UNKNOWN BUCKET NEVER HIDES in the track strips: it wears its own neutral
 * paint, because it ships as a real number on the page.
 */
function SessionLength({ view }: { view: WorkflowView }) {
	const playbook = playbookOf(view);
	if (!playbook) {
		return (
			<EmptyBody>
				Not enough sessions in this window for a median. The phase mix above
				still holds.
			</EmptyBody>
		);
	}
	const merged = playbook.receipts.find((receipt) =>
		receipt.id.includes("verify"),
	);
	return (
		<Cols>
			<div>
				<h4 className="mb-2.5 text-[13px] font-bold text-fg-primary">
					Where the time goes, by session length
				</h4>
				{playbook.tracks.map((track) => (
					<Track key={track.id} track={track} />
				))}
				<Legend
					entries={PHASE_ORDER.map((phase) => ({
						key: phase,
						paint: PHASE_PAINT[phase],
						label: phase,
					}))}
				/>
			</div>
			{merged && (
				<div>
					<h4 className="mb-2.5 text-[13px] font-bold text-fg-primary">
						{merged.head}
					</h4>
					{merged.sides.map((side) => (
						<div
							key={side.label}
							className="my-2 grid grid-cols-[120px_1fr_48px] items-center gap-2.5 text-[13px]"
						>
							<span className="truncate text-fg-primary">{side.label}</span>
							<span className="block h-[18px] bg-bg-panel">
								<span
									className="block h-full"
									style={{
										width: `${Math.max(1, side.value * 100)}%`,
										background: ACCENT,
									}}
								/>
							</span>
							<span className="text-right font-mono font-extrabold text-accent-lime">
								{fmtPercent(side.value)}
							</span>
						</div>
					))}
					<Sub>
						{merged.sides.map((side) => fmtCount(side.sessions)).join(" and ")}{" "}
						sessions
					</Sub>
				</div>
			)}
		</Cols>
	);
}

function Track({ track }: { track: PlaybookTrack }) {
	const segments: Segment[] = PHASE_ORDER.filter(
		(phase) => track.phaseShare[phase] > 0,
	).map((phase) => ({
		key: phase,
		value: track.phaseShare[phase],
		paint: PHASE_PAINT[phase],
		label: phase,
	}));
	return (
		<div className="mt-2.5">
			<p className="mb-1 flex items-baseline justify-between gap-4 text-[13px]">
				<span className="text-fg-primary">
					{track.label}{" "}
					<span className="font-mono text-[11px] text-fg-muted">
						{track.sessions}
					</span>
				</span>
				<span className="font-mono text-[11px] font-extrabold text-accent-lime">
					{fmtMinutes(track.medianMinutes)}
				</span>
			</p>
			<Strip segments={segments} wide label={`${track.label} by phase`} />
		</div>
	);
}

// ---------------------------------------------------------------------------
// Lines changed: the two figures, the strip, and one dot per commit on a
// positional log axis with the labeled median (#284).
// ---------------------------------------------------------------------------

/** Dots the axis draws before it stops. A 30-day window rarely reaches it. */
const MAX_DOTS = 400;

function GitLedger({ view }: { view: WorkflowView }) {
	const git = view.section.git;
	if (git.commits === 0) {
		return (
			<EmptyBody>
				No commit in this window sits in a repository a session touched.
			</EmptyBody>
		);
	}
	const sizes = [...git.changedLinesPerCommit]
		.sort((a, b) => a - b)
		.slice(0, MAX_DOTS);
	return (
		<div>
			<div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
				<span className="font-mono text-2xl font-black text-accent-lime">
					+{fmtLines(git.additions)}
				</span>
				<span
					className="font-mono text-2xl font-black"
					style={{ color: "var(--destructive)" }}
				>
					-{fmtLines(git.removals)}
				</span>
				<span className="font-mono text-[11px] text-fg-muted">
					{fmtCount(git.commits)} commits · {fmtCount(git.testFileCommits)}{" "}
					touch a test file
				</span>
			</div>
			<div className="mt-3.5">
				<ColLabel>additions up, removals down, per day</ColLabel>
				<DayBars
					days={view.section.gitDays}
					from={view.window.from}
					to={view.window.to}
				/>
			</div>
			{sizes.length > 0 && (
				<div className="mt-3.5">
					<ColLabel>lines changed per commit</ColLabel>
					<CommitAxis sizes={sizes} />
				</div>
			)}
		</div>
	);
}

/** The slots the picture draws before it stops. A 30-day window fills 30. */
const MAX_DAY_SLOTS = 62;

/** The next UTC date after `date`, `YYYY-MM-DD`. */
function nextDate(date: string): string {
	const next = new Date(`${date}T00:00:00Z`);
	next.setUTCDate(next.getUTCDate() + 1);
	return next.toISOString().slice(0, 10);
}

/**
 * Additions up and removals down as mirrored bars, one pair per calendar day
 * of the window (#288).
 *
 * A CALENDAR AXIS, not an active-day axis: the wire ships only the days a
 * sync stored, and drawing those side by side would collapse a two-week gap
 * into one pixel. So the picture walks every date from the window's first to
 * its last, and a day with no stored reading or no commit keeps its slot as a
 * hairline tick on the baseline. The gap is part of the reading.
 *
 * ONE SCALE FOR BOTH HALVES: the tallest single side sets it, so a day that
 * adds 4,000 and removes 40 reads that way.
 */
function DayBars({
	days,
	from,
	to,
}: {
	days: readonly {
		date: string;
		additions: number;
		removals: number;
		commits: number;
	}[];
	from: string;
	to: string;
}) {
	const byDate = new Map(days.map((day) => [day.date, day]));
	const slots: string[] = [];
	for (
		let date = from;
		date <= to && slots.length < MAX_DAY_SLOTS;
		date = nextDate(date)
	) {
		slots.push(date);
	}
	const tallest =
		Math.max(...days.map((day) => Math.max(day.additions, day.removals)), 0) ||
		1;
	const height = (value: number) => `${Math.round((value / tallest) * 100)}%`;
	return (
		<div
			role="img"
			aria-label={`additions and removals per day, ${from} to ${to}`}
			className="mt-1.5 flex h-16 items-stretch gap-px"
		>
			{slots.map((date) => {
				const day = byDate.get(date);
				const empty = !day || day.commits === 0;
				const title = day
					? `${date}: +${fmtCount(day.additions)} added, -${fmtCount(day.removals)} removed, ${fmtCount(day.commits)} ${day.commits === 1 ? "commit" : "commits"}`
					: `${date}: no measured day`;
				return (
					<span
						key={date}
						data-day={date}
						data-empty={empty ? "true" : undefined}
						title={title}
						className="flex min-w-0.5 flex-1 flex-col"
					>
						<span className="flex flex-1 items-end">
							{!empty && (
								<i
									className="block w-full min-h-px"
									style={{ height: height(day.additions), background: ACCENT }}
								/>
							)}
						</span>
						<i
							className="block h-px w-full shrink-0"
							style={{
								background: empty ? "var(--stroke-strong)" : "var(--fg-muted)",
							}}
						/>
						<span className="flex flex-1 items-start">
							{!empty && (
								<i
									className="block w-full min-h-px"
									style={{
										height: height(day.removals),
										background: "var(--destructive-fill)",
									}}
								/>
							)}
						</span>
					</span>
				);
			})}
		</div>
	);
}

/**
 * One dot per commit on a positional log axis, with the median labeled.
 *
 * A LOG AXIS, because a 4,000-line commit beside a 4-line one on a linear
 * axis makes every ordinary commit an invisible speck. The dots stack in seven
 * lanes by index so equal sizes do not hide one another; the lane carries no
 * meaning, and the wire ships the sizes unordered on purpose, so nothing here
 * reads as a timeline.
 */
function CommitAxis({ sizes }: { sizes: readonly number[] }) {
	const largest = Math.max(...sizes, 1);
	const top = Math.log10(largest + 1);
	const x = (value: number): number =>
		top > 0 ? (Math.log10(value + 1) / top) * 100 : 0;
	const median = sizes[Math.floor(sizes.length / 2)] ?? 0;
	const gridlines = [1, 10, 100, 1000, 10000, 100000].filter(
		(line) => line <= largest,
	);
	return (
		<div
			role="img"
			aria-label={`one dot per commit on a log axis, median ${fmtCount(median)} changed lines`}
			className="relative mt-1 h-24 w-full"
		>
			{gridlines.map((line) => (
				<span
					key={line}
					className="absolute top-2 bottom-7 w-px bg-stroke-subtle"
					style={{ left: `${x(line)}%` }}
				>
					<span className="absolute top-full left-1/2 mt-1 -translate-x-1/2 font-mono text-[10px] text-fg-muted">
						{fmtCount(line)}
					</span>
				</span>
			))}
			{sizes.map((lines, index) => (
				<span
					// The sizes are unordered and repeat, so the index is the identity.
					key={`${index}-${lines}`}
					title={`${fmtCount(lines)} changed lines`}
					className="absolute size-1 bg-accent-lime opacity-65"
					style={{
						left: `calc(${x(lines)}% - 2px)`,
						top: 14 + (index % 7) * 7,
					}}
				/>
			))}
			<span
				className="absolute top-1 bottom-6 w-[1.5px] bg-fg-primary"
				style={{ left: `${x(median)}%` }}
			>
				<span className="absolute top-0 left-1.5 whitespace-nowrap font-mono text-[10px] font-bold text-fg-primary">
					median {fmtCount(median)}
				</span>
			</span>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Languages: changed lines by language, merged by name.
// ---------------------------------------------------------------------------

function Languages({ view }: { view: WorkflowView }) {
	const { rows, total } = languages(view);
	if (rows.length === 0) {
		return (
			<EmptyBody>No approved file type carries a changed line here.</EmptyBody>
		);
	}
	const widest = rows[0]?.value ?? 1;
	return (
		<div>
			{rows.slice(0, 8).map((row, index) => (
				<BarRow
					key={row.name}
					rank={index + 1}
					name={row.name}
					share={widest > 0 ? row.value / widest : 0}
					figure={fmtPercent(total > 0 ? row.value / total : 0)}
				/>
			))}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Skills and MCP.
// ---------------------------------------------------------------------------

function Kit({ view }: { view: WorkflowView }) {
	const skillRows = skills(view);
	const serverRows = mcpServers(view);
	if (skillRows.length === 0 && serverRows.length === 0) {
		return (
			<EmptyBody>No skill or MCP call is published for this machine.</EmptyBody>
		);
	}
	return (
		<Cols>
			<KitList title="skills" rows={skillRows} />
			<KitList title="mcp servers" rows={serverRows} />
		</Cols>
	);
}

function KitList({
	title,
	rows,
}: {
	title: string;
	rows: readonly { name: string; value: number }[];
}) {
	const widest = rows[0]?.value ?? 1;
	const shown = rows.slice(0, 6);
	const rest = rows.slice(6);
	return (
		<div>
			<ColLabel>{title}</ColLabel>
			{shown.length === 0 && <Sub>none published</Sub>}
			{shown.map((row, index) => (
				<BarRow
					key={row.name}
					rank={index + 1}
					name={row.name}
					share={widest > 0 ? row.value / widest : 0}
					figure={fmtPercent(row.value)}
				/>
			))}
			{rest.length > 0 && (
				<Sub>also: {rest.map((row) => row.name).join(", ")}</Sub>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Models used: the main loop against the subagents.
// ---------------------------------------------------------------------------

function ModelRouting({ view }: { view: WorkflowView }) {
	const route = routing(view);
	if (route.main.length === 0 && route.subagents.length === 0) {
		return (
			<EmptyBody>
				No harness on this machine records a model per response.
			</EmptyBody>
		);
	}
	const total = route.mainTokens + route.subagentTokens;
	const segments = (rows: { name: string; value: number }[]): Segment[] =>
		rows.map((row) => ({
			key: row.name,
			value: row.value,
			paint: route.paintOf(row.name),
			label: shortModel(row.name),
		}));
	return (
		<div>
			<RouteRow
				who="main loop"
				share={total > 0 ? route.mainTokens / total : 0}
				segments={segments(route.main)}
			/>
			<RouteRow
				who="subagents"
				share={total > 0 ? route.subagentTokens / total : 0}
				segments={segments(route.subagents)}
			/>
			<Legend
				entries={route.models.map((model) => ({
					key: model,
					paint: route.paintOf(model),
					label: shortModel(model),
				}))}
			/>
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
		<div className="mt-2.5">
			<p className="mb-1 flex items-baseline justify-between gap-4 text-[13px]">
				<span className="text-fg-primary">{who}</span>
				<span className="font-mono text-[11px] text-fg-muted">
					{fmtPercent(share)} of tokens
				</span>
			</p>
			<Strip segments={segments} wide label={`${who} tokens by model`} />
		</div>
	);
}

// ---------------------------------------------------------------------------
// Subagents: the split, the two records, and the runs by type.
// ---------------------------------------------------------------------------

function Delegation({ view }: { view: WorkflowView }) {
	const held = delegation(view);
	if (!held) {
		return (
			<EmptyBody>
				No harness on this machine records a subagent call separately.
			</EmptyBody>
		);
	}
	const types = subagentTypes(view);
	const widest = types[0]?.value ?? 1;
	const segments = delegationSegments(held.subagentShare);
	return (
		<Cols>
			<div>
				<Strip segments={segments} wide label="main loop against subagents" />
				<Legend
					entries={[
						{
							key: "main",
							paint: segments[0]?.paint ?? ACCENT,
							label: `main loop ${fmtPercent(1 - held.subagentShare)}`,
						},
						{
							key: "subagents",
							paint: segments[1]?.paint ?? ACCENT,
							label: `subagents ${fmtPercent(held.subagentShare)}`,
						},
					]}
				/>
				<div className="mt-3 grid grid-cols-2 gap-px border border-stroke-subtle bg-stroke-subtle">
					<Record
						value={held.widestFanOut}
						label="widest parallel fan-out in one session"
					/>
					<Record
						value={held.mostSubagents}
						label="most subagents in one session"
					/>
				</div>
			</div>
			{types.length > 0 && (
				<div>
					<ColLabel>by type</ColLabel>
					{types.slice(0, 6).map((row, index) => (
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
		</Cols>
	);
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
// Effort levels, thinking tokens, turn length: the rows #285's wire unlocked.
// ---------------------------------------------------------------------------

function EffortLevels({ view }: { view: WorkflowView }) {
	const shares = effortShares(view);
	const segments = effortSegments(shares);
	if (sumBy(segments, (segment) => segment.value) <= 0) {
		return (
			<EmptyBody>No harness on this machine records an effort level.</EmptyBody>
		);
	}
	return (
		<div>
			<Strip segments={segments} wide label="turns by effort level" />
			<Legend
				entries={segments.map((segment) => ({
					key: segment.key,
					paint: segment.paint,
					label: `${segment.label} ${fmtPercent(segment.value)}`,
				}))}
			/>
			{shares.other > 0 && (
				<Sub>
					{fmtPercent(shares.other)} of turns at a level outside the three
				</Sub>
			)}
		</div>
	);
}

function ThinkingTokens({ view }: { view: WorkflowView }) {
	const rows = thinkingByHarness(view);
	const widest = Math.max(...rows.map((row) => row.share ?? 0), 0.5);
	return (
		<div>
			{rows.map((row) => (
				<BarRow
					key={row.harness}
					name={harnessLabelOf(row.harness)}
					share={row.share === null ? 0 : row.share / widest}
					figure={
						row.share === null ? (
							<span className="text-fg-muted">not recorded</span>
						) : (
							fmtPercent(row.share)
						)
					}
				/>
			))}
		</div>
	);
}

function TurnLength({ view }: { view: WorkflowView }) {
	const histogram = turnHistogram(view);
	if (histogram.buckets.length === 0) {
		return (
			<EmptyBody>No harness on this machine records a turn duration.</EmptyBody>
		);
	}
	return (
		<Histogram
			values={histogram.buckets.map((bucket) => bucket.turns)}
			labels={histogram.buckets.map((bucket) => bucket.label)}
			lit={histogram.median}
			median={histogram.median}
			unit="turns"
		/>
	);
}
