import { useSyncExternalStore } from "react";

/**
 * Responsive relative time that stays current without a timer for each row.
 *
 * Both labels render on the server. CSS shows the concise label below the
 * desktop breakpoint and the full label at the breakpoint and above.
 */

const TICK_MS = 20_000;

type LabelStyle = "mobile" | "desktop";

function unitLabel(
	value: number,
	shortUnit: string,
	longUnit: string,
	style: LabelStyle,
): string {
	if (style === "mobile") return `${value}${shortUnit} ago`;
	return `${value} ${longUnit}${value === 1 ? "" : "s"} ago`;
}

function relativeLabel(
	at: number,
	currentTime: number,
	style: LabelStyle,
): string {
	const sec = Math.floor(Math.max(0, currentTime - at) / 1000);
	if (sec < 60) return "just now";
	const min = Math.floor(sec / 60);
	if (min < 60) return unitLabel(min, " min", "minute", style);
	const hr = Math.floor(min / 60);
	if (hr < 24) return unitLabel(hr, "h", "hour", style);
	const day = Math.floor(hr / 24);
	if (day < 7) return unitLabel(day, "d", "day", style);
	const week = Math.floor(day / 7);
	if (week < 5) return unitLabel(week, "w", "week", style);
	const month = Math.floor(day / 30);
	if (day < 365) return unitLabel(month, "mo", "month", style);
	return unitLabel(Math.floor(day / 365), "y", "year", style);
}

let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(onChange: () => void): () => void {
	listeners.add(onChange);
	if (timer === null) {
		now = Date.now();
		timer = setInterval(() => {
			now = Date.now();
			for (const listener of listeners) listener();
		}, TICK_MS);
	}
	return () => {
		listeners.delete(onChange);
		if (listeners.size === 0 && timer !== null) {
			clearInterval(timer);
			timer = null;
		}
	};
}

export function useRelativeLabel(
	at: number,
	style: LabelStyle = "mobile",
): string {
	return useSyncExternalStore(
		subscribe,
		() => relativeLabel(at, now, style),
		() => relativeLabel(at, Date.now(), style),
	);
}

export function RelativeTime({
	at,
	className,
}: {
	readonly at: number;
	readonly className?: string;
}) {
	const mobileLabel = useRelativeLabel(at, "mobile");
	const desktopLabel = useRelativeLabel(at, "desktop");
	return (
		<time
			dateTime={new Date(at).toISOString()}
			className={className}
			suppressHydrationWarning
		>
			<span className="md:hidden" suppressHydrationWarning>
				{mobileLabel}
			</span>
			<span className="hidden md:inline" suppressHydrationWarning>
				{desktopLabel}
			</span>
		</time>
	);
}
