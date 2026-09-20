/** SVG marks for Stats. Every mark is present during server rendering. */
import { ACCENT_PAINT } from "./palette";

export type StatsSegment = {
	key: string;
	label: string;
	share: number;
	paint: string;
	previous?: number | null;
};
export function SegmentChart({
	segments,
	label,
	height = 16,
}: {
	segments: readonly StatsSegment[];
	label: string;
	height?: number;
}) {
	let at = 0;
	return (
		<svg
			role="img"
			aria-label={label}
			viewBox={`0 0 1000 ${height}`}
			preserveAspectRatio="none"
			className="block w-full"
			style={{ height }}
		>
			<rect width="1000" height={height} fill="var(--bg-panel)" />
			{segments.map((s) => {
				const x = at;
				at += s.share * 1000;
				return (
					<rect
						key={s.key}
						x={x}
						width={Math.max(0, s.share * 1000)}
						height={height}
						fill={s.paint}
					>
						<title>
							{s.label}: {(s.share * 100).toFixed(1)}%
						</title>
					</rect>
				);
			})}
		</svg>
	);
}
export function ShareChart({
	share,
	previous,
	paint = ACCENT_PAINT,
	label,
	height = 6,
}: {
	share: number;
	previous?: number | null;
	paint?: string;
	label: string;
	height?: number;
}) {
	return (
		<svg
			role="img"
			aria-label={label}
			viewBox={`0 0 1000 ${height + 8}`}
			preserveAspectRatio="none"
			className="block w-full"
			style={{ height: height + 8 }}
		>
			<rect y="4" width="1000" height={height} fill="var(--bg-panel)" />
			<rect
				y="4"
				width={Math.max(0, Math.min(1, share)) * 1000}
				height={height}
				fill={paint}
			/>
			{previous != null && (
				<rect
					x={Math.min(998, Math.max(0, previous * 1000))}
					width="2"
					height={height + 8}
					fill="var(--fg-primary)"
				>
					<title>Previous: {(previous * 100).toFixed(1)}%</title>
				</rect>
			)}
		</svg>
	);
}
export function HarnessPieChart({
	segments,
}: {
	segments: readonly StatsSegment[];
}) {
	let at = 0;
	let before = 0;
	return (
		<svg
			role="img"
			aria-label="Harness token shares"
			viewBox="0 0 100 100"
			className="size-36 shrink-0 -rotate-90 xl:size-44"
		>
			{segments.map((s) => {
				const start = at;
				at += s.share;
				return (
					<circle
						key={s.key}
						cx="50"
						cy="50"
						r="20"
						fill="none"
						stroke={s.paint}
						strokeWidth="40"
						strokeDasharray={`${Math.max(0, s.share * 40 * Math.PI - 0.4)} ${40 * Math.PI}`}
						strokeDashoffset={-start * 40 * Math.PI}
					>
						<title>
							{s.label}: {(s.share * 100).toFixed(1)}%
						</title>
					</circle>
				);
			})}
			{segments.map((s) => {
				const start = before;
				before += s.previous ?? 0;
				return s.previous == null ? null : (
					<circle
						key={s.key}
						cx="50"
						cy="50"
						r="46"
						fill="none"
						stroke={s.paint}
						strokeWidth="3"
						opacity="0.55"
						strokeDasharray={`${Math.max(0, s.previous * 92 * Math.PI - 0.4)} ${92 * Math.PI}`}
						strokeDashoffset={-start * 92 * Math.PI}
					>
						<title>
							{s.label}, previous: {(s.previous * 100).toFixed(1)}%
						</title>
					</circle>
				);
			})}
		</svg>
	);
}
export function WaffleChart({
	cells,
	colors,
	columns,
	label,
}: {
	cells: readonly string[];
	colors: Record<string, string>;
	columns: number;
	label: string;
}) {
	return (
		<svg
			role="img"
			aria-label={label}
			viewBox={`0 0 ${columns * 10} ${Math.ceil(cells.length / columns) * 10}`}
			className="block w-full"
		>
			{cells.map((cell, i) => (
				<rect
					key={`${i}-${cell}`}
					x={(i % columns) * 10 + 1}
					y={Math.floor(i / columns) * 10 + 1}
					width="7"
					height="7"
					fill={colors[cell]}
					stroke={cell === "longChat" ? "var(--stroke-strong)" : "none"}
				/>
			))}
		</svg>
	);
}
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 24 }, (_, i) => i);
const ink = "var(--fg-muted)";
export function ActivityChart({
	cells,
	starts,
	portrait = false,
}: {
	cells: number[][];
	starts: number[];
	portrait?: boolean;
}) {
	const max = Math.max(1, ...cells.flat());
	const maxStarts = Math.max(1, ...starts);
	const w = portrait ? 300 : 800;
	const h = portrait ? 410 : 225;
	const x = (d: number, hour: number) =>
		portrait ? 26 + d * 32 : 32 + hour * 32;
	const y = (d: number, hour: number) =>
		portrait ? 20 + hour * 16 : 38 + d * 24;
	return (
		<svg
			role="img"
			aria-label="Activity events by weekday and hour; marginal bars count session starts"
			viewBox={`0 0 ${w} ${h}`}
			className="block w-full"
		>
			{DAYS.map((day, d) => (
				<text
					key={day}
					x={portrait ? 27 + d * 32 : 0}
					y={portrait ? 12 : 54 + d * 24}
					fill={ink}
					fontSize="10"
					fontFamily="monospace"
				>
					{portrait ? day.slice(0, 2) : day}
				</text>
			))}
			{hours.map((hour) => (
				<g key={hour}>
					<text
						x={portrait ? 0 : 32 + hour * 32}
						y={portrait ? 30 + hour * 16 : 222}
						fill={ink}
						fontSize="9"
						fontFamily="monospace"
					>
						{hour % 3 === 0 ? String(hour).padStart(2, "0") : ""}
					</text>
					<rect
						x={portrait ? 258 : 32 + hour * 32}
						y={portrait ? 23 + hour * 16 : 29 - (starts[hour] / maxStarts) * 18}
						width={portrait ? (starts[hour] / maxStarts) * 40 : 28}
						height={portrait ? 5 : (starts[hour] / maxStarts) * 18}
						fill={ink}
						opacity="0.45"
					>
						<title>
							{String(hour).padStart(2, "0")}:00: {starts[hour]} session starts
						</title>
					</rect>
				</g>
			))}
			{cells.flatMap((day, d) =>
				day.map((count, hour) => (
					<rect
						// biome-ignore lint/suspicious/noArrayIndexKey: weekday and hour are fixed coordinates
						key={`${d}-${hour}`}
						x={x(d, hour)}
						y={y(d, hour)}
						width={portrait ? 29 : 28}
						height={portrait ? 13 : 20}
						fill={count ? ACCENT_PAINT : "var(--bg-panel)"}
						fillOpacity={count ? 0.15 + 0.85 * Math.sqrt(count / max) : 1}
					>
						<title>
							{DAYS[d]} {String(hour).padStart(2, "0")}:00:{" "}
							{count.toLocaleString("en-US")} activity events
						</title>
					</rect>
				)),
			)}
		</svg>
	);
}
export function ActivityMarginals({ cells }: { cells: number[][] }) {
	const days = cells.map((d) => d.reduce((a, b) => a + b, 0));
	const hourly = hours.map((h) => cells.reduce((n, d) => n + d[h], 0));
	const maxDay = Math.max(1, ...days);
	const maxHour = Math.max(1, ...hourly);
	return (
		<svg
			role="img"
			aria-label="Activity events by weekday and hour"
			viewBox="0 0 300 100"
			className="block w-full"
		>
			{days.map((count, i) => (
				<g key={DAYS[i]}>
					<rect
						x={i * 43}
						y={48 - (count / maxDay) * 48}
						width="38"
						height={(count / maxDay) * 48}
						fill={ACCENT_PAINT}
					>
						<title>
							{DAYS[i]}: {count.toLocaleString("en-US")} events
						</title>
					</rect>
					<text
						x={i * 43 + 10}
						y="61"
						fill={ink}
						fontSize="10"
						fontFamily="monospace"
					>
						{DAYS[i].slice(0, 2)}
					</text>
				</g>
			))}
			{hourly.map((count, h) => (
				<rect
					// biome-ignore lint/suspicious/noArrayIndexKey: the hour is a fixed coordinate
					key={h}
					x={h * 12.5}
					y="72"
					width="10.5"
					height="12"
					fill={count ? ACCENT_PAINT : "var(--bg-panel)"}
					fillOpacity={count ? 0.15 + 0.85 * Math.sqrt(count / maxHour) : 1}
				>
					<title>
						{h}:00: {count.toLocaleString("en-US")} events
					</title>
				</rect>
			))}
			{[0, 6, 12, 18, 23].map((h) => (
				<text
					key={h}
					x={h * 12.5}
					y="97"
					fill={ink}
					fontSize="9"
					fontFamily="monospace"
				>
					{String(h).padStart(2, "0")}
				</text>
			))}
		</svg>
	);
}
export function LinesChart({
	days,
}: {
	days: readonly {
		date: string;
		additions: number | null;
		removals: number | null;
	}[];
}) {
	const up = Math.max(0, ...days.map((d) => d.additions ?? 0));
	const down = Math.max(0, ...days.map((d) => d.removals ?? 0));
	const scale = 96 / Math.max(1, up + down);
	const baseline = 2 + up * scale;
	const step = 900 / Math.max(1, days.length);
	return (
		<svg
			role="img"
			aria-label="Daily lines added and removed"
			viewBox="0 0 900 100"
			preserveAspectRatio="none"
			className="block h-16 w-full md:h-36"
		>
			<path d={`M0 ${baseline} H900`} stroke="var(--stroke-strong)" />
			{days.map((day, i) =>
				day.additions === null || day.removals === null ? null : (
					<g key={day.date}>
						<title>
							{day.date}: +{day.additions.toLocaleString("en-US")} / -
							{day.removals.toLocaleString("en-US")} lines
						</title>
						<rect
							x={i * step}
							y={baseline - day.additions * scale}
							width={Math.max(1, step - 3)}
							height={day.additions * scale}
							fill="var(--chart-1)"
						/>
						<rect
							x={i * step}
							y={baseline}
							width={Math.max(1, step - 3)}
							height={day.removals * scale}
							fill="var(--chart-3)"
						/>
					</g>
				),
			)}
		</svg>
	);
}
