/**
 * PROTOTYPE — the minimal public display of the measured layer
 * ---------------------------------------------------------------------------
 * Wayfinder ticket #40 (map #29). THROWAWAY.
 *
 * Sub-shape A: these mount on the REAL stack page (`/stacks/$slug`), because a
 * measured band in a vacuum always looks fine — the question is whether it
 * survives being next to the hero, Projects, Tools and Workflow.
 *
 *   http://localhost:3019/stacks/<slug>?hero=H1&mstate=full
 *
 * ROUND 1 (settled): the owner picked A+B. Round 1's `?measured=A|B|C` axis is
 * gone; the live axis is now `?hero=` (see measured-hero.tsx), and VariantB
 * below mounts unconditionally as journey section 02. VariantA and VariantC
 * are kept here as the primary source for the decision, not as live code.
 *
 * TWO AXES, both in the URL:
 *
 *   ?hero=      H1 | H2 | H3 | off   — how A folds into the hero
 *   ?mstate=    full | nocost | degraded | stale | none
 *
 * THE VARIANTS disagree about what kind of thing the measured layer IS:
 *
 *   A  RECEIPT   — a stamp on the hero. The measured layer is credibility
 *                  furniture attached to the stack's identity, not content.
 *                  No new section; the page's journey is untouched.
 *   B  LEDGER    — a numbered journey section of its own. The measured layer
 *                  is content: a reading, dated, with the model split.
 *   C  EVIDENCE  — no block anywhere. The measured layer annotates what the
 *                  stack ALREADY CLAIMS, model by model, and is willing to say
 *                  "listed, but not seen in the last 30 days".
 *
 * THE CORE DESIGN QUESTION (from the ticket): the cost figure MOVES between
 * scans minutes apart ($5,407 -> $5,433 -> $5,453) purely because transcripts
 * keep landing. Each variant frames that differently:
 *
 *   A  the stamp carries a timestamp, so the number is "as of then" — a
 *      receipt is expected to be a moment, not a total.
 *   B  the number is an odometer reading over an explicitly ROLLING window;
 *      the window moving is the point, and it is stated in words.
 *   C  there is no single headline number to be unstable, only per-model
 *      evidence — movement is distributed and invisible.
 *
 * DATA IS REAL. `measured-fixture.json` was produced by the shipped analyzer
 * (packages/cli/src/transcripts) against the owner's own ~/.claude history on
 * 2026-07-26 — 382 sessions, 4.27B tokens, 6 models, $5,840 at API prices,
 * fail-closed filtering applied. The withheld counts are real too.
 *
 * WHAT EVERY VARIANT MUST HONOUR (#33 / #42, checked by the states):
 *   - coverage: SILENT when the scan was clean, caveat when degraded.
 *   - a cost figure never appears without its pricing table version.
 *   - apiEquivalentUSD may be ABSENT — must read complete, not broken.
 *   - catalogSlug: null renders as the raw model id, never as an error.
 *   - withheld -> "kept private", shown when non-zero, NEVER a percentage.
 *   - freshness comes from receivedAt (server clock), not capturedAt.
 * ---------------------------------------------------------------------------
 */
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import raw from "./measured-fixture.json";

// ---------------------------------------------------------------------------
// The shape `measured.getCurrentByStackSlug` actually returns (#38, shipped).
// ---------------------------------------------------------------------------

type Model = {
	id: string;
	catalogSlug: string | null;
	catalogName: string | null;
	tokenShare: number;
	tokens: {
		input: number;
		output: number;
		cacheWrite: number;
		cacheRead: number;
	};
	apiEquivalentUSD?: number;
};

export type Snapshot = {
	capturedAt: number;
	receivedAt: number;
	isFresh: boolean;
	window: { days: number; from: string; to: string };
	harness: { name: string; version: string | null };
	pricingTable: string | null;
	activity: {
		sessions: number;
		activeDays: number;
		projects: number;
		totalTokens: number;
		cacheHitShare: number;
		subagentShare: number;
	};
	models: Model[];
	inventory: {
		withheld: Record<string, number>;
		[k: string]: unknown;
	};
	coverage: {
		filesScanned: number;
		filesUnreadable: number;
		linesParsed: number;
		linesFailed: number;
	};
};

