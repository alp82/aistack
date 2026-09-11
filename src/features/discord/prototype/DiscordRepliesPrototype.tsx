// Throwaway: three Discord reply layouts on /prototype/discord-replies?variant=B.
// Synthetic fixtures. This is a browser preview, not Discord rendering or approved command syntax.
import { useEffect, useId, useState } from "react";
import { BarsChart, TimeSeriesChart } from "@/features/charts";
import { ContextBody } from "@/features/usage/ContextRow";
import type { ContextHarness } from "@/features/usage/context";
import "./prototype.css";

type Row = { label: string; value: string; amount?: number };

export function defaultReplyVariant(example: string) {
	return ["period", "person", "zero", "trend", "context", "sparse"].includes(
		example,
	)
		? "C"
		: "B";
}
type Example = {
	name: string;
	ask: string;
	title: string;
	value: string;
	unit: string;
	range?: string;
	rows: Row[];
	note?: string;
	disclosure?: string;
	chart?: "bars" | "trend" | "context";
	full?: Row[];
};
const price =
	"Usage: 94% of tokens priced · models.dev@2026-09-01 (fixture source)";
const models = [
	{ label: "Claude Sonnet", value: "6.0M · 50%", amount: 6 },
	{ label: "GPT", value: "3.0M · 25%", amount: 3 },
	{ label: "Gemini", value: "1.2M · 10%", amount: 1.2 },
	{ label: "Kimi", value: "0.6M · 5%", amount: 0.6 },
	{ label: "Qwen", value: "0.6M · 5%", amount: 0.6 },
	{ label: "Other", value: "0.6M · 5%", amount: 0.6 },
];
const examples: Record<string, Example> = {
	total: {
		name: "A number",
		ask: "My tokens over 7 days",
		title: "Tokens",
		value: "12.0M",
		unit: "tokens",
		rows: [],
	},
	models: {
		name: "Crowded breakdown",
		ask: "My tokens by model over 7 days",
		title: "Tokens by model",
		value: "12.0M",
		unit: "tokens",
		rows: models,
		chart: "bars",
		full: [
			...models.slice(0, 5),
			{ label: "DeepSeek", value: "0.36M · 3%", amount: 0.36 },
			{ label: "Local model", value: "0.24M · 2%", amount: 0.24 },
		],
	},
	trend: {
		name: "Daily cost by model",
		ask: "My daily usage cost by model over 7 days",
		title: "Daily measured usage cost",
		value: "≥ $42.00",
		unit: "measured usage",
		chart: "trend",
		disclosure: price,
		rows: [
			{ label: "Sep 05", value: "$3 + $1 = ≥ $4" },
			{ label: "Sep 06", value: "$4 + $2 = ≥ $6" },
			{ label: "Sep 07", value: "$5 + $2 = ≥ $7" },
			{ label: "Sep 08", value: "$2 + $1 = ≥ $3" },
			{ label: "Sep 09", value: "$6 + $2 = ≥ $8" },
			{ label: "Sep 10", value: "$4 + $3 = ≥ $7" },
			{ label: "Sep 11", value: "$6 + $1 = ≥ $7" },
		],
		note: "Claude Sonnet + GPT · each figure ≥, 94% priced",
	},
	period: {
		name: "Previous period",
		ask: "Compare my tokens with the previous 7 days",
		title: "Token change",
		value: "+50%",
		unit: "+4.0M tokens",
		rows: [
			{ label: "Sep 05–11", value: "12.0M", amount: 12 },
			{ label: "Aug 29–Sep 04", value: "8.0M", amount: 8 },
		],
		chart: "bars",
	},
	person: {
		name: "Two people",
		ask: "Compare my tokens with @river over 7 days",
		title: "@alp vs @river",
		value: "+50%",
		unit: "@alp used 4.0M more tokens",
		rows: [
			{ label: "@alp", value: "12.0M", amount: 12 },
			{ label: "@river", value: "8.0M", amount: 8 },
		],
		chart: "bars",
	},
	zero: {
		name: "Zero baseline",
		ask: "Compare my tokens with the previous 7 days",
		title: "Token change",
		value: "+1.2M",
		unit: "tokens · percentage n/a",
		rows: [
			{ label: "Sep 05–11", value: "1.2M", amount: 1.2 },
			{ label: "Aug 29–Sep 04", value: "0", amount: 0 },
		],
		chart: "bars",
	},
	cost: {
		name: "Two cost meanings",
		ask: "My subscriptions and usage cost",
		title: "Costs",
		value: "≥ $42.00",
		unit: "measured usage · Sep 05–11",
		rows: [
			{ label: "Current subscriptions", value: "$40 / month" },
			{ label: "Claude plan", value: "$20 / month" },
			{ label: "ChatGPT plan", value: "$20 / month" },
		],
		disclosure: price,
	},
	context: {
		name: "Context",
		ask: "My context usage over 7 days",
		title: "Context per call",
		value: "32%",
		unit: "of the Claude Code window",
		rows: [
			{ label: "Median call", value: "64K / 200K" },
			{ label: "Harness", value: "12K · 6%" },
			{ label: "Instructions", value: "8K · 4%" },
			{ label: "Usual chat", value: "44K · 22%" },
			{ label: "90th percentile call", value: "120K · 60%" },
		],
		note: "Laptop · Claude Code · 1,000 calls",
		chart: "context",
	},
	habits: {
		name: "Measured habits",
		ask: "My sessions and working habits over 7 days",
		title: "Sessions",
		value: "24",
		unit: "measured sessions",
		rows: [
			{ label: "Median session", value: "18 min" },
			{ label: "Sessions using subagents", value: "25% · 6 / 24" },
			{ label: "Cache reuse", value: "75% of input tokens" },
			{ label: "Workspaces / active day", value: "2" },
		],
		note: "Laptop · Claude Code",
	},
	git: {
		name: "Git and file types",
		ask: "My Git changes over 7 days",
		title: "Git commits",
		value: "18",
		unit: "commits",
		rows: [
			{ label: "Added / deleted", value: "+1,240 / −360 lines" },
			{ label: "TypeScript", value: "1,100 changed lines" },
			{ label: "Markdown", value: "320 changed lines" },
			{ label: "Other", value: "180 changed lines" },
		],
		note: "Laptop",
	},
	sparse: {
		name: "Missing days and zero",
		ask: "My daily tokens over 7 days",
		title: "Daily tokens",
		value: "1.2M",
		unit: "tokens",
		rows: [
			{ label: "Sep 05", value: "400K" },
			{ label: "Sep 06", value: "n/a" },
			{ label: "Sep 07", value: "0" },
			{ label: "Sep 08", value: "n/a" },
			{ label: "Sep 09", value: "800K" },
			{ label: "Sep 10", value: "n/a" },
			{ label: "Sep 11", value: "n/a" },
		],
	},
	unavailable: {
		name: "Unavailable measurement",
		ask: "My context usage over 7 days",
		title: "Context per call",
		value: "n/a",
		unit: "",
		rows: [],
	},
	private: {
		name: "Cost not published",
		ask: "My usage cost over 7 days",
		title: "Measured usage cost",
		value: "n/a",
		unit: "Cost is not published",
		rows: [],
	},
};
const context: ContextHarness = {
	harness: "claude-code",
	window: 200000,
	calls: 1000,
	medianCall: 64000,
	p90Call: 120000,
	harnessTokens: 12000,
	instructionsTokens: 8000,
	usualChat: 44000,
	longChat: 100000,
	compactions: 8,
};
const names = {
	A: "Compact text",
	B: "Structured embed",
	C: "Image-led answer",
};
function rowText(row: Row) {
	return `${row.label.padEnd(23)} ${row.value}`;
}

