import { useCallback, useRef } from "react";

import { useMediaQuery } from "@/lib/useMediaQuery";

/**
 * Scroll target for pagination. Put `ref` on the element that should be
 * visible after a page change - the section header, not the grid, so the
 * user keeps the context of what they are paging through. The element needs
 * a `scroll-mt-*` large enough to clear the sticky site header (h-16).
 *
 * Honors `prefers-reduced-motion` (smooth -> auto).
 */
export function usePaginationScroll<T extends HTMLElement>(): {
	ref: React.RefObject<T | null>;
	scrollToTop: () => void;
} {
	const ref = useRef<T>(null);
	const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
	const scrollToTop = useCallback(() => {
		ref.current?.scrollIntoView({
			behavior: reduce ? "auto" : "smooth",
			block: "start",
		});
	}, [reduce]);
	return { ref, scrollToTop };
}
