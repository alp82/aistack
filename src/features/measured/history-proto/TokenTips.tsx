/**
 * PROTOTYPE - tooltip variations for the headline token count.
 * Wayfinder ticket #80, fourth round.
 *
 * "4.71B tokens" means nothing to a reader. Each tip below converts it into
 * something they have held, read, said or walked past. Flip between them with
 * the `tip=` axis on the prototype switcher.
 *
 * Every one of them carries the same footnote, because every one of them rests
 * on the same soft assumption: roughly 0.75 English words per token. The fun is
 * allowed. Pretending to precision is not.
 */
import { cn } from "@/lib/utils";
import { MONO_LABEL } from "../copy";
import { fmtUSD, PROTO_SERIES_COLORS, type ProtoPoint } from "./fixtures";
import {
	EIFFEL_M,
	fmtCount,
	fmtDuration,
	fmtMeters,
	tokenScale,
} from "./tokenScale";

export type TipKey = "plain" | "books" | "time" | "wiki" | "paper" | "all";

export const TIPS: { key: TipKey; label: string }[] = [
	{ key: "plain", label: "plain: what these numbers are" },
	{ key: "books", label: "books: a shelf of novels" },
	{ key: "time", label: "time: years of reading out loud" },
	{ key: "wiki", label: "wikipedia: share of every article" },
	{ key: "paper", label: "paper: printed, stacked, measured" },
	{ key: "all", label: "everything: the whole pile" },
];

export function TokenTip({ point, tip }: { point: ProtoPoint; tip: TipKey }) {
	if (tip === "plain") return <PlainTip point={point} />;
	if (tip === "books") return <BooksTip point={point} />;
	if (tip === "time") return <TimeTip point={point} />;
	if (tip === "wiki") return <WikiTip point={point} />;
	if (tip === "paper") return <PaperTip point={point} />;
	return <EverythingTip point={point} />;
}

// ---------------------------------------------------------------------------
// Shared shell
// ---------------------------------------------------------------------------

function Card({
	title,
	children,
	footnote = true,
}: {
	title: string;
	children: React.ReactNode;
	footnote?: boolean;
}) {
	return (
		<div className="border-[3px] border-stroke-strong bg-bg-panel p-4 shadow-[6px_6px_0_var(--stroke-strong)]">
			<p className="mb-3 border-b-2 border-stroke-strong pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent-lime">
				{title}
			</p>
			{children}
			{footnote && (
				<p className="mt-3 border-t-2 border-dashed border-stroke-subtle pt-2 font-mono text-[10px] leading-relaxed text-fg-muted">
					rough: about 0.75 words per token. Code and cached traffic do not obey
					that, so treat it as a feeling, not a figure.
				</p>
			)}
		</div>
	);
}

function Big({ children }: { children: React.ReactNode }) {
	return (
		<p className="font-mono text-3xl font-black leading-none text-fg-primary">
			{children}
		</p>
	);
}

function Sub({ children }: { children: React.ReactNode }) {
	return (
		<p className="mt-2 text-sm leading-relaxed text-fg-secondary">{children}</p>
	);
}

// ---------------------------------------------------------------------------
// plain: the baseline, no fun facts at all
// ---------------------------------------------------------------------------

function PlainTip({ point }: { point: ProtoPoint }) {
	return (
		<Card title="What these numbers are" footnote={false}>
			<p className="text-sm leading-relaxed text-fg-secondary">
				<span className="font-mono font-bold text-fg-primary">
					{point.tokens.toLocaleString("en-US")}
				</span>{" "}
				tokens, measured between {point.from} and {point.to}.
			</p>
			{point.usd !== null && (
				<p className="mt-2 text-sm leading-relaxed text-fg-secondary">
					<span className="font-bold text-accent-lime">Not money spent.</span>{" "}
					It is what those tokens would cost at public list prices.
				</p>
			)}
		</Card>
	);
}

// ---------------------------------------------------------------------------
// books: a shelf you can picture
// ---------------------------------------------------------------------------

const SPINES = 26;

function BooksTip({ point }: { point: ProtoPoint }) {
	const s = tokenScale(point.tokens);
	const perSpine = s.novels / SPINES;

	return (
		<Card title="In books">
			<Big>{fmtCount(s.novels)} novels</Big>
			<Sub>
				{fmtCount(s.words)} words, at the length of an average novel. That is{" "}
				{fmtCount(s.warAndPeace)} copies of War and Peace, or{" "}
				{fmtCount(s.harryPotter)} runs through all seven Harry Potter books.
			</Sub>

			{/* A shelf. Deterministic heights, so the same count draws the same shelf. */}
			<div className="mt-4 flex h-12 items-end gap-[3px] border-b-2 border-stroke-strong">
				{Array.from({ length: SPINES }, (_, i) => {
					const h = 60 + ((i * 37) % 41);
					return (
						<span
							key={`spine-${i}-${h}`}
							className="flex-1"
							style={{
								height: `${h}%`,
								background: PROTO_SERIES_COLORS[i % PROTO_SERIES_COLORS.length],
								opacity: 0.55 + ((i * 13) % 40) / 100,
							}}
						/>
					);
				})}
			</div>
			<p className={cn(MONO_LABEL, "mt-2 text-[10px] text-fg-muted")}>
				each spine ≈ {fmtCount(perSpine)} novels
			</p>
		</Card>
	);
}

// ---------------------------------------------------------------------------
// time: how long a person would need
// ---------------------------------------------------------------------------

