import "@testing-library/jest-dom/vitest";

class MockIntersectionObserver implements IntersectionObserver {
	readonly root: Element | Document | null = null;
	readonly rootMargin = "";
	readonly thresholds: ReadonlyArray<number> = [];

	disconnect() {}
	observe() {}
	takeRecords(): IntersectionObserverEntry[] {
		return [];
	}
	unobserve() {}
}

globalThis.IntersectionObserver = MockIntersectionObserver;
