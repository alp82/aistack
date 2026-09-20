import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import {
	ActivityChart,
	ActivityMarginals,
	HarnessPieChart,
	LinesChart,
	SegmentChart,
	ShareChart,
	WaffleChart,
} from "../StatsCharts";

const segments = [
	{ key: "a", label: "A", share: 0.8, previous: 0.2, paint: "var(--chart-1)" },
	{ key: "b", label: "B", share: 0.2, previous: 0.8, paint: "var(--chart-2)" },
];
it("renders every Stats chart with complete finite square SVG geometry", () => {
	const cells = Array.from({ length: 7 }, () => Array<number>(24).fill(2));
	const starts = Array<number>(24).fill(3);
	const charts = [
		<ActivityChart key="heat" cells={cells} starts={starts} />,
		<ActivityChart key="portrait" cells={cells} starts={starts} portrait />,
		<ActivityMarginals key="margins" cells={cells} />,
		<HarnessPieChart key="pie" segments={segments} />,
		<LinesChart
			key="lines"
			days={[{ date: "2026-09-20", additions: 30, removals: 10 }]}
		/>,
		<SegmentChart key="strip" segments={segments} label="mix" />,
		<ShareChart key="share" share={0.2} previous={0} label="share" />,
		<WaffleChart
			key="waffle"
			cells={Array<string>(200).fill("free")}
			colors={{ free: "gray" }}
			columns={40}
			label="context"
		/>,
	];
	for (const chart of charts) {
		const html = renderToString(chart);
		expect(html).toContain("<svg");
		expect(html).toMatch(/<(rect|circle)/);
		expect(html).not.toMatch(/NaN|Infinity|rx=|ry=|stroke-linecap="round"/);
	}
	expect(renderToString(charts[0]).match(/<rect/g)).toHaveLength(192);
	expect(renderToString(charts[7]).match(/<rect/g)).toHaveLength(200);
});
it("uses one shared scale for added and removed lines and preserves zeros", () => {
	const html = renderToString(
		<LinesChart days={[{ date: "2026-09-20", additions: 30, removals: 10 }]} />,
	);
	expect(html).toContain('height="72"');
	expect(html).toContain('height="24"');
	const zero = renderToString(<ShareChart share={0} label="zero" />);
	expect(zero).toContain('width="0"');
});
