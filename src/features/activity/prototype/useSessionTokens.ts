/**
 * PROTOTYPE - throwaway. "Tokens since you opened this page."
 *
 * The band has no per-second feed, only a 24-hour total that moves when a
 * sync lands. So the counter runs at the last 24 hours' PACE (tokens per
 * second = usage.tokens / 86400) from the moment the page mounts, and jumps
 * by the real delta whenever a sync moves the 24-hour total under the open
 * tab. The label has to say it is a pace, not a meter.
 */

import { useEffect, useRef, useState } from "react";
import type { Band } from "../feed";

const DAY_S = 24 * 60 * 60;
const TICK_MS = 80;

export function useSessionTokens(band: Band) {
	const rate = band.usage.tokens / DAY_S;
	const startedAt = useRef<number | null>(null);
	const lastTotal = useRef(band.usage.tokens);
	const [landed, setLanded] = useState(0);
	const [elapsed, setElapsed] = useState(0);

	// A sync under the open tab: fold the real movement in.
	if (band.usage.tokens !== lastTotal.current) {
		const delta = band.usage.tokens - lastTotal.current;
		lastTotal.current = band.usage.tokens;
		if (delta > 0) setLanded((n) => n + delta);
	}

	useEffect(() => {
		startedAt.current = performance.now();
		const id = window.setInterval(() => {
			setElapsed((performance.now() - (startedAt.current ?? 0)) / 1000);
		}, TICK_MS);
		return () => window.clearInterval(id);
	}, []);

	return {
		tokens: Math.floor(elapsed * rate) + landed,
		perSecond: rate,
		seconds: elapsed,
	};
}

export function fmtSeconds(s: number): string {
	const m = Math.floor(s / 60);
	const r = Math.floor(s % 60);
	if (m === 0) return `${r}s`;
	return `${m}m ${String(r).padStart(2, "0")}s`;
}
