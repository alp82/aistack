import { useSyncExternalStore } from "react";
import { relativeLabel } from "./feed";

/**
 * "4 minutes ago", kept true without a re-render storm.
 *
 * ONE interval for the whole page, not one per row: every `RelativeTime`
 * subscribes to the same clock store, and the store is torn down when the last
 * one unmounts.
 *
 * The snapshot is the FORMATTED STRING, not the clock. React bails out of a
 * re-render when a snapshot is unchanged, so a tick re-renders only the rows
 * whose words actually moved - a page of 25 rows mostly hours old re-renders
 * nothing at all, while "just now" still becomes "1m ago" on time.
 */

const TICK_MS = 20_000;

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

export function useRelativeLabel(at: number): string {
	return useSyncExternalStore(
		subscribe,
		() => relativeLabel(at, now),
		// The server has its own clock and no ticker. The first client render may
		// land a minute away from it, which is why the element below suppresses
		// the hydration warning rather than rendering nothing until mount.
		() => relativeLabel(at, Date.now()),
	);
}

export function RelativeTime({
	at,
	className,
}: {
	readonly at: number;
	readonly className?: string;
}) {
	const label = useRelativeLabel(at);
	return (
		<time
			dateTime={new Date(at).toISOString()}
			className={className}
			suppressHydrationWarning
		>
			{label}
		</time>
	);
}