const HOUR = 3600_000;
const DAY = 24 * HOUR;

// The catalog knows sonnet/opus/haiku; it does NOT know `claude-fable-5`, so
// that row exercises the `catalogSlug: null` rule for real.
const CATALOG: Record<string, string> = {
	"claude-opus-5": "Claude Opus 5",
	"claude-opus-4-8": "Claude Opus 4.8",
	"claude-sonnet-5": "Claude Sonnet 5",
	"claude-sonnet-4-6": "Claude Sonnet 4.6",
	"claude-haiku-4-5": "Claude Haiku 4.5",
};

export type MState = "full" | "nocost" | "degraded" | "stale" | "none";

export function buildSnapshot(state: MState): Snapshot | null {
	if (state === "none") return null;
	const now = Date.now();
	const p = raw as unknown as Snapshot & { models: Model[] };

	const models: Model[] = p.models.map((m) => ({
		...m,
		catalogSlug: CATALOG[m.id] ? m.id : null,
		catalogName: CATALOG[m.id] ?? null,
		apiEquivalentUSD: state === "nocost" ? undefined : m.apiEquivalentUSD,
	}));

	const receivedAt = state === "stale" ? now - 19 * DAY : now - 2 * HOUR;

	return {
		...p,
		models,
		capturedAt: receivedAt - 40_000,
		receivedAt,
		isFresh: now - receivedAt <= 7 * DAY,
		pricingTable: state === "nocost" ? null : p.pricingTable,
		coverage:
			state === "degraded"
				? {
						filesScanned: 3015,
						filesUnreadable: 61,
						linesParsed: 232058,
						linesFailed: 4192,
					}
				: p.coverage,
	};
}

// ---------------------------------------------------------------------------
// Formatting — the vocabulary locked in #39 is binding here.
//   measured layer -> "from your machine" / "from this machine" (public voice)
//   harness -> "Claude Code"    |    API-equivalent USD -> "at API prices"
// ---------------------------------------------------------------------------

export function fmtTokens(n: number): string {
	if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
	if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
	if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
	return String(n);
}

export function fmtUSD(n: number): string {
	return `$${Math.round(n).toLocaleString("en-US")}`;
}

/** Total cost, or null when publishCost is off — NEVER 0 (#33 decision 11). */
export function totalUSD(s: Snapshot): number | null {
	const priced = s.models.filter((m) => m.apiEquivalentUSD !== undefined);
	if (priced.length === 0) return null;
	return priced.reduce((a, m) => a + (m.apiEquivalentUSD ?? 0), 0);
}

export function ago(ms: number): string {
	const d = Date.now() - ms;
	if (d < HOUR) return `${Math.max(1, Math.round(d / 60_000))} min ago`;
	if (d < DAY) return `${Math.round(d / HOUR)}h ago`;
	return `${Math.round(d / DAY)} days ago`;
}

export function modelLabel(m: Model): string {
	// catalogSlug: null is not an error — it is a model the catalog has not
	// caught up with yet, and its tokens are real. Show the raw id.
	return m.catalogName ?? m.id;
}

/** Non-zero withheld counts only, as plain words. Never a percentage (#42). */
export function keptPrivate(s: Snapshot): string | null {
	const labels: Record<string, string> = {
		builtinTools: "built-in tools",
		mcpServers: "MCP servers",
		skills: "skills",
		subagents: "subagents",
		slashCommands: "commands",
	};
	const parts = Object.entries(s.inventory.withheld)
		.filter(([, n]) => n > 0)
		.map(([k, n]) => `${n} ${labels[k] ?? k}`);
	return parts.length ? parts.join(", ") : null;
}

