import { render } from "@testing-library/react";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";
import { useScrollHighlight } from "@/lib/useScrollHighlight";

// src/test/setup.ts installs a global Element.prototype.scrollIntoView noop;
// spy over it so we can observe the call args the hook passes.
let scrollSpy: MockInstance;

beforeEach(() => {
	scrollSpy = vi.spyOn(Element.prototype, "scrollIntoView");
});

afterEach(() => {
	scrollSpy.mockRestore();
	vi.unstubAllGlobals();
});

/** Per-case matchMedia stub (jsdom has none). */
function stubMatchMedia(matches: boolean) {
	vi.stubGlobal(
		"matchMedia",
		(media: string): MediaQueryList =>
			({
				matches,
				media,
				onchange: null,
				addEventListener: () => {},
				removeEventListener: () => {},
				addListener: () => {},
				removeListener: () => {},
				dispatchEvent: () => false,
			}) as unknown as MediaQueryList,
	);
}

/** Mounts the hook and lands its ref on a real DOM node the spy can see. */
function Harness({
	highlighted,
	options,
	onReduce,
}: {
	highlighted: boolean | undefined;
	options?: { block?: ScrollLogicalPosition };
	onReduce?: (reduce: boolean) => void;
}) {
	const { ref, reduce } = useScrollHighlight<HTMLDivElement>(
		highlighted,
		options,
	);
	onReduce?.(reduce);
	return <div ref={ref} />;
}

describe("useScrollHighlight", () => {
	it("scrolls smoothly with the given block when motion is allowed", () => {
		stubMatchMedia(false);
		render(<Harness highlighted={true} options={{ block: "center" }} />);
		expect(scrollSpy).toHaveBeenCalledTimes(1);
		expect(scrollSpy).toHaveBeenCalledWith({
			behavior: "smooth",
			block: "center",
		});
	});

	it("scrolls with auto behavior and reports reduce when motion is reduced", () => {
		stubMatchMedia(true);
		let reduce = false;
		render(
			<Harness
				highlighted={true}
				options={{ block: "center" }}
				onReduce={(r) => {
					reduce = r;
				}}
			/>,
		);
		expect(scrollSpy).toHaveBeenCalledWith({
			behavior: "auto",
			block: "center",
		});
		expect(reduce).toBe(true);
	});

	it("defaults block to 'start' when no options are given", () => {
		stubMatchMedia(false);
		render(<Harness highlighted={true} />);
		expect(scrollSpy).toHaveBeenCalledWith({
			behavior: "smooth",
			block: "start",
		});
	});

	it("does not scroll when highlighted is false or undefined", () => {
		stubMatchMedia(false);
		render(<Harness highlighted={false} />);
		render(<Harness highlighted={undefined} />);
		expect(scrollSpy).not.toHaveBeenCalled();
	});
});
