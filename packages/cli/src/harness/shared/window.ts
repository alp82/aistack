// The rolling window and the scan-health shape every adapter reports.
// Shared so the payload builder and each harness scanner agree by import
// rather than by convention (#67).

/** Rolling window locked by the owner in the #32 prototype resolution. */
export const DEFAULT_WINDOW_DAYS = 30;

/**
 * UTC midnight opening a rolling window of `days` calendar days ending on the
 * day containing `now` (inclusive). `days = 30` therefore spans today plus the
 * 29 preceding days.
 *
 * Defined once and shared by the scan filter and the payload's `window.from`, so
 * the reported window and the records actually counted cannot drift apart.
 */
export function windowStartMs(now: number, days: number): number {
	const startOfToday = Date.UTC(
		new Date(now).getUTCFullYear(),
		new Date(now).getUTCMonth(),
		new Date(now).getUTCDate(),
	);
	return startOfToday - (days - 1) * 86_400_000;
}

export type ScanStats = {
	/** Files found on disk before any window filter. */
	filesFound: number;
	/** Files actually opened and read. */
	filesRead: number;
	/** Files skipped because their mtime predates the window. */
	filesSkippedByMtime: number;
	/** Files skipped because a resolved path was already scanned (overlapping roots). */
	filesSkippedAsDuplicate: number;
	/**
	 * Files that could not be read (permissions, or pruned mid-scan). Counted
	 * rather than thrown: an unhandled read error would surface the absolute path
	 * AND the munged project directory in the crash output, which is exactly what
	 * this tool promises never to emit.
	 */
	filesUnreadable: number;
};

export function emptyScanStats(): ScanStats {
	return {
		filesFound: 0,
		filesRead: 0,
		filesSkippedByMtime: 0,
		filesSkippedAsDuplicate: 0,
		filesUnreadable: 0,
	};
}
