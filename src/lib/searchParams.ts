import type { useNavigate } from "@tanstack/react-router";

/**
 * URL search-param coercion helpers + a navigate-backed search updater.
 *
 * These power the filter/sort/search/pagination state on the landing, stacks,
 * and tools surfaces. Coercers are pure and total: any junk value falls back
 * to a sensible default so a hand-typed URL never crashes a route.
 */

/** Returns `value` when it is a string member of `allowed`, else `fallback`. */
export function coerceEnum<T extends string>(
	value: unknown,
	allowed: readonly T[],
	fallback: T,
): T {
	return typeof value === "string" &&
		(allowed as readonly string[]).includes(value)
		? (value as T)
		: fallback;
}

/** Returns `value` when it is a string (empty string IS valid), else `fallback`. */
export function coerceString(value: unknown, fallback: string): string {
	return typeof value === "string" ? value : fallback;
}

/**
 * Coerces to a 1-based page integer. Anything that is not an integer ≥ 1
 * (fractions, negatives, zero, non-numeric, nullish) becomes 1.
 * `Number()` trims whitespace, so "  2  " → 2; "3.7"/3.7 → 1 (not an integer).
 */
export function coercePage(value: unknown): number {
	const n = Number(value);
	return Number.isInteger(n) && n >= 1 ? n : 1;
}

/**
 * Coerces a boolean flag. `true`/"true" → true, `false`/"false" → false
 * (case-sensitive). Anything else → `fallback`.
 */
export function coerceBool(value: unknown, fallback: boolean): boolean {
	if (value === true || value === "true") return true;
	if (value === false || value === "false") return false;
	return fallback;
}

type NavigateFn = ReturnType<typeof useNavigate>;

/**
 * Builds a `setSearch(patch)` that merges `patch` over the current search via a
 * functional updater and navigates with `replace: true`. When the patch touches
 * any `resetPageKeys` key (and does not set `page` explicitly), `page` resets
 * to 1 so changing a filter/sort/query starts at the first page.
 *
 * `resetScroll: false` keeps the viewport in place on navigation - for sections
 * below the fold (e.g. landing Featured Stacks) where jumping to the page top
 * would lose the user's place.
 */
export function makeSearchUpdater<S extends { page: number }>(
	navigate: NavigateFn,
	opts: { resetPageKeys: (keyof S)[]; resetScroll?: boolean },
): (patch: Partial<S>) => void {
	return (patch: Partial<S>) => {
		const shouldResetPage =
			opts.resetPageKeys.some((k) => k in patch) && !("page" in patch);
		navigate({
			search: (prev: S) => ({
				...prev,
				...patch,
				...(shouldResetPage ? { page: 1 } : {}),
			}),
			replace: true,
			resetScroll: opts.resetScroll ?? true,
		} as Parameters<NavigateFn>[0]);
	};
}
