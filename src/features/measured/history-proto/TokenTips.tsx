/**
 * PROTOTYPE - the headline popup. Wayfinder ticket #80, fifth round.
 *
 * "4.71B tokens" means nothing to a reader, so every card converts it into
 * something they have held, read, said or walked past. One framing at a time,
 * never a pile of them, and the dice button on the block deals the next one.
 *
 * THE SHELL CARRIES THE FACTS, THE BODY CARRIES THE FEELING. Every card opens
 * with the full token count and the window, and closes with the price caveat
 * and the words-per-token rule. That is what the old "plain" card used to say
 * on its own, so it no longer needs to be a card.
 *
 * Every framing rests on the same soft assumption: roughly 0.75 English words
 * per token. The fun is allowed. Pretending to precision is not.
 */
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MONO_LABEL } from "../copy";
import { fmtUSD, PROTO_SERIES_COLORS, type ProtoPoint } from "./fixtures";
import {
	BoltIcon,
	BookClockIcon,
	DramaMasksIcon,
	EarthIcon,
	EiffelTowerIcon,
	FeatherIcon,
	FloppyIcon,
	HourglassIcon,
	type IconProps,
	KeyboardIcon,
	MessageIcon,
	MovieIcon,
	PineTreeIcon,
	RoadIcon,
	WikipediaIcon,
	WizardHatIcon,
} from "./TipIcons";
import {
	EARTH_KM,
	EIFFEL_M,
	fmtBytes,
	fmtCount,
	fmtDuration,
	fmtKm,
	fmtMeters,
	tokenScale,
} from "./tokenScale";

export type TipKey =
	| "books"
	| "time"
	| "wiki"
	| "paper"
	| "road"
	| "keys"
	| "floppy"
	| "bard"
	| "scribe"
	| "texts"
	| "trees"
	| "power"
	| "lifetimes"
	| "equator"
	| "video";

export const TIPS: { key: TipKey; label: string }[] = [
	{ key: "books", label: "books: a shelf of novels" },
	{ key: "time", label: "time: years of reading" },
	{ key: "wiki", label: "wikipedia: share of every article" },
	{ key: "paper", label: "paper: printed and stacked" },
	{ key: "road", label: "road: pages laid end to end" },
	{ key: "keys", label: "keys: keyboards worn out typing it" },
	{ key: "floppy", label: "floppy: the stack of disks it fills" },
	{ key: "bard", label: "bard: times over all of Shakespeare" },
	{ key: "scribe", label: "scribe: centuries of copying by hand" },
	{ key: "texts", label: "texts: messages at 160 characters" },
	{ key: "trees", label: "trees: what printing it would fell" },
	{ key: "power", label: "power: the electricity it took" },
	{ key: "lifetimes", label: "lifetimes: whole reading lives" },
	{ key: "equator", label: "equator: one line around the Earth" },
	{ key: "video", label: "video: hours of full HD footage" },
];

const TIP_KEYS = TIPS.map((t) => t.key);

// ---------------------------------------------------------------------------
// The deck
// ---------------------------------------------------------------------------

function shuffled<T>(items: T[]): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/**
 * One shuffled deck per page load, walked in order and looped.
 *
 * The shuffle happens in an effect, never in render, so the server and the
 * first client render agree and hydration stays quiet. The deck's order is not
 * rendered anywhere before that effect runs, so the swap is invisible.
 *
 * `pinned` comes from the prototype switcher and takes over completely, which
 * is how a single framing gets inspected without fighting the dice.
 */
export function useTipDeck(pinned?: TipKey) {
	const [deck, setDeck] = useState<TipKey[]>(TIP_KEYS);
	const [dealt, setDealt] = useState(0);

	useEffect(() => {
		setDeck(shuffled(TIP_KEYS));
		setDealt(0);
	}, []);

	const next = useCallback(() => setDealt((n) => n + 1), []);
	const index = dealt % deck.length;

	return {
		tip: pinned ?? deck[index],
		index,
		total: deck.length,
		next,
		/** False when the switcher has pinned one framing. */
		shuffling: !pinned,
	};
}

// ---------------------------------------------------------------------------
// The card
// ---------------------------------------------------------------------------