function Visual({ example }: { example: Example }) {
	if (example.chart === "context")
		return <ContextBody context={{ harnesses: [context] }} />;
	if (example.chart === "trend")
		return (
			<TimeSeriesChart
				initialWidth={480}
				height={190}
				ariaLabel="Daily measured cost by model, lower bounds in USD"
				formatValue={(n) => `$${n}`}
				series={[
					{
						key: "claude",
						label: "Claude Sonnet",
						points: [3, 4, 5, 2, 6, 4, 6].map((value, i) => ({
							at: Date.UTC(2026, 8, 5 + i),
							value,
						})),
					},
					{
						key: "gpt",
						label: "GPT",
						points: [1, 2, 2, 1, 2, 3, 1].map((value, i) => ({
							at: Date.UTC(2026, 8, 5 + i),
							value,
						})),
					},
				]}
			/>
		);
	if (example.chart === "bars")
		return (
			<BarsChart
				initialWidth={480}
				ariaLabel={`${example.title}, millions of tokens`}
				formatValue={(n) => `${n}M`}
				bars={example.rows.map((r) => ({
					key: r.label,
					label: r.label,
					value: r.amount ?? 0,
				}))}
			/>
		);
	return null;
}

function Facts({ example }: { example: Example }) {
	return (
		<dl className="dp-facts">
			{example.rows.map((r) => (
				<div key={r.label}>
					<dt>{r.label}</dt>
					<dd>{r.value}</dd>
				</div>
			))}
		</dl>
	);
}
function Foot({ example }: { example: Example }) {
	return (
		<>
			{example.note && <p className="dp-note">{example.note}</p>}
			{example.disclosure && <p className="dp-note">{example.disclosure}</p>}
		</>
	);
}
function VariantA({ example }: { example: Example }) {
	return (
		<div className="dp-text">
			<p>
				<strong>
					{example.value} {example.unit}
				</strong>
			</p>
			<p className="dp-muted">@alp · {example.title} · Sep 05–11, 2026</p>
			{example.rows.length > 0 && (
				<pre>{example.rows.map(rowText).join("\n")}</pre>
			)}
			<Foot example={example} />
		</div>
	);
}
function VariantB({ example }: { example: Example }) {
	return (
		<div className="dp-embed">
			<p className="dp-label">@alp · Sep 05–11, 2026</p>
			<h2>{example.title}</h2>
			<p className="dp-medium">{example.value}</p>
			<p>{example.unit}</p>
			<Facts example={example} />
			<Foot example={example} />
		</div>
	);
}
function VariantC({ example }: { example: Example }) {
	return (
		<>
			<p className="dp-fallback">
				<strong>{example.value}</strong> {example.unit} · @alp · Sep 05–11, 2026
			</p>
			<div className="dp-image">
				<div className="dp-image-header">
					<span>AI STACK / {example.title}</span>
					<span>@alp</span>
				</div>
				<div className="dp-hero">{example.value}</div>
				<p className="dp-unit">{example.unit}</p>
				<p className="dp-label">Sep 05–11, 2026</p>
				<div className="dp-chart">
					<Visual example={example} />
				</div>
				{example.chart !== "context" && <Facts example={example} />}
				<Foot example={example} />
			</div>
			{example.disclosure && <p className="dp-note">{example.disclosure}</p>}
		</>
	);
}

