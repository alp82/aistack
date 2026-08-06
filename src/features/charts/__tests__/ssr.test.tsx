/**
 * The property the whole library choice rests on: every chart arrives from the
 * server as complete SVG, not as an empty box that fills in after an effect.
 *
 * These assertions are deliberately about real marks — `<path>`, `<rect>`,
 * `<text>` — and not about a wrapper element. Recharts renders a wrapper too.
 * If a future version of the library regresses server rendering, this file
 * fails loudly instead of the site quietly shipping blank charts.
 */

import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { BarsChart } from "../BarsChart";
import type { ChartSeries } from "../data";
import { CHART_PAINTS } from "../palette";
import { Sparkline } from "../Sparkline";
import { StackedAreaChart } from "../StackedAreaChart";
import { TimeSeriesChart } from "../TimeSeriesChart";

const DAY = 86_400_000;
const START = Date.UTC(2026, 6, 1);

function days(n: number, base: number): { at: number; value: number }[] {
	return Array.from({ length: n }, (_, i) => ({
		at: START + i * DAY * 2,
		value: base + i * 7,
	}));
}

const one: ChartSeries[] = [
	{ key: "tokens", label: "Tokens", points: days(9, 100) },
];
const two: ChartSeries[] = [
	{ key: "claude-code", label: "Claude Code", points: days(9, 100) },
	{ key: "codex", label: "Codex", points: days(9, 40) },
];

const count = (html: string, tag: string) => occurrences(html, `<${tag}`);
const occurrences = (html: string, needle: string) =>
	html.split(needle).length - 1;
const xTickLabels = (html: string) =>
	occurrences(html, 'data-ts-key="x-tick-label');

describe("server rendering", () => {
	test("a time series arrives as real marks and real labels", () => {
		const html = renderToString(
			<TimeSeriesChart series={one} ariaLabel="Tokens per day" />,
		);
		expect(count(html, "path")).toBeGreaterThan(0);
		expect(count(html, "text")).toBeGreaterThan(0);
		expect(html).toContain("viewBox=");
		expect(html).toContain('role="img"');
		expect(html).toContain('aria-label="Tokens per day"');
	});

	test("a stacked composition arrives as one filled path per layer", () => {
		const html = renderToString(
			<StackedAreaChart series={two} ariaLabel="Tokens by harness" />,
		);
		expect(count(html, "path")).toBeGreaterThanOrEqual(2);
		expect(count(html, "text")).toBeGreaterThan(0);
	});

	test("horizontal bars arrive as rects", () => {
		const html = renderToString(
			<BarsChart
				bars={[
					{ key: "a", label: "Stack A", value: 90 },
					{ key: "b", label: "Stack B", value: 40 },
				]}
				ariaLabel="Tokens by stack"
			/>,
		);
		expect(count(html, "rect")).toBe(2);
		expect(count(html, "text")).toBeGreaterThan(0);
	});

	test("a sparkline arrives as a bare line with no axis furniture", () => {
		const html = renderToString(
			<Sparkline points={days(9, 100)} ariaLabel="Tokens trend" />,
		);
		expect(count(html, "path")).toBe(1);
		expect(count(html, "text")).toBe(0);
		expect(html).toContain('viewBox="0 0 120 28"');
	});

	test("a sparkline wears the accent, or the slot its row already wears", () => {
		// A sparkline inside a row that is already painted from the palette must
		// wear that same slot: two paints for one entity is two entities.
		expect(
			renderToString(<Sparkline points={days(4, 10)} ariaLabel="a" />),
		).toContain("var(--accent-lime");
		expect(
			renderToString(
				<Sparkline
					points={days(4, 10)}
					ariaLabel="a"
					paint={CHART_PAINTS[2]}
				/>,
			),
		).toContain("var(--chart-3");
	});

	test("a backdrop sparkline fills its box and carries a fill under the line", () => {
		const html = renderToString(
			<Sparkline points={days(4, 10)} ariaLabel="a" area fluid height={140} />,
		);
		// Two paths: the fill and the line. A bare sparkline draws only the line.
		expect(count(html, "path")).toBe(2);
	});
});

describe("house style", () => {
	test("data ends are square everywhere", () => {
		const html = [
			renderToString(<TimeSeriesChart series={two} ariaLabel="a" />),
			renderToString(<StackedAreaChart series={two} ariaLabel="b" />),
			renderToString(
				<BarsChart bars={[{ key: "a", label: "A", value: 1 }]} ariaLabel="c" />,
			),
		].join("");
		expect(html).not.toContain(" rx=");
		expect(html).not.toContain(" ry=");
	});

	test("one series wears the page accent, never a palette slot", () => {
		const html = renderToString(
			<TimeSeriesChart series={one} ariaLabel="Tokens per day" />,
		);
		expect(html).toContain("var(--accent-lime");
		expect(html).not.toContain("var(--chart-");
	});

	test("two series wear the palette in slot order, never the accent", () => {
		const html = renderToString(
			<StackedAreaChart series={two} ariaLabel="Tokens by harness" />,
		);
		expect(html).toContain("var(--chart-1");
		expect(html).toContain("var(--chart-2");
		expect(html).not.toContain("var(--accent-lime");
	});

	test("the paint carries a hex fallback, so a chart outside our CSS still looks like the house", () => {
		const html = renderToString(
			<StackedAreaChart series={two} ariaLabel="Tokens by harness" />,
		);
		expect(html).toContain("var(--chart-1, #69a621)");
	});
});

