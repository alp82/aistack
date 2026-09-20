import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import {
	ActivityChart,
	ActivityMarginals,
	HarnessPieChart,
	LinesChart,
	SegmentChart,
	ShareChart,
} from "../StatsCharts";

const segments = [
	{ key: "a", label: "A & B", share: 0.6, previous: 0.03, paint: "lime" },
];
const cells = Array.from({ length: 7 }, () => Array<number>(24).fill(2));
const starts = Array<number>(24).fill(3);
const cases = [
	{
		name: "previous share",
		chart: <ShareChart share={0.6} previous={0.03} label="Model share" />,
		title: "Previous: 3.0%",
	},
	{
		name: "segments",
		chart: <SegmentChart segments={segments} label="Mix" />,
		title: "A & B: 60.0%",
	},
	{
		name: "harness pie",
		chart: <HarnessPieChart segments={segments} />,
		title: "A & B, previous: 3.0%",
	},
	{
		name: "activity",
		chart: <ActivityChart cells={cells} starts={starts} />,
		title: "Mon 00:00: 2 activity events",
	},
	{
		name: "portrait activity",
		chart: <ActivityChart cells={cells} starts={starts} portrait />,
		title: "00:00: 3 session starts",
	},
	{
		name: "activity marginals",
		chart: <ActivityMarginals cells={cells} />,
		title: "Mon: 48 events",
	},
	{
		name: "lines",
		chart: (
			<LinesChart
				days={[{ date: "2026-09-20", additions: 1234, removals: 12 }]}
			/>
		),
		title: "2026-09-20: +1,234 / -12 lines",
	},
];

it.each(cases)(
	"hydrates $name without replacing server-rendered SVG",
	async ({ chart, title }) => {
		const container = document.createElement("div");
		container.innerHTML = renderToString(chart);
		document.body.append(container);
		const svg = container.querySelector("svg");
		const errors: unknown[] = [];
		let root: ReturnType<typeof hydrateRoot> | undefined;
		try {
			await act(async () => {
				root = hydrateRoot(container, chart, {
					onRecoverableError: (error) => errors.push(error),
				});
			});
			expect(errors).toEqual([]);
			expect(container.querySelector("svg")).toBe(svg);
			expect(
				Array.from(
					container.querySelectorAll("title"),
					(node) => node.textContent,
				),
			).toContain(title);
		} finally {
			await act(async () => root?.unmount());
			container.remove();
		}
	},
);
