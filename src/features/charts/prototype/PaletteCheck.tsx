/**
 * PROTOTYPE (#95) — the instrument for the browser check.
 *
 * The whole module hands paint to the marks as a `var()` inside an SVG
 * **presentation attribute**:
 *
 *     <path fill="var(--chart-1, #69a621)" />
 *
 * Firefox and WebKit resolve that. Chromium's support for `var()` in
 * presentation attributes is documented as incomplete, so this page exists to
 * put the question in front of a pair of eyes in each browser.
 *
 * Two traps this page is shaped around:
 *
 * 1. **The fallback hides the failure in dark mode.** The hex inside `var()`
 *    is the dark step, so `var(--chart-1, #69a621)` and a resolved
 *    `--chart-1: #69a621` paint the *same color* in dark mode. A browser that
 *    ignores the var looks correct there. The probe rows therefore carry a
 *    fallback of **magenta**, which no slot ever is: magenta anywhere is a
 *    browser that did not resolve the var. That reads the same in both themes
 *    and needs no color memory.
 *
 * 2. **`fill` and `stroke` are separate attributes.** Areas and bars paint with
 *    `fill`, lines and sparklines with `stroke`. Both get their own probe.
 *
 * The real charts sit underneath the probes. In **light** mode they must match
 * the control row. If they look like the dark steps instead, the browser fell
 * back to the baked hex — a pass on the probe and a fail here would mean the
 * library, not the browser.
 *
 * Delete this file and its route when #95 is decided.
 */

import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { ChartSeries } from "../data";
import { ACCENT_PAINT, CHART_SLOTS } from "../palette";
import { Sparkline } from "../Sparkline";
import { StackedAreaChart } from "../StackedAreaChart";
import { TimeSeriesChart } from "../TimeSeriesChart";

/** No slot is ever magenta, so magenta on screen is an unresolved `var()`. */
const LOUD = "#ff00ff";

const MONO = "font-mono text-xs uppercase tracking-[0.2em]";

const DAY = 86_400_000;
const START = Date.UTC(2026, 6, 20);

function points(n: number, base: number, step: number) {
	return Array.from({ length: n }, (_, i) => ({
		at: START + i * DAY,
		value: base + i * step + (i % 3) * (step / 2),
	}));
}

/** Six series, so every slot in the palette is on screen at once. */
const SIX: ChartSeries[] = CHART_SLOTS.map((slot, i) => ({
	key: slot.hue,
	label: `Slot ${i + 1} · ${slot.hue}`,
	points: points(12, 90 - i * 12, 4 - i * 0.4),
}));

/** One series, which is what every public page ships today: the page accent. */
const ONE: ChartSeries[] = [
	{ key: "tokens", label: "Tokens", points: points(12, 100, 6) },
];

