import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Sanitize a user-supplied URL for use as an <a href>.
 * - Trims whitespace; empty/null/undefined → null (render as plain element).
 * - Prefixes `https://` when no scheme is present (bare host like "example.com").
 * - Rejects any scheme other than http: or https: (javascript:, data:, etc.) → null.
 * Returns the normalized href string, or null when the input is unsafe/empty.
 */
export function safeExternalUrl(url: string | undefined | null): string | null {
	if (!url) return null;
	const trimmed = url.trim();
	if (!trimmed) return null;
	// Add https:// when no scheme is present
	const normalized = /^https?:\/\//i.test(trimmed)
		? trimmed
		: `https://${trimmed}`;
	try {
		const parsed = new URL(normalized);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			return null;
		}
		return parsed.href;
	} catch {
		return null;
	}
}

/** Compact relative time, e.g. "just now", "5m ago", "2d ago", "3mo ago". */
export function timeAgo(ms: number): string {
	const sec = Math.floor((Date.now() - ms) / 1000);
	if (sec < 60) return "just now";
	const min = Math.floor(sec / 60);
	if (min < 60) return `${min}m ago`;
	const hr = Math.floor(min / 60);
	if (hr < 24) return `${hr}h ago`;
	const day = Math.floor(hr / 24);
	if (day < 7) return `${day}d ago`;
	const wk = Math.floor(day / 7);
	if (wk < 5) return `${wk}w ago`;
	const mo = Math.floor(day / 30);
	if (mo < 12) return `${mo}mo ago`;
	return `${Math.floor(day / 365)}y ago`;
}
