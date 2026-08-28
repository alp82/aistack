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
