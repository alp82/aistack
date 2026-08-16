import "@testing-library/jest-dom/vitest";
import { MotionGlobalConfig } from "motion/react";

// Skip all Motion animations in tests so AnimatePresence exits unmount
// synchronously - accordion assertions check the panel is gone immediately.
MotionGlobalConfig.skipAnimations = true;

// jsdom does not implement document.execCommand; the clipboard fallback path
// (useClipboard) calls it, and tests spy on it via vi.spyOn - which requires
// the property to exist. Provide a noop so the spy can replace it.
if (typeof document !== "undefined" && !document.execCommand) {
	document.execCommand = () => false;
}

// jsdom does not implement scrollIntoView; components call it inside effects
// (highlighted BundleCard, editor sidebar nav), so provide a noop to keep
// those renders from throwing. Guarded because this setup file also loads for
// node-environment test files where `Element` is undefined.
if (typeof Element !== "undefined") {
	Element.prototype.scrollIntoView = () => {};
}

// framer-motion's whileInView/viewport features call IntersectionObserver,
// which jsdom does not implement. Provide an inert stub so motion components
// render in tests (the in-view transition simply never fires).
// motion/react's Reorder.Group uses ResizeObserver internally under jsdom.
// Provide an inert stub so drag-reorder components render without throwing.
if (typeof ResizeObserver === "undefined") {
	class MockResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
	globalThis.ResizeObserver =
		MockResizeObserver as unknown as typeof ResizeObserver;
}

if (typeof IntersectionObserver === "undefined") {
	class MockIntersectionObserver {
		readonly root = null;
		readonly rootMargin = "";
		readonly thresholds: ReadonlyArray<number> = [];
		observe() {}
		unobserve() {}
		disconnect() {}
		takeRecords(): IntersectionObserverEntry[] {
			return [];
		}
	}
	globalThis.IntersectionObserver =
		MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

// jsdom does not implement window.matchMedia; SpeedingText reads it for
// prefers-reduced-motion. Report "no preference" so components animate the
// way a default browser would.
if (typeof window !== "undefined" && !window.matchMedia) {
	window.matchMedia = (query: string) =>
		({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false,
		}) as MediaQueryList;
}