export function TokenTip({ point, tip }: { point: ProtoPoint; tip: TipKey }) {
	const body = BODIES[tip];
	const Icon = body.Icon;
	const tokens = point.tokens.toLocaleString("en-US");

	return (
		<div className="relative overflow-hidden border-[3px] border-stroke-strong bg-bg-panel p-4 shadow-[6px_6px_0_var(--stroke-strong)]">
			{/* The mark is a WATERMARK and nothing else. Every treatment that took
			    layout space pushed the card's content around, and the content is the
			    point. Pinned top right, bleeding past the padding, behind the text. */}
			<span
				aria-hidden="true"
				className="pointer-events-none absolute -right-5 -top-5 text-accent-lime opacity-20"
			>
				<Icon size={150} />
			</span>

			<p className="relative mb-3 border-b-2 border-stroke-strong pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent-lime">
				{body.title}
			</p>

			<div className="relative">{body.render(point)}</div>

			{/* The exact count is no longer a header of its own. It reads better as
			    the subject of the disclaimer, which is the one line that has to name
			    it precisely anyway. */}
			<div className="relative mt-7 space-y-1.5 border-t-2 border-dashed border-stroke-subtle pt-5">
				{point.usd !== null ? (
					<p className="text-xs leading-relaxed text-fg-secondary">
						<span className="font-bold text-accent-lime">Not money spent.</span>{" "}
						{fmtUSD(point.usd)} is what{" "}
						<span className="font-mono font-bold text-fg-primary">
							{tokens}
						</span>{" "}
						tokens would cost at public list prices.
					</p>
				) : (
					<p className="text-xs leading-relaxed text-fg-secondary">
						<span className="font-mono font-bold text-fg-primary">
							{tokens}
						</span>{" "}
						tokens. This stack does not publish a cost.
					</p>
				)}
				<p className="font-mono text-[10px] leading-relaxed text-fg-muted">
					{body.note ?? "rough: about 0.75 words per token."}
				</p>
			</div>
		</div>
	);
}