/** Silent when the scan was clean; a caveat only when it was degraded (#33). */
export function coverageCaveat(s: Snapshot): string | null {
	const { filesUnreadable, linesFailed, filesScanned, linesParsed } =
		s.coverage;
	if (filesUnreadable === 0 && linesFailed / Math.max(1, linesParsed) < 0.001)
		return null;
	const bits: string[] = [];
	if (filesUnreadable > 0)
		bits.push(`${filesUnreadable} of ${filesScanned} files couldn't be read`);
	if (linesFailed > 0) bits.push(`${linesFailed} lines didn't parse`);
	return `Partial read — ${bits.join(", ")}. The numbers below are a floor.`;
}

const MONO = "font-mono uppercase tracking-wider";

// ===========================================================================
// VARIANT A — RECEIPT
// A stamp under the hero. The measured layer is an attribute of the stack's
// identity, not a chapter in its story. Collapsed by default; the model split
// is one click away. The page's journey is left completely alone.
// ===========================================================================

export function VariantA({ snapshot }: { snapshot: Snapshot | null }) {
	const [open, setOpen] = useState(false);
	// Never-synced stacks get NOTHING here. A hero stamp that says "unverified"
	// would turn the absence of a CLI install into a public demerit on every
	// stack but one — which is every stack, for a while.
	if (!snapshot) return null;

	const cost = totalUSD(snapshot);
	const caveat = coverageCaveat(snapshot);
	const priv = keptPrivate(snapshot);

	return (
		<div className="bg-bg-canvas px-6 pb-10">
			<div className="mx-auto max-w-7xl">
				<div className="border-y border-accent-lime/40 bg-accent-lime/5">
					<button
						type="button"
						onClick={() => setOpen((v) => !v)}
						className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 text-left hover:bg-accent-lime/10"
					>
						<span
							className={cn(MONO, "text-[11px] font-bold text-accent-lime")}
						>
							// from this machine
						</span>
						<span className="font-mono text-sm text-fg-primary">
							{snapshot.activity.sessions.toLocaleString()} sessions
						</span>
						<Dot />
						<span className="font-mono text-sm text-fg-primary">
							{fmtTokens(snapshot.activity.totalTokens)} tokens
						</span>
						{cost !== null && (
							<>
								<Dot />
								<span className="font-mono text-sm font-bold text-fg-primary">
									≈{fmtUSD(cost)} at API prices
								</span>
							</>
						)}
						<span className="ml-auto flex items-center gap-2">
							<span className={cn(MONO, "text-[11px] text-fg-muted")}>
								last {snapshot.window.days} days · checked{" "}
								{ago(snapshot.receivedAt)}
							</span>
							<ChevronDown
								className={cn(
									"size-4 text-fg-muted transition-transform",
									open && "rotate-180",
								)}
							/>
						</span>
					</button>

					{open && (
						<div className="border-t border-accent-lime/25 px-5 py-4">
							<p className="mb-4 max-w-2xl text-sm text-fg-muted">
								Read from Claude Code on the machine this stack is built on,
								covering a rolling {snapshot.window.days} days ({" "}
								{snapshot.window.from} → {snapshot.window.to} ). It moves as
								the window moves.
							</p>
							<div className="space-y-2">
								{snapshot.models.map((m) => (
									<ModelRow key={m.id} m={m} />
								))}
							</div>
							<Footnotes
								snapshot={snapshot}
								cost={cost}
								caveat={caveat}
								priv={priv}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function Dot() {
	return <span className="text-stroke-strong">·</span>;
}

function ModelRow({ m }: { m: Model }) {
	return (
		<div className="flex items-center gap-4">
			<span className="w-44 shrink-0 truncate font-mono text-xs text-fg-primary">
				{modelLabel(m)}
			</span>
			<span className="h-2 flex-1 bg-bg-panel">
				<span
					className="block h-full bg-accent-lime"
					style={{ width: `${Math.max(1, m.tokenShare * 100)}%` }}
				/>
			</span>
			<span className="w-14 shrink-0 text-right font-mono text-xs text-fg-muted">
				{(m.tokenShare * 100).toFixed(1)}%
			</span>
			{m.apiEquivalentUSD !== undefined && (
				<span className="w-20 shrink-0 text-right font-mono text-xs text-fg-primary">
					{fmtUSD(m.apiEquivalentUSD)}
				</span>
			)}
		</div>
	);
}

/** The three things that must never be silently dropped. */
function Footnotes({
	snapshot,
	cost,
	caveat,
	priv,
}: {
	snapshot: Snapshot;
	cost: number | null;
	caveat: string | null;
	priv: string | null;
}) {
	return (
		<div className="mt-4 space-y-1 border-t border-stroke-subtle pt-3">
			{cost !== null && snapshot.pricingTable && (
				<p className={cn(MONO, "text-[10px] text-fg-muted")}>
					prices: {snapshot.pricingTable}
				</p>
			)}
			{priv && (
				<p className={cn(MONO, "text-[10px] text-fg-muted")}>
					kept private: {priv}
				</p>
			)}
			{caveat && (
				<p className="text-[11px] text-orange-400">{caveat}</p>
			)}
		</div>
	);
}

// ===========================================================================
// VARIANT B — LEDGER
// A journey section of its own. The measured layer is content, given the same
// weight as Tools and Workflow: a big dated reading, the model split beside
// it, activity underneath. The rolling window is stated in words so the
// moving number reads as the window moving, not as the number wobbling.
// ===========================================================================

export function VariantB({
	snapshot,
	index,
	id,
}: {
	snapshot: Snapshot | null;
	index: number;
	id?: string;
}) {
	const cost = snapshot ? totalUSD(snapshot) : null;

	return (
		<section
			id={id}
			className={cn(
				"scroll-mt-24 px-6 py-16 md:py-24",
				index % 2 === 0 ? "bg-bg-canvas" : "bg-bg-panel/30",
			)}
		>
			<div className="mx-auto max-w-7xl">
				<div className="mb-10 flex items-end gap-5 border-b border-stroke-subtle pb-5">
					<span className="font-mono text-5xl font-black leading-none text-stroke-strong md:text-7xl">
						{String(index).padStart(2, "0")}
					</span>
					<div className="flex-1">
						<p
							className={cn(
								"font-mono text-xs font-semibold tracking-[0.25em] text-accent-lime uppercase",
							)}
						>
							// from this machine
						</p>
						<h2 className="mt-1 text-3xl font-black uppercase tracking-tight text-fg-primary md:text-4xl">
							What actually ran
						</h2>
					</div>
					{snapshot && (
						<span
							className={cn(MONO, "hidden text-xs text-fg-muted md:block")}
						>
							checked {ago(snapshot.receivedAt)}
						</span>
					)}
				</div>

				{!snapshot ? (
					<NeverSyncedBlock />
				) : (
					<div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
						{/* The reading */}
						<div>
							{cost !== null ? (
								<>
									<p className="font-mono text-5xl font-black leading-none text-fg-primary md:text-6xl">
										≈{fmtUSD(cost)}
									</p>
									<p className="mt-2 text-sm text-fg-muted">
										at API prices, over the last {snapshot.window.days} days
									</p>
								</>
							) : (
								<>
									<p className="font-mono text-5xl font-black leading-none text-fg-primary md:text-6xl">
										{fmtTokens(snapshot.activity.totalTokens)}
									</p>
									<p className="mt-2 text-sm text-fg-muted">
										tokens over the last {snapshot.window.days} days
									</p>
								</>
							)}

							<p className="mt-6 max-w-sm text-sm leading-relaxed text-fg-muted">
								This is a <strong className="text-fg-primary">rolling</strong>{" "}
								{snapshot.window.days}-day reading, not a running total. It
								moves every time it's checked, because the window moves with
								it.
							</p>

							<div className="mt-6 space-y-1">
								<p className={cn(MONO, "text-[10px] text-fg-muted")}>
									{snapshot.window.from} → {snapshot.window.to}
								</p>
								<p className={cn(MONO, "text-[10px] text-fg-muted")}>
									read from Claude Code
									{snapshot.harness.version
										? ` ${snapshot.harness.version}`
										: ""}
								</p>
								{cost !== null && snapshot.pricingTable && (
									<p className={cn(MONO, "text-[10px] text-fg-muted")}>
										prices: {snapshot.pricingTable}
									</p>
								)}
							</div>
						</div>

						{/* The split */}
						<div>
							<div className="space-y-3">
								{snapshot.models.map((m) => (
									<ModelRow key={m.id} m={m} />
								))}
							</div>

							<div className="mt-8 grid grid-cols-2 gap-px border border-stroke-subtle bg-stroke-subtle sm:grid-cols-4">
								<Stat
									label="sessions"
									value={snapshot.activity.sessions.toLocaleString()}
								/>
								<Stat
									label="active days"
									value={`${snapshot.activity.activeDays} of ${snapshot.window.days}`}
								/>
								<Stat
									label="cache hits"
									value={`${(snapshot.activity.cacheHitShare * 100).toFixed(0)}%`}
								/>
								<Stat
									label="run by subagents"
									value={`${(snapshot.activity.subagentShare * 100).toFixed(0)}%`}
								/>
							</div>

							<div className="mt-4 space-y-1">
								{keptPrivate(snapshot) && (
									<p className={cn(MONO, "text-[10px] text-fg-muted")}>
										kept private: {keptPrivate(snapshot)}
									</p>
								)}
								{coverageCaveat(snapshot) && (
									<p className="text-[11px] text-orange-400">
										{coverageCaveat(snapshot)}
									</p>
								)}
								{!snapshot.isFresh && (
									<p className="text-[11px] text-orange-400">
										Last checked {ago(snapshot.receivedAt)} — this reading is
										going stale.
									</p>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</section>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-bg-canvas px-4 py-4">
			<p className="font-mono text-xl font-black text-fg-primary">{value}</p>
			<p className={cn(MONO, "mt-1 text-[10px] text-fg-muted")}>{label}</p>
		</div>
	);
}

/**
 * The state every stack but one is in. Deliberately NOT a demerit — it is an
 * invitation addressed to the reader, not a judgement on the author.
 */
function NeverSyncedBlock() {
	return (
		<div className="border border-dashed border-stroke-strong px-6 py-10 text-center">
			<p className="text-lg text-fg-primary">
				This stack hasn't been measured yet.
			</p>
			<p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
				Stacks can publish what actually ran on the machine they're built on —
				sessions, models, tokens and cost at API prices, read from Claude Code.
			</p>
		</div>
	);
}

// ===========================================================================
// VARIANT C — EVIDENCE
// No block anywhere. The measured layer annotates the stack's OWN claims: for
// each model the stack lists, what the machine actually did with it — and,
// pointedly, "listed, but not seen in the last 30 days" for the ones it
// didn't. There is no headline figure to be unstable.
// ===========================================================================

export function VariantC({
	snapshot,
	authoredModels,
}: {
	snapshot: Snapshot | null;
	authoredModels: { name: string; slug?: string }[];
}) {
	if (!snapshot) return null;

	const bySlug = new Map(
		snapshot.models
			.filter((m) => m.catalogSlug)
			.map((m) => [m.catalogSlug as string, m]),
	);
	const byName = new Map(
		snapshot.models.map((m) => [modelLabel(m).toLowerCase(), m]),
	);

	const matched = authoredModels.map((a) => ({
		authored: a,
		measured:
			(a.slug ? bySlug.get(a.slug) : undefined) ??
			byName.get(a.name.toLowerCase()) ??
			null,
	}));
	const claimedSlugs = new Set(
		matched.filter((r) => r.measured).map((r) => r.measured?.id),
	);
	const unclaimed = snapshot.models.filter((m) => !claimedSlugs.has(m.id));

	const cost = totalUSD(snapshot);
	const caveat = coverageCaveat(snapshot);
	const priv = keptPrivate(snapshot);

	return (
		<div className="bg-bg-panel/30 px-6 pb-16 pt-2 md:pb-24">
			<div className="mx-auto max-w-7xl">
				<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-stroke-subtle pb-3">
					<span
						className={cn(MONO, "text-[11px] font-bold text-accent-lime")}
					>
						// checked against this machine
					</span>
					<span className={cn(MONO, "text-[10px] text-fg-muted")}>
						last {snapshot.window.days} days · Claude Code · checked{" "}
						{ago(snapshot.receivedAt)}
					</span>
				</div>

				<div className="mt-5 space-y-px bg-stroke-subtle">
					{matched.map((r) => (
						<EvidenceRow
							key={r.authored.name}
							label={r.authored.name}
							m={r.measured}
						/>
					))}
					{unclaimed.map((m) => (
						<EvidenceRow
							key={m.id}
							label={modelLabel(m)}
							m={m}
							notListed
						/>
					))}
				</div>

				<div className="mt-4 space-y-1">
					{cost !== null && (
						<p className={cn(MONO, "text-[10px] text-fg-muted")}>
							≈{fmtUSD(cost)} at API prices across all of the above · prices:{" "}
							{snapshot.pricingTable}
						</p>
					)}
					{priv && (
						<p className={cn(MONO, "text-[10px] text-fg-muted")}>
							kept private: {priv}
						</p>
					)}
					{caveat && <p className="text-[11px] text-orange-400">{caveat}</p>}
				</div>
			</div>
		</div>
	);
}

function EvidenceRow({
	label,
	m,
	notListed,
}: {
	label: string;
	m: Model | null;
	notListed?: boolean;
}) {
	return (
		<div className="flex items-center gap-4 bg-bg-canvas px-4 py-3">
			<span className="w-52 shrink-0 truncate text-sm text-fg-primary">
				{label}
				{notListed && (
					<span className={cn(MONO, "ml-2 text-[10px] text-accent-lime")}>
						not listed
					</span>
				)}
			</span>
			{m ? (
				<>
					<span className="h-2 flex-1 bg-bg-panel">
						<span
							className="block h-full bg-accent-lime"
							style={{ width: `${Math.max(1, m.tokenShare * 100)}%` }}
						/>
					</span>
					<span className="w-24 shrink-0 text-right font-mono text-xs text-fg-muted">
						{fmtTokens(
							m.tokens.input +
								m.tokens.output +
								m.tokens.cacheWrite +
								m.tokens.cacheRead,
						)}{" "}
						tok
					</span>
					{m.apiEquivalentUSD !== undefined && (
						<span className="w-20 shrink-0 text-right font-mono text-xs text-fg-primary">
							{fmtUSD(m.apiEquivalentUSD)}
						</span>
					)}
				</>
			) : (
				<span className="flex-1 text-xs text-fg-muted">
					listed, but not seen in the last 30 days
				</span>
			)}
		</div>
	);
}

// ===========================================================================
// Switcher — two axes, both in the URL. Dev only.
// ===========================================================================

// ROUND 2: A+B is locked, so the axis is now HOW A folds into the hero.
// (Round 1's A/B/C variants are kept in this file as the primary source.)
const VARIANTS = ["H1", "H2", "H3", "off"] as const;
const VARIANT_NAMES: Record<string, string> = {
	H1: "Fourth tile — sacrifice nothing",
	H2: "Evidence strip — sacrifice the counts",
	H3: "Split — sacrifice the symmetry",
	off: "untouched hero",
};
const STATES: MState[] = ["full", "nocost", "degraded", "stale", "none"];
const STATE_NAMES: Record<MState, string> = {
	full: "clean scan, cost on",
	nocost: "publishCost off",
	degraded: "partial scan",
	stale: "19 days old",
	none: "never synced",
};

function readParam(key: string, fallback: string): string {
	if (typeof window === "undefined") return fallback;
	return new URLSearchParams(window.location.search).get(key) ?? fallback;
}

function writeParam(key: string, value: string) {
	const url = new URL(window.location.href);
	url.searchParams.set(key, value);
	window.history.replaceState({}, "", url.toString());
}

/** Reads `?hero=` and `?mstate=` without touching the route's search schema. */
export function useMeasuredProto() {
	// Defaults to `off` so the real stack page is untouched unless a variant is
	// asked for by URL — the round is settled and the fixture is not real data.
	const [variant, setVariant] = useState(() => readParam("hero", "off"));
	const [state, setState] = useState<MState>(
		() => readParam("mstate", "full") as MState,
	);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement | null;
			if (
				t &&
				(t.tagName === "INPUT" ||
					t.tagName === "TEXTAREA" ||
					t.isContentEditable)
			)
				return;
			if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
				const i = Math.max(
					0,
					VARIANTS.indexOf(variant as (typeof VARIANTS)[number]),
				);
				const next =
					VARIANTS[
						(i + (e.key === "ArrowRight" ? 1 : VARIANTS.length - 1)) %
							VARIANTS.length
					];
				setVariant(next);
				writeParam("hero", next);
			}
			if (e.key === "ArrowUp" || e.key === "ArrowDown") {
				const i = STATES.indexOf(state);
				const next =
					STATES[
						(i + (e.key === "ArrowDown" ? 1 : STATES.length - 1)) % STATES.length
					];
				setState(next);
				writeParam("mstate", next);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [variant, state]);

	const pick = (v: string) => {
		setVariant(v);
		writeParam("hero", v);
	};
	const pickState = (s: MState) => {
		setState(s);
		writeParam("mstate", s);
	};

	return { variant, state, pick, pickState, enabled: variant !== "off" };
}

export function MeasuredSwitcher({
	variant,
	state,
	pick,
	pickState,
}: {
	variant: string;
	state: MState;
	pick: (v: string) => void;
	pickState: (s: MState) => void;
}) {
	if (import.meta.env.PROD) return null;

	const i = Math.max(0, VARIANTS.indexOf(variant as (typeof VARIANTS)[number]));
	const step = (d: number) =>
		pick(VARIANTS[(i + d + VARIANTS.length) % VARIANTS.length]);

	return (
		<div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
			<div className="flex flex-col gap-2 border-2 border-black bg-white px-3 py-2 shadow-[6px_6px_0_rgba(0,0,0,0.35)]">
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => step(-1)}
						className="p-1 hover:bg-black/10"
					>
						<ChevronLeft className="size-4 text-black" />
					</button>
					<span className="min-w-72 text-center font-mono text-xs font-bold text-black">
						{VARIANTS[i]} — {VARIANT_NAMES[VARIANTS[i]]}
					</span>
					<button
						type="button"
						onClick={() => step(1)}
						className="p-1 hover:bg-black/10"
					>
						<ChevronRight className="size-4 text-black" />
					</button>
				</div>
				<div className="flex items-center justify-center gap-1">
					{STATES.map((s) => (
						<button
							key={s}
							type="button"
							onClick={() => pickState(s)}
							className={cn(
								"px-2 py-1 font-mono text-[10px] uppercase",
								s === state
									? "bg-black text-white"
									: "text-black hover:bg-black/10",
							)}
							title={STATE_NAMES[s]}
						>
							{s}
						</button>
					))}
				</div>
				<p className="text-center font-mono text-[9px] text-black/60">
					←/→ variant · ↑/↓ state · {STATE_NAMES[state]}
				</p>
			</div>
		</div>
	);
}

export function ProtoOnly({ children }: { children: ReactNode }) {
	if (import.meta.env.PROD) return null;
	return <>{children}</>;
}
