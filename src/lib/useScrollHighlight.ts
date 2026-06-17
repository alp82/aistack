import { useEffect, useRef } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";

/**
 * Scrolls a ref'd element into view when `highlighted` flips true.
 *
 * Honors `prefers-reduced-motion` (smooth -> auto). Returns `reduce` so
 * callers can gate non-scroll motion (e.g. a pulse) on the same preference.
 */
export function useScrollHighlight<T extends Element>(
	highlighted: boolean | undefined,
	options?: { block?: ScrollLogicalPosition },
): { ref: React.RefObject<T | null>; reduce: boolean } {
	const ref = useRef<T>(null);
	const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
	const block = options?.block ?? "start";

	useEffect(() => {
		if (highlighted)
			ref.current?.scrollIntoView({
				behavior: reduce ? "auto" : "smooth",
				block,
			});
	}, [highlighted, reduce, block]);

	return { ref, reduce };
}
