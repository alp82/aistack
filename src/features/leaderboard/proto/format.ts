/**
 * PROTOTYPE — throwaway. Wayfinder ticket #92 (map #76).
 *
 * Fixed to `en-US` and UTC, the same rule the real chart module follows: the
 * server cannot know a visitor's locale, and a mismatch is a hydration error.
 */

const money = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 0,
});

const moneyCompact = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	notation: "compact",
	maximumFractionDigits: 1,
});

const plain = new Intl.NumberFormat("en-US");

const dayShort = new Intl.DateTimeFormat("en-US", {
	timeZone: "UTC",
	month: "short",
	day: "numeric",
});

/** 291.4B, 5.9B, 231K. */
export function tokens(n: number): string {
	if (n >= 1e9) return `${(n / 1e9).toFixed(n >= 100e9 ? 1 : 2)}B`;
	if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
	return plain.format(Math.round(n));
}

export function usd(n: number): string {
	return money.format(n);
}

export function usdCompact(n: number): string {
	return moneyCompact.format(n);
}

export function count(n: number): string {
	return plain.format(n);
}

export function pct(share: number, digits = 0): string {
	return `${(share * 100).toFixed(digits)}%`;
}

export function shortDay(ms: number): string {
	return dayShort.format(new Date(ms));
}

/** "2 days ago", "today". Rounded down, so it never overstates freshness. */
export function ago(ms: number, nowMs: number): string {
	const days = Math.floor((nowMs - ms) / (24 * 60 * 60 * 1000));
	if (days <= 0) return "today";
	if (days === 1) return "yesterday";
	if (days < 60) return `${days}d ago`;
	return `${Math.floor(days / 30)}mo ago`;
}
