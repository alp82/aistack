/**
 * Formatters for chart labels.
 *
 * Every formatter is fixed to `en-US` and to UTC. Server and browser must
 * produce the same string or hydration reports a mismatch, and the ambient
 * locale of a visitor is not something the server can know.
 */

const compact = new Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 1,
});

const plain = new Intl.NumberFormat("en-US");

const day = new Intl.DateTimeFormat("en-US", {
	timeZone: "UTC",
	month: "short",
	day: "numeric",
});

const dayFull = new Intl.DateTimeFormat("en-US", {
	timeZone: "UTC",
	year: "numeric",
	month: "short",
	day: "numeric",
});

/** Axis and label numbers: 4.7B, 231K, 88. */
function formatCompact(n: number): string {
	return compact.format(n);
}

/** Exact numbers, for the table view. */
function formatExact(n: number): string {
	return plain.format(n);
}

/** Tick labels on a time axis: "Aug 3". */
function formatDay(d: Date): string {
	return day.format(d);
}

/** Table and tooltip dates: "Aug 3, 2026". */
function formatDayFull(d: Date): string {
	return dayFull.format(d);
}

export { formatCompact, formatDay, formatDayFull, formatExact };