export function DiscordRepliesPrototype({
	variant,
	example: key,
	onChange,
}: {
	variant: string;
	example: string;
	onChange: (next: { variant?: string; example?: string }) => void;
}) {
	const exampleId = useId();
	const [narrow, setNarrow] = useState(false);
	const [details, setDetails] = useState(false);
	const example = examples[key] ?? examples.total;
	const active = variant === "B" ? "B" : variant === "C" ? "C" : "A";
	const cycle = (step: number) =>
		onChange({
			variant: ["A", "B", "C"][
				(["A", "B", "C"].indexOf(active) + step + 3) % 3
			],
		});
	useEffect(() => {
		const handler = (event: KeyboardEvent) => {
			if (
				event.target instanceof HTMLElement &&
				(event.target.isContentEditable ||
					["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(
						event.target.tagName,
					))
			)
				return;
			if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
				event.preventDefault();
				cycle(event.key === "ArrowLeft" ? -1 : 1);
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	});
	return (
		<main className="dp">
			<header className="dp-intro">
				<p className="dp-label">THROWAWAY PROTOTYPE / SYNTHETIC DATA</p>
				<h1>How much answer belongs in chat?</h1>
				<p>
					Compare text, embeds, and an image composition. Preview controls below
					are outside the reply. Exact commands and controls are a later
					decision.
				</p>
			</header>
			<div className="dp-workbench">
				<aside>
					<label htmlFor={exampleId}>Question to preview</label>
					<select
						id={exampleId}
						value={key}
						onChange={(e) => {
							setDetails(false);
							onChange({
								example: e.target.value,
								variant: defaultReplyVariant(e.target.value),
							});
						}}
					>
						{Object.entries(examples).map(([id, e]) => (
							<option key={id} value={id}>
								{e.name}
							</option>
						))}
					</select>
					<button type="button" onClick={() => setNarrow(!narrow)}>
						{narrow ? "Use desktop width" : "Use narrow width"}
					</button>
					<p className="dp-muted">
						A: minimum message footprint.
						<br />
						B: default. A clear headline and named fields.
						<br />
						C: comparisons, trends, and context. A visual with a short text
						fallback.
					</p>
					<p className="dp-muted">
						The browser approximates Discord. Image compositions are HTML/SVG
						drafts; no attachment has been uploaded.
					</p>
				</aside>
				<section
					className={`dp-chat ${narrow ? "dp-narrow" : ""}`}
					aria-label="Simulated Discord conversation"
				>
					<div className="dp-channel"># stack-talk</div>
					<div className="dp-message">
						<div className="dp-avatar">a</div>
						<div>
							<b>alp</b>
							<p>{example.ask}</p>
						</div>
					</div>
					<div className="dp-message">
						<div className="dp-avatar dp-bot">AI</div>
						<div className="dp-answer">
							<p className="dp-author">
								AI Stack <span>APP</span>
							</p>
							{active === "A" ? (
								<VariantA example={example} />
							) : active === "B" ? (
								<VariantB example={example} />
							) : (
								<VariantC example={example} />
							)}
							<div className="dp-link">↗ View stack</div>
						</div>
					</div>
				</section>
			</div>
			<section className="dp-inspect">
				<button type="button" onClick={() => setDetails(!details)}>
					{details ? "Hide" : "Inspect"} full reply data
				</button>
				<span>Prototype control. It does not model a Discord interaction.</span>
				{details && (
					<>
						<pre>
							{(example.full ?? example.rows).map(rowText).join("\n") ||
								`${example.value} ${example.unit}`}
						</pre>
						<pre>
							{JSON.stringify(
								{
									variant: active,
									example: key,
									subject: "@alp",
									dates: ["2026-09-05", "2026-09-11"],
									fixture: example,
								},
								null,
								2,
							)}
						</pre>
					</>
				)}
			</section>
			<nav className="dp-switch" aria-label="Prototype variants">
				<button
					type="button"
					onClick={() => cycle(-1)}
					aria-label="Previous variant"
				>
					←
				</button>
				<strong>
					{active} / {names[active]}
				</strong>
				<button
					type="button"
					onClick={() => cycle(1)}
					aria-label="Next variant"
				>
					→
				</button>
			</nav>
		</main>
	);
}
