/**
 * The pulse must be in the FIRST HTML, not painted in after hydration.
 *
 * The band is what a first-time visitor reads above the featured stacks, and a
 * crawler reads nothing else. These assertions are about the rendered text and
 * real SVG marks, so a regression that pushes the band behind an effect fails
 * here instead of quietly shipping an empty strip.
 */

import { renderToString } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { PulseBand } from "../PulseBand";
import { band, syncRow } from "./fixture";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

describe("server rendering", () => {
	test("the numbers, the rows and the watermark all arrive complete", () => {
		const html = renderToString(
			<PulseBand band={band({ rows: [syncRow()] })} variant="landing" />,
		);

		expect(html).toContain("512M");
		// Uppercased by CSS, so the markup carries the words as written.
		expect(html).toContain("tokens measured");
		expect(html).toContain("596");
		expect(html).toContain("AI Stack");
		expect(html).toContain("measured usage moved");
		// The watermark is a real path, not a wrapper waiting to be measured.
		expect(html).toContain("<path");
	});

	test("relative time ships as words and as a machine-readable moment", () => {
		const html = renderToString(
			<PulseBand band={band({ rows: [syncRow()] })} variant="landing" />,
		);
		expect(html).toContain("<time");
		expect(html).toContain("ago");
	});
});
