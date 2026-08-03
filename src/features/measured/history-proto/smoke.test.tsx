// PROTOTYPE smoke check — delete with the prototype. Renders every variant at
// every dataset so a crash shows up here and not in the owner's browser.
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DATASETS, readingsFor, toPoints } from "./fixtures";
import { VariantA } from "./VariantA";
import { VariantB } from "./VariantB";
import { VariantC } from "./VariantC";

vi.mock("@/lib/useScrollHighlight", () => ({
	useScrollHighlight: () => ({ ref: { current: null }, reduce: true }),
}));

const VARIANTS = { A: VariantA, B: VariantB, C: VariantC };

describe("history prototype", () => {
	for (const [key, Variant] of Object.entries(VARIANTS)) {
		for (const d of DATASETS) {
			it(`${key} renders ${d.key}`, () => {
				const points = toPoints(readingsFor(d.key));
				const { container } = render(
					<Variant index={1} anchor="section-measured" points={points} />,
				);
				expect(container.textContent).toContain("Actual Usage");
			});
		}
	}
});