function PaletteCheck() {
	const { theme, setTheme } = useTheme();

	return (
		<main className="mx-auto max-w-4xl px-6 py-12">
			<h1 className="font-mono text-2xl font-black text-fg-primary">
				Chart palette · browser check
			</h1>
			<p className="mt-3 max-w-prose text-sm leading-relaxed text-fg-secondary">
				Every mark on this site takes its color from a CSS custom property
				written into an SVG <code>fill</code> or <code>stroke</code> attribute.
				This page asks one question: does this browser resolve it?
			</p>

			<ThemeSwitch theme={theme} setTheme={setTheme} />

			<Step
				n={1}
				title="The probe"
				note="Magenta anywhere below means this browser does not resolve var() in an SVG paint attribute. There is no other reason for magenta to appear."
			>
				<Row label="fill">
					{CHART_SLOTS.map((slot, i) => (
						<svg
							key={slot.hue}
							role="img"
							aria-label={`fill probe, slot ${i + 1}`}
							width="100%"
							height="56"
							viewBox="0 0 10 10"
							preserveAspectRatio="none"
						>
							<rect
								x="0"
								y="0"
								width="10"
								height="10"
								fill={`var(--chart-${i + 1}, ${LOUD})`}
							/>
						</svg>
					))}
				</Row>
				<Row label="stroke">
					{CHART_SLOTS.map((slot, i) => (
						<svg
							key={slot.hue}
							role="img"
							aria-label={`stroke probe, slot ${i + 1}`}
							width="100%"
							height="56"
							viewBox="0 0 10 10"
							preserveAspectRatio="none"
						>
							<line
								x1="0"
								y1="5"
								x2="10"
								y2="5"
								strokeWidth="4"
								stroke={`var(--chart-${i + 1}, ${LOUD})`}
							/>
						</svg>
					))}
				</Row>
			</Step>

			<Step
				n={2}
				title="The control"
				note="Painted by a CSS declaration, which every browser resolves. The two probe rows above must match this row, slot for slot, in both themes."
			>
				<Row label="css">
					{CHART_SLOTS.map((slot, i) => (
						<div
							key={slot.hue}
							className="h-14"
							style={{ background: `var(--chart-${i + 1})` }}
						/>
					))}
				</Row>
			</Step>

			<Step
				n={3}
				title="The accent"
				note="Single-series charts wear the page accent, not the palette. It travels the same way, so it gets the same probe. The left two boxes must match."
			>
				<div className="grid grid-cols-3 gap-3">
					<svg
						role="img"
						aria-label="accent fill probe"
						width="100%"
						height="56"
						viewBox="0 0 10 10"
						preserveAspectRatio="none"
					>
						<rect
							x="0"
							y="0"
							width="10"
							height="10"
							fill={`var(--accent-lime, ${LOUD})`}
						/>
					</svg>
					<div className="h-14" style={{ background: "var(--accent-lime)" }} />
					<div className="h-14 bg-[#ff00ff]" />
				</div>
				<p className={cn(MONO, "mt-2 text-fg-muted")}>
					probe · css control · reference magenta
				</p>
			</Step>

			<Step
				n={4}
				title="The real charts"
				note="Drawn by the shared module, painted the way the app paints them: the fallback here is the dark step, not magenta. In LIGHT mode these must match the control row in step 2. If they look like the dark steps instead, the browser fell back to the baked hex."
			>
				<div className="space-y-8">
					<Panel title="Six series · stacked areas · fill">
						<StackedAreaChart
							series={SIX}
							ariaLabel="Six palette slots as stacked areas"
						/>
					</Panel>
					<Panel title="Six series · lines and areas · stroke and fill">
						<TimeSeriesChart
							series={SIX}
							ariaLabel="Six palette slots as lines"
						/>
					</Panel>
					<Panel title="One series · the page accent">
						<TimeSeriesChart
							series={ONE}
							caption="one series wears the accent"
							ariaLabel="One series in the page accent"
						/>
					</Panel>
					<Panel title="Sparkline · the mark every public page ships">
						<div className="flex items-center gap-4">
							<Sparkline
								points={ONE[0].points}
								ariaLabel="Sparkline in the page accent"
							/>
							<span className={cn(MONO, "text-fg-muted")}>
								accent · {ACCENT_PAINT}
							</span>
						</div>
					</Panel>
				</div>
			</Step>

			<div className="mt-12 border-2 border-stroke-strong bg-bg-panel p-6">
				<h2 className={cn(MONO, "font-bold text-fg-primary")}>
					How to read it
				</h2>
				<ul className="mt-3 space-y-2 text-sm leading-relaxed text-fg-secondary">
					<li>
						<strong className="text-fg-primary">Pass.</strong> No magenta
						anywhere, and in light mode the charts match the control row.
					</li>
					<li>
						<strong className="text-fg-primary">Magenta boxes or lines.</strong>{" "}
						This browser ignores the <code>var()</code> in the paint attribute.
					</li>
					<li>
						<strong className="text-fg-primary">Black marks.</strong> The
						browser resolves neither the property nor the fallback.
					</li>
					<li>
						<strong className="text-fg-primary">
							Light mode looks like dark mode.
						</strong>{" "}
						The charts fell back to the baked hex. Compare against the control
						row, which is the truth.
					</li>
				</ul>
			</div>
		</main>
	);
}

function ThemeSwitch({
	theme,
	setTheme,
}: {
	theme: "dark" | "light";
	setTheme: (t: "dark" | "light") => void;
}) {
	return (
		<div className="mt-6 flex items-center gap-3">
			<span className={cn(MONO, "text-fg-muted")}>theme</span>
			{(["dark", "light"] as const).map((t) => (
				<button
					key={t}
					type="button"
					onClick={() => setTheme(t)}
					className={cn(
						MONO,
						"border-2 px-4 py-2 font-bold",
						theme === t
							? "border-accent bg-accent text-accent-contrast"
							: "border-stroke-strong bg-bg-panel text-fg-secondary",
					)}
				>
					{t}
				</button>
			))}
		</div>
	);
}

function Step({
	n,
	title,
	note,
	children,
}: {
	n: number;
	title: string;
	note: string;
	children: React.ReactNode;
}) {
	return (
		<section className="mt-10">
			<h2 className={cn(MONO, "font-bold text-fg-primary")}>
				{n}. {title}
			</h2>
			<p className="mt-2 max-w-prose text-sm leading-relaxed text-fg-secondary">
				{note}
			</p>
			<div className="mt-4">{children}</div>
		</section>
	);
}

function Row({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="mt-3">
			<span className={cn(MONO, "text-fg-muted")}>{label}</span>
			<div className="mt-1 grid grid-cols-6 gap-3">{children}</div>
		</div>
	);
}

function Panel({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="border-2 border-stroke-strong bg-bg-panel p-4">
			<p className={cn(MONO, "text-fg-muted")}>{title}</p>
			<div className="mt-3">{children}</div>
		</div>
	);
}

export { PaletteCheck };