describe("where the paint lives (#95)", () => {
	// The paint is a `var()` inside an SVG *presentation attribute*, which is the
	// library's documented theming path and the only way light and dark stay a
	// pure CSS concern: the server cannot know the theme, so a baked hex would
	// paint one of the two modes wrong on first paint.
	//
	// The DOM host repaints the scene after mount, so the attribute has to
	// survive that. These tests pin both sides to the SAME place, because a fix
	// that moved the paint into a `style` declaration would have to move it on
	// both — a server attribute and a client style is a mark that changes color
	// at hydration.

	test("the server writes the paint into a fill attribute, not a style", () => {
		const html = renderToString(
			<StackedAreaChart series={two} ariaLabel="Tokens by harness" />,
		);
		expect(html).toMatch(/<path[^>]*\sfill="var\(--chart-1, #69a621\)"/);
	});

	test("the client repaint puts it in the same place the server did", () => {
		const { container } = render(
			<StackedAreaChart series={two} ariaLabel="Tokens by harness" />,
		);
		const marks = container.querySelectorAll("path[data-ts-key]");
		expect(marks.length).toBeGreaterThanOrEqual(2);
		const paints = Array.from(marks, (m) => m.getAttribute("fill"));
		expect(paints).toContain("var(--chart-1, #69a621)");
		expect(paints).toContain("var(--chart-2, #9e71fd)");
		// No mark carries a competing paint in a style declaration.
		for (const m of marks) expect(m.getAttribute("style")).toBeNull();
	});

	test("a line series travels by stroke, which is a separate attribute", () => {
		const html = renderToString(
			<TimeSeriesChart series={two} ariaLabel="Tokens by harness" />,
		);
		expect(html).toMatch(/<path[^>]*\sstroke="var\(--chart-1, #69a621\)"/);
	});
});

describe("the thin case", () => {
	test("no readings draw nothing at all", () => {
		const html = renderToString(
			<TimeSeriesChart
				series={[{ key: "t", label: "Tokens", points: [] }]}
				ariaLabel="Tokens per day"
			/>,
		);
		expect(html).toBe("");
	});

	test("one reading is a number, not a chart around a dot", () => {
		const html = renderToString(
			<TimeSeriesChart
				series={[{ key: "t", label: "Tokens", points: days(1, 100) }]}
				ariaLabel="Tokens per day"
			/>,
		);
		expect(html).not.toContain("<svg");
		expect(html).toContain("one reading");
	});

	test("three readings draw ticks only on the days that carry data, and no grid", () => {
		const html = renderToString(
			<TimeSeriesChart
				series={[{ key: "t", label: "Tokens", points: days(3, 100) }]}
				ariaLabel="Tokens per day"
			/>,
		);
		expect(html).toContain("ts-chart__marks");
		expect(html).not.toContain("ts-chart__grid");
		// one label per reading on the x axis, and no invented days between them
		expect(xTickLabels(html)).toBe(3);
	});

	test("ninety readings draw the usual chart, with a grid and thinned labels", () => {
		const html = renderToString(
			<TimeSeriesChart
				series={[{ key: "t", label: "Tokens", points: days(90, 100) }]}
				ariaLabel="Tokens per day"
			/>,
		);
		expect(html).toContain("ts-chart__grid");
		expect(xTickLabels(html)).toBeLessThan(12);
	});

	test("a sparkline with one reading draws nothing", () => {
		const html = renderToString(
			<Sparkline points={days(1, 100)} ariaLabel="Tokens trend" />,
		);
		expect(html).toBe("");
	});
});

describe("what the library does not ship", () => {
	test("two series always get a legend", () => {
		const html = renderToString(
			<StackedAreaChart series={two} ariaLabel="Tokens by harness" />,
		);
		expect(html).toContain("Claude Code");
		expect(html).toContain("Codex");
	});

	test("one series gets no legend box — the caption names it", () => {
		const html = renderToString(
			<TimeSeriesChart series={one} caption="Tokens" ariaLabel="Tokens" />,
		);
		expect(count(html, "<li")).toBe(0);
	});

	test("every chart carries a table view with exact values", () => {
		const html = renderToString(
			<TimeSeriesChart series={one} ariaLabel="Tokens per day" />,
		);
		expect(html).toContain("<table");
		expect(html).toContain("Jul 1, 2026");
	});
});
