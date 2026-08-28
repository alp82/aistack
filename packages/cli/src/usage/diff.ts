// Diff-only sync (#307, ADR-0010): which local days go on the wire.
//
// The server says what it holds in a day manifest, and the CLI sends only the
// dates it lacks or holds differently. Pure: the manifest fetch lives in
// ../api.ts and the decision to fall back lives in ../sync/stage.ts.

import {
	dayFingerprint,
	MEASURED_DAYS_V1,
	type MeasuredDay,
} from "@aistack/workflow-rules";

/** The server's answer to `GET /api/cli/sync-manifest`. */
export type DayManifest = {
	retentionDays: number;
	aggregateVersion: string;
	days: { date: string; fingerprint: string }[];
};

/** The most days the CLI ever sends: the page's read cap, and the scan's reach. */
export const MAX_DAY_WINDOW = 400;

export type DaySkipReason = "unchanged" | "expired";

export type DaySelection = {
	/** Missing from the manifest, changed since, or today. */
	send: MeasuredDay[];
	/** Dates the server already holds with the same fingerprint. */
	unchanged: number;
	skipped: { date: string; reason: DaySkipReason }[];
	/** How the selection was made, for the gate's one line about it. */
	mode: "diff" | "full";
};

const DAY_MS = 86_400_000;

/** The oldest date still inside a retention of `days` ending on `today`. */
export function retentionFloor(todayUtc: string, days: number): string {
	const span = Math.max(1, Math.min(days, MAX_DAY_WINDOW));
	const todayMs = Date.parse(`${todayUtc}T00:00:00.000Z`);
	return new Date(todayMs - (span - 1) * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Pick the days to publish.
 *
 * - No manifest (old server, network failure): every local day inside the
 *   default retention goes, and `mode` says `full`.
 * - A manifest on another aggregate version: its fingerprints mean nothing to
 *   this CLI, so every day goes, inside the retention it names.
 * - Otherwise a day goes when its date is missing from the manifest, when its
 *   fingerprint differs, or when it is today (still running, always resends).
 * - A date older than the retention is dropped: the server would expire it
 *   on arrival.
 */
export function selectDaysToPublish(input: {
	local: readonly MeasuredDay[];
	manifest: DayManifest | null;
	todayUtc: string;
}): DaySelection {
	const { local, manifest, todayUtc } = input;
	const retention = manifest?.retentionDays ?? MAX_DAY_WINDOW;
	const floor = retentionFloor(todayUtc, retention);
	const comparable =
		manifest !== null && manifest.aggregateVersion === MEASURED_DAYS_V1;
	const held = new Map<string, string>();
	if (comparable) {
		for (const day of manifest.days) held.set(day.date, day.fingerprint);
	}

	const send: MeasuredDay[] = [];
	const skipped: DaySelection["skipped"] = [];
	for (const day of [...local].sort((a, b) => a.date.localeCompare(b.date))) {
		if (day.date < floor) {
			skipped.push({ date: day.date, reason: "expired" });
			continue;
		}
		if (comparable && day.date !== todayUtc) {
			const fingerprint = held.get(day.date);
			if (fingerprint !== undefined && fingerprint === dayFingerprint(day)) {
				skipped.push({ date: day.date, reason: "unchanged" });
				continue;
			}
		}
		send.push(day);
	}
	return {
		send,
		unchanged: skipped.filter((s) => s.reason === "unchanged").length,
		skipped,
		mode: comparable ? "diff" : "full",
	};
}