function Headline({ children }: { children: React.ReactNode }) {
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
// The framings. One comparison each, never two - a card that offers a choice
// of yardsticks makes the reader do the work the card was supposed to do.
// ---------------------------------------------------------------------------

type Body = {
	title: string;
	Icon: (props: IconProps) => React.ReactNode;
	render: (point: ProtoPoint) => React.ReactNode;
	/** Replaces the words-per-token caveat when a card rests on something else. */
	note?: string;
};

const BODIES: Record<TipKey, Body> = {
	books: {
		title: "In books",
		Icon: WizardHatIcon,
		render: (p) => <BooksBody point={p} />,
	},
	time: {
		title: "In human time",
		Icon: HourglassIcon,
		render: (p) => <TimeBody point={p} />,
	},
	wiki: {
		title: "Against Wikipedia",
		Icon: WikipediaIcon,
		render: (p) => <WikiBody point={p} />,
	},
	paper: {
		title: "On paper",
		Icon: EiffelTowerIcon,
		render: (p) => <PaperBody point={p} />,
	},
	road: {
		title: "End to end",
		Icon: RoadIcon,
		render: (p) => <RoadBody point={p} />,
	},
	keys: {
		title: "In keyboards",
		Icon: KeyboardIcon,
		render: (p) => <KeysBody point={p} />,
	},
	floppy: {
		title: "On floppy disks",
		Icon: FloppyIcon,
		render: (p) => <FloppyBody point={p} />,
	},
	bard: {
		title: "Against Shakespeare",
		Icon: DramaMasksIcon,
		render: (p) => <BardBody point={p} />,
	},
	scribe: {
		title: "Copied by hand",
		Icon: FeatherIcon,
		render: (p) => <ScribeBody point={p} />,
	},
	texts: {
		title: "In text messages",
		Icon: MessageIcon,
		render: (p) => <TextsBody point={p} />,
	},
	trees: {
		title: "In trees",
		Icon: PineTreeIcon,
		render: (p) => <TreesBody point={p} />,
	},
	power: {
		title: "In electricity",
		Icon: BoltIcon,
		render: (p) => <PowerBody point={p} />,
		note: "very rough: about 0.3 Wh per 1,000 tokens. No vendor publishes a per-token figure, and the real one swings by an order of magnitude with the model and the hardware.",
	},
	lifetimes: {
		title: "In reading lifetimes",
		Icon: BookClockIcon,
		render: (p) => <LifetimesBody point={p} />,
	},
	equator: {
		title: "Around the Earth",
		Icon: EarthIcon,
		render: (p) => <EquatorBody point={p} />,
	},
	video: {
		title: "As video",
		Icon: MovieIcon,
		render: (p) => <VideoBody point={p} />,
		note: "vision math, not words: a frame costs ceil(w/28) x ceil(h/28) visual tokens, so 1920x1080 is 2,691. Video is read as still frames sampled about once a second.",
	},
};

type BodyProps = { point: ProtoPoint };

const SPINES = 26;

/** The one phrase in a card's prose the reader is meant to leave with. */
function Key({ children }: { children: React.ReactNode }) {
	return <strong className="font-bold text-fg-primary">{children}</strong>;
}

/**
 * A bar that survives values over 100%.
 *
 * The track is the LARGER of the value and its reference, so a stack at 1.3
 * laps of the Earth fills the whole bar and the hatched notch marks where one
 * lap falls. A bar clamped at 100% said "1.3 laps" over a full bar, which is
 * the same picture it draws for 74 laps.
 */
function RatioBar({
	ratio,
	leftLabel,
	rightLabel,
}: {
	ratio: number;
	leftLabel: string;
	rightLabel: string;
}) {
	const scale = Math.max(1, ratio);
	const fill = (ratio / scale) * 100;
	const mark = (1 / scale) * 100;
	const over = ratio > 1;

	return (
		<div className="mt-4">
			<div className="relative h-4 w-full border border-stroke-strong bg-bg-canvas">
				<div
					className="absolute inset-y-0 left-0 bg-accent-lime"
					style={{ width: `${fill}%` }}
				/>
				{over && (
					<span
						aria-hidden="true"
						className="absolute -top-1 -bottom-1 w-[5px] -translate-x-1/2"
						style={{
							left: `${mark}%`,
							backgroundImage:
								"repeating-linear-gradient(135deg, var(--fg-primary) 0 2px, var(--bg-canvas) 2px 4px)",
						}}
					/>
				)}
			</div>
			<p
				className={cn(
					MONO_LABEL,
					"mt-2 flex justify-between text-[10px] text-fg-muted",
				)}
			>
				<span>{leftLabel}</span>
				<span>{over ? `notch = ${rightLabel}` : rightLabel}</span>
			</p>
		</div>
	);
}

function BooksBody({ point }: BodyProps) {
	const s = tokenScale(point.tokens);
	return (
		<>
			<Headline>{fmtCount(s.novels)} novels</Headline>
			<Sub>
				{fmtCount(s.words)} words, at the length of an average novel. Read all
				seven Harry Potter books back to back and you would have to do it{" "}
				<Key>{fmtCount(s.harryPotter)} times over</Key>.
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
				each spine is about {fmtCount(s.novels / SPINES)} novels
			</p>
		</>
	);
}

function TimeBody({ point }: BodyProps) {
	const s = tokenScale(point.tokens);
	return (
		<>
			<Headline>{fmtDuration(s.readYears)}</Headline>
			<Sub>
				of reading, at a good silent pace,{" "}
				<Key>without ever stopping to sleep</Key>.
			</Sub>

			<dl className="mt-4 space-y-1.5">
				<TimeRow label="read silently" value={fmtDuration(s.readYears)} />
				<TimeRow label="read out loud" value={fmtDuration(s.speakYears)} />
				<TimeRow label="typed by hand" value={fmtDuration(s.typeYears)} />
			</dl>
		</>
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

function WikiBody({ point }: BodyProps) {
	const s = tokenScale(point.tokens);
	const over = s.wikipedia >= 1;
	const pct = s.wikipedia * 100;
	return (
		<>
			<Headline>
				{over
					? `${s.wikipedia.toFixed(1)}x`
					: `${pct < 1 ? pct.toFixed(2) : pct.toFixed(0)}%`}
			</Headline>
			<Sub>
				{over ? (
					<>
						more words than the whole English Wikipedia. Every article, every
						edit war, every list of railway stations,{" "}
						<Key>{s.wikipedia.toFixed(1)} times over</Key>.
					</>
				) : (
					<>
						of every word in the English Wikipedia. All 7 million articles come
						to <Key>about 4.9 billion words</Key>.
					</>
				)}
			</Sub>

			<RatioBar
				ratio={s.wikipedia}
				leftLabel="this stack"
				rightLabel="all of Wikipedia"
			/>
		</>
	);
}

function PaperBody({ point }: BodyProps) {
	const s = tokenScale(point.tokens);
	const ratio = s.paperMeters / EIFFEL_M;
	const maxH = 64;
	const stackH = Math.max(2, Math.min(maxH, maxH * Math.min(1, ratio)));
	const towerH = Math.max(2, Math.min(maxH, maxH / Math.max(1, ratio)));

	return (
		<>
			<Headline>{fmtMeters(s.paperMeters)}</Headline>
			<Sub>
				printed double-sided, {fmtCount(s.pages)} pages make a stack that tall.{" "}
				{ratio >= 1 ? (
					<>
						It <Key>clears the Eiffel Tower {ratio.toFixed(1)} times over</Key>.
					</>
				) : (
					<>
						The Eiffel Tower is 330 m, so it reaches{" "}
						<Key>{(ratio * 100).toFixed(0)}% of the way up</Key>.
					</>
				)}
			</Sub>

			<div className="mt-4 flex h-16 items-end gap-6 border-b-2 border-stroke-strong px-2">
				<span className="flex flex-1 justify-center">
					<span
						className="w-8 bg-accent-lime"
						style={{ height: `${stackH}px` }}
					/>
				</span>
				<span className="flex flex-1 justify-center">
					<span
						className="w-8"
						style={{
							height: `${towerH}px`,
							backgroundImage:
								"repeating-linear-gradient(135deg, var(--fg-muted) 0 2px, transparent 2px 5px)",
						}}
					/>
				</span>
			</div>
			<p className={cn(MONO_LABEL, "mt-2 flex text-[10px] text-fg-muted")}>
				<span className="flex-1 text-center">the stack</span>
				<span className="flex-1 text-center">Eiffel Tower</span>
			</p>
		</>
	);
}

function RoadBody({ point }: BodyProps) {
	const s = tokenScale(point.tokens);
	return (
		<>
			<Headline>
				{s.marathons >= 1
					? `${fmtCount(s.marathons)} marathons`
					: "under one marathon"}
			</Headline>
			<Sub>
				of paper, if you laid every printed page end to end along the ground.
				That comes to <Key>{fmtKm(s.roadMeters / 1000)}</Key>, and a marathon is
				42.2 km.
			</Sub>

			{/* A road. The dashes are the pages. */}
			<div className="mt-4 h-8 border-y-2 border-stroke-strong bg-bg-canvas">
				<div
					className="h-full w-full"
					style={{
						backgroundImage:
							"repeating-linear-gradient(90deg, var(--accent-lime) 0 10px, transparent 10px 22px)",
						opacity: 0.8,
					}}
				/>
			</div>
			<p className={cn(MONO_LABEL, "mt-2 text-[10px] text-fg-muted")}>
				every dash is a page
			</p>
		</>
	);
}

// --- the second wave -------------------------------------------------------

function KeysBody({ point }: BodyProps) {
	const s = tokenScale(point.tokens);
	return (
		<>
			<Headline>
				{s.keyboards >= 1
					? `${fmtCount(s.keyboards)} keyboards`
					: "one keyboard"}
			</Headline>
			<Sub>
				worn out typing it. Every character by hand comes to{" "}
				<Key>{fmtCount(s.keystrokes)} keystrokes</Key>, and a switch is rated
				for about 50 million presses
				{s.keyboards >= 1
					? "."
					: `, so this would use up ${Math.round(s.keyboards * 100)}% of one.`}
			</Sub>
		</>
	);
}

function FloppyBody({ point }: BodyProps) {
	const s = tokenScale(point.tokens);
	return (
		<>
			<Headline>{fmtCount(s.floppies)} floppies</Headline>
			<Sub>
				As plain text the whole thing is <Key>{fmtBytes(s.bytes)}</Key>. The
				last floppy disks were made in 2011, so you would be buying them second
				hand.
			</Sub>
		</>
	);
}

function BardBody({ point }: BodyProps) {
	const s = tokenScale(point.tokens);
	return (
		<>
			<Headline>{fmtCount(s.shakespeare)} times</Headline>
			<Sub>
				the complete works of Shakespeare. Every play and every sonnet he wrote
				comes to about 885,000 words, and this is{" "}
				<Key>{fmtCount(s.shakespeare)} of those</Key>.
			</Sub>
		</>
	);
}

function ScribeBody({ point }: BodyProps) {
	const s = tokenScale(point.tokens);
	const startYear = Math.round(2026 - s.scribeYears);
	return (
		<>
			<Headline>{fmtDuration(s.scribeYears)}</Headline>
			<Sub>
				of a medieval scribe copying 3,000 words a day, every working day.
				{s.scribeYears >= 100 && (
					<>
						{" "}
						To have finished by now, they would have had to{" "}
						<Key>
							start in{" "}
							{startYear < 0
								? `${Math.abs(startYear)} BC`
								: `the year ${startYear}`}
						</Key>
						.
					</>
				)}
			</Sub>
		</>
	);
}

function TextsBody({ point }: BodyProps) {
	const s = tokenScale(point.tokens);
	const yearsAtOnePerMinute = s.texts / (60 * 24 * 365);
	return (
		<>
			<Headline>{fmtCount(s.texts)} texts</Headline>
			<Sub>
				at 160 characters each. Send one every minute, day and night, and you
				would be at it for <Key>{fmtDuration(yearsAtOnePerMinute)}</Key>.
			</Sub>
		</>
	);
}

function TreesBody({ point }: BodyProps) {
	const s = tokenScale(point.tokens);
	return (
		<>
			<Headline>
				{s.trees >= 1 ? `${fmtCount(s.trees)} trees` : "under one tree"}
			</Headline>
			<Sub>
				if every page were really printed, double-sided. One tree gives about
				8,300 sheets of A4, and this needs{" "}
				<Key>{fmtCount(s.pages / 2)} of them</Key>.
			</Sub>
		</>
	);
}

function PowerBody({ point }: BodyProps) {
	const s = tokenScale(point.tokens);
	return (
		<>
			<Headline>{fmtCount(s.kwh)} kWh</Headline>
			<Sub>
				of electricity, give or take a lot. The same charge would drive an
				electric car <Key>{fmtKm(s.evKm)}</Key>
				{s.homeYears >= 1 / 24 ? (
					<>
						, or run a European home for <Key>{fmtDuration(s.homeYears)}</Key>.
					</>
				) : (
					"."
				)}
			</Sub>
		</>
	);
}

function LifetimesBody({ point }: BodyProps) {
	const s = tokenScale(point.tokens);
	return (
		<>
			<Headline>
				{s.readingLifetimes >= 1
					? `${fmtCount(s.readingLifetimes)} lifetimes`
					: `${Math.round(s.readingLifetimes * 100)}% of a lifetime`}
			</Headline>
			<Sub>
				of reading. Somebody who finishes a book a month for sixty years gets
				through about <Key>720 books</Key>, and this is {fmtCount(s.novels)}{" "}
				novels.
			</Sub>
		</>
	);
}

function EquatorBody({ point }: BodyProps) {
	const s = tokenScale(point.tokens);
	const pct = s.earthLaps * 100;
	return (
		<>
			<Headline>
				{s.earthLaps >= 1
					? `${s.earthLaps.toFixed(1)} laps`
					: `${pct < 1 ? pct.toFixed(2) : pct.toFixed(0)}% of a lap`}
			</Headline>
			<Sub>
				of the Earth. Set every character in one unbroken line of monospace and
				it runs <Key>{fmtKm(s.lineKm)}</Key>. The equator is{" "}
				{EARTH_KM.toLocaleString("en-US")} km.
			</Sub>

			<RatioBar
				ratio={s.earthLaps}
				leftLabel="this stack"
				rightLabel="once around"
			/>
		</>
	);
}

/**
 * The one card that does not run on words per token.
 *
 * The first version of this card converted words into film SCRIPTS and then
 * reported the running time of those films, which is a modality jump: reading a
 * screenplay is not watching the film. This one stays in one modality. A model
 * reads video as sampled still frames, each frame costs real visual tokens, so
 * "how much video would this many tokens buy" is a question the same number can
 * actually answer.
 */
function VideoBody({ point }: BodyProps) {
	const s = tokenScale(point.tokens);
	// Hours, not the shared duration formatter: video is the one card where the
	// natural unit is smaller than a day.
	const runtime =
		s.videoHours >= 2
			? `${fmtCount(s.videoHours)} hours`
			: `${Math.round(s.videoHours * 60)} minutes`;
	return (
		<>
			<Headline>{runtime}</Headline>
			<Sub>
				of full HD video, or{" "}
				<Key>
					{s.lotrTrilogies >= 1
						? `${fmtCount(s.lotrTrilogies)} runs through the extended Lord of the Rings trilogy`
						: `${Math.round(s.lotrTrilogies * 100)}% of the extended Lord of the Rings trilogy`}
				</Key>
				.
			</Sub>

			<dl className="mt-4 space-y-1.5">
				<TimeRow label="frames read" value={fmtCount(s.videoFrames)} />
				<TimeRow label="tokens per frame" value="2,691" />
				{s.videoHours >= 24 && (
					<TimeRow
						label="watched non-stop"
						value={fmtDuration(s.videoHours / 24 / 365)}
					/>
				)}
			</dl>
		</>
	);
}
