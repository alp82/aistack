import { useEffect, useState } from "react";

/**
 * SSR-safe `matchMedia` hook.
 *
 * Returns false during server render and the first client paint, then
 * subscribes to the matchMedia change event and updates on breakpoint changes.
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		if (
			typeof window === "undefined" ||
			typeof window.matchMedia !== "function"
		) {
			return;
		}
		const mql = window.matchMedia(query);
		setMatches(mql.matches);

		const onChange = (event: MediaQueryListEvent) => {
			setMatches(event.matches);
		};

		if (typeof mql.addEventListener === "function") {
			mql.addEventListener("change", onChange);
			return () => mql.removeEventListener("change", onChange);
		}
		mql.addListener(onChange);
		return () => mql.removeListener(onChange);
	}, [query]);

	return matches;
}
