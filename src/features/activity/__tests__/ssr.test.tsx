/**
 * The pulse must be in the FIRST HTML, not painted in after hydration.
 *
 * The hero is what a first-time visitor reads above the featured stacks, and a
 * crawler reads nothing else. The visible count animates in (#147), so the
 * canonical reading rides an sr-only sentence — these assertions pin that the
 * figures, the latest line and real SVG marks all arrive server-rendered.
 */

import { renderToString } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { PulseBand } from "../PulseBand";
import { PulseHero } from "../PulseHero";
import { band, syncRow } from "./fixture";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));

describe("server rendering", () => {
	test("the hero's reading, latest line and chart all arrive complete", () => {
		// renderToString separates JSX expressions with comment nodes; strip them
		// so the assertions read the sentence the way a crawler does.
		const html = renderToString(
			<PulseHero band={band({ rows: [syncRow()] })} />,
		).replaceAll("<!-- -->", "");

		// The sr-only canonical sentence carries every figure.
		expect(html).toContain("512M tokens measured in the last 24 hours");
		expect(html).toContain("596 sessions");
		expect(html).toContain("Usage in the last 24 hours");
		// The whole feed, one line.
		expect(html).toContain("latest:");
		expect(html).toContain("alp/ai-stack-ab12");
		// The trend chart is a real path, not a wrapper waiting to be measured.
		expect(html).toContain("<path");
	});

	test("relative time ships as words and as a machine-readable moment", () => {
		const html = renderToString(
			<PulseHero band={band({ rows: [syncRow()] })} />,
		);
		expect(html).toContain("<time");
		expect(html).toContain("ago");
	});

	test("the /activity band still arrives with numbers and watermark", () => {
		const html = renderToString(<PulseBand band={band()} />);
		expect(html).toContain("512M");
		expect(html).toContain("tokens measured");
		expect(html).toContain("<path");
	});
});
