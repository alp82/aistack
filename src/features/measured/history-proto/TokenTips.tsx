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
	EiffelTowerIcon,
	HourglassIcon,
	type IconProps,
	RoadIcon,
	WikipediaIcon,
	WizardHatIcon,
} from "./TipIcons";
import {
	EIFFEL_M,
	fmtCount,
	fmtDuration,
	fmtMeters,
	tokenScale,
} from "./tokenScale";

export type TipKey = "books" | "time" | "wiki" | "paper" | "road";

export const TIPS: { key: TipKey; label: string }[] = [
	{ key: "books", label: "books: a shelf of novels" },
	{ key: "time", label: "time: years of reading" },
	{ key: "wiki", label: "wikipedia: share of every article" },
	{ key: "paper", label: "paper: printed and stacked" },
	{ key: "road", label: "road: pages laid end to end" },
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

export type IconLook =
	| "aside"
	| "large"
	| "header"
	| "banner"
	| "watermark"
	| "bleed";

export const ICON_LOOKS: { key: IconLook; label: string }[] = [
	{ key: "aside", label: "48px beside the headline" },
	{ key: "large", label: "76px beside the headline" },
	{ key: "header", label: "small, inline in the title row" },
	{ key: "banner", label: "centered on a full-width band" },
	{ key: "watermark", label: "huge, faint, bleeding off the corner" },
	{ key: "bleed", label: "full width, faint, behind the whole card" },
];

export function TokenTip({
	point,
	tip,
	iconLook = "aside",
}: {
	point: ProtoPoint;
	tip: TipKey;
	iconLook?: IconLook;
}) {
	const body = BODIES[tip];
	const Icon = body.Icon;
	const tokens = point.tokens.toLocaleString("en-US");

	// Only two treatments sit in the headline row. The rest place themselves.
	const headlineIcon =
		iconLook === "aside" ? (
			<Icon size={48} />
		) : iconLook === "large" ? (
			<Icon size={76} />
		) : null;

	return (
		<div className="relative overflow-hidden border-[3px] border-stroke-strong bg-bg-panel p-4 shadow-[6px_6px_0_var(--stroke-strong)]">
			{iconLook === "bleed" && (
				<span
					aria-hidden="true"
					className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-accent-lime opacity-[0.07]"
				>
					<Icon className="h-auto w-full" />
				</span>
			)}
			{iconLook === "watermark" && (
				<span
					aria-hidden="true"
					className="pointer-events-none absolute -bottom-6 -right-6 text-accent-lime opacity-[0.12]"
				>
					<Icon size={150} />
				</span>
			)}

			<p className="relative mb-3 flex items-center gap-2 border-b-2 border-stroke-strong pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent-lime">
				{iconLook === "header" && <Icon size={16} />}
				{body.title}
			</p>

			{iconLook === "banner" && (
				<span
					aria-hidden="true"
					className="relative mb-4 flex items-center justify-center border border-stroke-subtle bg-bg-canvas py-3 text-accent-lime"
				>
					<Icon size={56} />
				</span>
			)}

			<div className="relative">{body.render(point, headlineIcon)}</div>

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
					rough: about 0.75 words per token.
				</p>
			</div>
		</div>
	);
}

/** The headline number, and its mark when the treatment puts one here. */
function Headline({
	children,
	icon,
}: {
	children: React.ReactNode;
	icon: React.ReactNode;
}) {
	return (
		<div className="flex items-start justify-between gap-4">
			<p className="font-mono text-3xl font-black leading-none text-fg-primary">
				{children}
			</p>
			{icon && (
				<span aria-hidden="true" className="shrink-0 text-accent-lime">
					{icon}
				</span>
			)}
		</div>
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
	/** `icon` is whatever the treatment wants placed in the headline row. */
	render: (point: ProtoPoint, icon: React.ReactNode) => React.ReactNode;
};

const BODIES: Record<TipKey, Body> = {
	books: {
		title: "In books",
		Icon: WizardHatIcon,
		render: (p, icon) => <BooksBody point={p} icon={icon} />,
	},
	time: {
		title: "In human time",
		Icon: HourglassIcon,
		render: (p, icon) => <TimeBody point={p} icon={icon} />,
	},
	wiki: {
		title: "Against Wikipedia",
		Icon: WikipediaIcon,
		render: (p, icon) => <WikiBody point={p} icon={icon} />,
	},
	paper: {
		title: "On paper",
		Icon: EiffelTowerIcon,
		render: (p, icon) => <PaperBody point={p} icon={icon} />,
	},
	road: {
		title: "End to end",
		Icon: RoadIcon,
		render: (p, icon) => <RoadBody point={p} icon={icon} />,
	},
};

type BodyProps = { point: ProtoPoint; icon: React.ReactNode };

const SPINES = 26;

function BooksBody({ point, icon }: BodyProps) {
	const s = tokenScale(point.tokens);
	return (
		<>
			<Headline icon={icon}>{fmtCount(s.novels)} novels</Headline>
			<Sub>
				{fmtCount(s.words)} words, at the length of an average novel. Read all
				seven Harry Potter books back to back and you would have to do it{" "}
				{fmtCount(s.harryPotter)} times over.
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

function TimeBody({ point, icon }: BodyProps) {
	const s = tokenScale(point.tokens);
	return (
		<>
			<Headline icon={icon}>{fmtDuration(s.readYears)}</Headline>
			<Sub>
				of reading, at a good silent pace, without ever stopping to sleep.
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

function WikiBody({ point, icon }: BodyProps) {
	const s = tokenScale(point.tokens);
	const over = s.wikipedia >= 1;
	const pct = s.wikipedia * 100;
	return (
		<>
			<Headline icon={icon}>
				{over
					? `${s.wikipedia.toFixed(1)}x`
					: `${pct < 1 ? pct.toFixed(2) : pct.toFixed(0)}%`}
			</Headline>
			<Sub>
				{over
					? `more words than the whole English Wikipedia. Every article, every edit war, every list of railway stations, ${s.wikipedia.toFixed(1)} times over.`
					: "of every word in the English Wikipedia. All 7 million articles come to about 4.9 billion words."}
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
		</>
	);
}

function PaperBody({ point, icon }: BodyProps) {
	const s = tokenScale(point.tokens);
	const ratio = s.paperMeters / EIFFEL_M;
	const maxH = 64;
	const stackH = Math.max(2, Math.min(maxH, maxH * Math.min(1, ratio)));
	const towerH = Math.max(2, Math.min(maxH, maxH / Math.max(1, ratio)));

	return (
		<>
			<Headline icon={icon}>{fmtMeters(s.paperMeters)}</Headline>
			<Sub>
				printed double-sided, {fmtCount(s.pages)} pages make a stack that tall.{" "}
				{ratio >= 1
					? `It clears the Eiffel Tower ${ratio.toFixed(1)} times over.`
					: `The Eiffel Tower is 330 m, so it reaches ${(ratio * 100).toFixed(0)}% of the way up.`}
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

function RoadBody({ point, icon }: BodyProps) {
	const s = tokenScale(point.tokens);
	return (
		<>
			<Headline icon={icon}>{fmtMeters(s.roadMeters)}</Headline>
			<Sub>
				of paper, if you laid every printed page end to end along the ground.{" "}
				{s.marathons >= 1
					? `That is ${fmtCount(s.marathons)} marathons of reading material.`
					: "That is not yet a marathon, but it is a long walk."}
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
				a marathon is 42.2 km
			</p>
		</>
	);
}
