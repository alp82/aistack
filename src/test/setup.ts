import "@testing-library/jest-dom/vitest";

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