function TimeTip({ point }: { point: ProtoPoint }) {
	const s = tokenScale(point.tokens);
	return (
		<Card title="In human time">
			<Big>{fmtDuration(s.readYears)}</Big>
			<Sub>
				of reading, without sleeping, at a good silent pace. Say it out loud
				instead and it takes {fmtDuration(s.speakYears)}. Type it yourself and
				you need {fmtDuration(s.typeYears)}.
			</Sub>

			<dl className="mt-4 space-y-1.5">
				<TimeRow label="read silently" value={fmtDuration(s.readYears)} />
				<TimeRow label="read out loud" value={fmtDuration(s.speakYears)} />
				<TimeRow label="typed by hand" value={fmtDuration(s.typeYears)} />
			</dl>
		</Card>
	);
}

function TimeRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-baseline justify-between gap-4 border-b border-stroke-subtle pb-1">
			<dt className={cn(MONO_LABEL, "text-fg-muted")}>{label}</dt>
			<dd className="font-mono text-sm font-bold text-fg-primary">{value}</dd>
		</div>
	);
}

// ---------------------------------------------------------------------------
// wiki: the one reference everybody has a size for
// ---------------------------------------------------------------------------

function WikiTip({ point }: { point: ProtoPoint }) {
	const s = tokenScale(point.tokens);
	const over = s.wikipedia >= 1;
	const pct = s.wikipedia * 100;

	return (
		<Card title="Against Wikipedia">
			<Big>
				{over
					? `${s.wikipedia.toFixed(1)}×`
					: `${pct < 1 ? pct.toFixed(2) : pct.toFixed(0)}%`}
			</Big>
			<Sub>
				{over ? (
					<>
						more words than the entire English Wikipedia. Every article, every
						edit war, every list of railway stations, {s.wikipedia.toFixed(1)}{" "}
						times over.
					</>
				) : (
					"of every word in the English Wikipedia. All 7 million articles come to about 4.9 billion words."
				)}
			</Sub>

			<div className="mt-4">
				<div className="h-4 w-full border border-stroke-strong bg-bg-canvas">
					<div
						className="h-full bg-accent-lime"
						style={{ width: `${Math.min(100, pct)}%` }}
					/>
				</div>
				<p
					className={cn(
						MONO_LABEL,
						"mt-2 flex justify-between text-[10px] text-fg-muted",
					)}
				>
					<span>this stack</span>
					<span>all of Wikipedia</span>
				</p>
			</div>
		</Card>
	);
}

// ---------------------------------------------------------------------------
// paper: the physical pile
// ---------------------------------------------------------------------------

function PaperTip({ point }: { point: ProtoPoint }) {
	const s = tokenScale(point.tokens);
	const tall = s.paperMeters >= EIFFEL_M;
	const ratio = s.paperMeters / EIFFEL_M;
	const maxH = 64;
	const stackH = Math.max(2, Math.min(maxH, maxH * Math.min(1, ratio)));
	const towerH = Math.max(2, Math.min(maxH, maxH / Math.max(1, ratio)));

	return (
		<Card title="On paper">
			<Big>{fmtMeters(s.paperMeters)}</Big>
			<Sub>
				printed double-sided, that is {fmtCount(s.pages)} pages in a stack{" "}
				{fmtMeters(s.paperMeters)} tall.{" "}
				{tall ? (
					<>It clears the Eiffel Tower {ratio.toFixed(1)} times over.</>
				) : (
					<>
						The Eiffel Tower is 330 m, so you are {(ratio * 100).toFixed(0)}% of
						the way up.
					</>
				)}
			</Sub>

			<div className="mt-4 flex h-16 items-end gap-6 border-b-2 border-stroke-strong px-2">
				<div className="flex flex-1 flex-col items-center justify-end">
					<span
						className="w-8 bg-accent-lime"
						style={{ height: `${stackH}px` }}
					/>
				</div>
				<div className="flex flex-1 flex-col items-center justify-end">
					<span
						className="w-8"
						style={{
							height: `${towerH}px`,
							backgroundImage:
								"repeating-linear-gradient(135deg, var(--fg-muted) 0 2px, transparent 2px 5px)",
						}}
					/>
				</div>
			</div>
			<p className={cn(MONO_LABEL, "mt-2 flex text-[10px] text-fg-muted")}>
				<span className="flex-1 text-center">the stack</span>
				<span className="flex-1 text-center">Eiffel Tower</span>
			</p>
		</Card>
	);
}

// ---------------------------------------------------------------------------
// everything: no single framing wins, so show the pile
// ---------------------------------------------------------------------------

function EverythingTip({ point }: { point: ProtoPoint }) {
	const s = tokenScale(point.tokens);
	const facts = [
		`${fmtCount(s.words)} words`,
		`${fmtCount(s.novels)} novels`,
		`${fmtCount(s.warAndPeace)} copies of War and Peace`,
		s.wikipedia >= 1
			? `${s.wikipedia.toFixed(1)}× the English Wikipedia`
			: `${(s.wikipedia * 100).toFixed(0)}% of the English Wikipedia`,
		`${fmtDuration(s.speakYears)} of talking without stopping`,
		`${fmtMeters(s.paperMeters)} of paper, printed`,
	];

	return (
		<Card title="Pick a way to feel it">
			<Big>{fmtCount(s.words)}</Big>
			<Sub>words, roughly. Which is also:</Sub>
			<ul className="mt-3 list-none space-y-1 p-0">
				{facts.slice(1).map((f) => (
					<li
						key={f}
						className="flex gap-2 text-sm leading-relaxed text-fg-secondary"
					>
						<span aria-hidden="true" className="text-accent-lime">
							›
						</span>
						{f}
					</li>
				))}
			</ul>
			{point.usd !== null && (
				<p className="mt-3 text-sm leading-relaxed text-fg-secondary">
					<span className="font-bold text-accent-lime">Not money spent.</span>{" "}
					{fmtUSD(point.usd)} is what those tokens would cost at public list
					prices.
				</p>
			)}
		</Card>
	);
}
