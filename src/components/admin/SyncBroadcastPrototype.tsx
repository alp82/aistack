/**
 * PROTOTYPE — wayfinder ticket #133 "Prototype: the broadcast email".
 * ONE file: the email variants plus the admin preview section with a
 * variant selector. Preview-only — nothing here is registered in
 * convex/email.ts BROADCASTS, so no send path exists. Delete this file
 * once a variant wins and gets rewritten properly as SyncBroadcastEmail.
 *
 * Round 2 (owner feedback 2026-08-14): B dropped (too much text).
 * A is the base; copy rewritten plainer. C's unlock cards redesigned
 * and folded into A as the "merged" variant. Originals A and C kept
 * for comparison behind the selector.
 *
 * Locked inputs (map #121 / #133 / docs/prototypes/sync-path-2026-08.md):
 * - One ask: run the CLI and sync. CTA lands on aistack.to/sync.
 * - Harnesses are FOUR: Claude Code, Codex, opencode, pi-mono. No Cursor.
 * - The boundary sentence carries the chat-app answer; never name Claude/ChatGPT.
 * - Payoff = time series, leaderboard, activity, private views + share image.
 * - "Raw data never leaves the machine" must be said.
 * - Positive claims only (#40).
 */
import {
	Body,
	Column,
	Container,
	Head,
	Heading,
	Html,
	Link,
	Preview,
	Row,
	Section,
	Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import { FlaskConical } from "lucide-react";
import { useEffect, useState } from "react";
import { EmailFooter } from "../../emails/EmailFooter";
import {
	colors,
	EMAIL_CONFIG,
	fonts,
	glowKeyframes,
	styles,
	UNSUBSCRIBE_PLACEHOLDER,
} from "../../emails/styles";

const SYNC_URL = "https://aistack.to/sync";

/* ── shared chrome ─────────────────────────────────────────────── */

function Header() {
	return (
		<Section style={styles.header}>
			<Row>
				<Column style={{ width: 16, verticalAlign: "middle" }}>
					<div style={styles.logoSquare} />
				</Column>
				<Column style={{ paddingLeft: 12, verticalAlign: "middle" }}>
					<Text style={styles.logoText}>AI STACK</Text>
				</Column>
			</Row>
		</Section>
	);
}

const boundarySmall: React.CSSProperties = {
	...styles.small,
	borderTop: `2px solid ${colors.borderSubtle}`,
	paddingTop: 20,
};

/** The one boundary. Carries the chat-app answer by not naming them. */
function BoundaryNote() {
	return (
		<Text style={boundarySmall}>
			The CLI only reads files that your harness already stores on your machine.
			Your raw data never leaves your machine. The CLI shows the full summary in
			your terminal, and nothing is sent until you confirm. If you cancel,
			nothing is sent.
		</Text>
	);
}

/* ── terminal mock (variant A + merged) ────────────────────────── */

const termBlock: React.CSSProperties = {
	backgroundColor: "#111111",
	padding: "20px 24px",
	margin: "0 0 12px",
};

const termLine: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontSize: 13,
	lineHeight: "22px",
	color: "#d4d4d4",
	margin: 0,
	whiteSpace: "pre" as const,
};

const termDim: React.CSSProperties = { ...termLine, color: "#737373" };
const termLime: React.CSSProperties = { ...termLine, color: "#a3e635" };

function TerminalMock() {
	return (
		<>
			<Section style={termBlock}>
				<Text style={termLime}>$ npx @use-aistack/cli sync</Text>
				<Text style={termLine}>&nbsp;</Text>
				<Text style={termDim}>from your machine · sync preview</Text>
				<Text style={termLine}>&nbsp;</Text>
				<Text style={termLine}>
					searched claude code, codex, opencode, pi-mono
				</Text>
				<Text style={termLine}>sessions 565 · 30 days</Text>
				<Text style={termLine}>tokens 4.23B</Text>
				<Text style={termLine}>cost $4,827 at API prices</Text>
			</Section>
			<Text style={{ ...styles.small, margin: "0 0 32px" }}>
				These are real numbers from my own machine. The CLI shows your full
				summary before anything is sent.
			</Text>
		</>
	);
}

/* ── unlock cards (redesigned, merged variant) ─────────────────── */

const unlockLabel: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontSize: 11,
	fontWeight: 800,
	color: colors.textPrimary,
	textTransform: "uppercase" as const,
	letterSpacing: "0.08em",
	margin: 0,
	verticalAlign: "middle",
};

const unlockText: React.CSSProperties = {
	fontSize: 13,
	lineHeight: "20px",
	color: colors.textSecondary,
	margin: "8px 0 0",
};

const limeSquare: React.CSSProperties = {
	width: 8,
	height: 8,
	backgroundColor: "#a3e635",
	display: "inline-block",
	marginRight: 8,
};

// Screenshots captured from aistack.to on 2026-08-15, stored in
// /public/email/. The prototype references them by absolute path so the
// admin iframe resolves them against this origin; the final template
// must prefix BASE_URL. Private views was cut (owner call, 2026-08-16):
// the panel is owner-only, so no screenshot can be captured for it.
const UNLOCKS: { label: string; text: string; shot: string; img: string }[] = [
	{
		label: "Usage chart",
		text: "Your stack page shows a usage chart. It updates every time you sync.",
		shot: "screenshot: stack page usage chart",
		img: "/email/sync-usage.png",
	},
	{
		label: "Leaderboard",
		text: "Synced stacks appear on the leaderboard.",
		shot: "screenshot: /leaderboard",
		img: "/email/sync-leaderboard.png",
	},
	{
		label: "Activity feed",
		text: "Your syncs appear in the site's activity feed.",
		shot: "screenshot: /activity",
		img: "/email/sync-activity.png",
	},
	{
		label: "Share image",
		text: "Get an image of your stack with your real numbers, for READMEs and posts.",
		shot: "screenshot: the share image",
		img: "/email/sync-share.png",
	},
	{
		label: "Supported harnesses",
		text: "The CLI reads Claude Code, Codex, opencode and pi-mono.",
		shot: "screenshot: harness logos",
		img: "/email/sync-harnesses.png",
	},
];

const shotPlaceholder: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontSize: 11,
	color: "#737373",
	border: "1px dashed #4a4b50",
	backgroundColor: "#111111",
	padding: "36px 12px",
	margin: "12px 0 0",
	letterSpacing: "0.05em",
	textAlign: "center" as const,
};

function UnlockRow({
	label,
	text,
	shot,
	img,
}: {
	label: string;
	text: string;
	shot: string;
	img: string;
}) {
	return (
		<div style={{ marginBottom: 36 }}>
			<Text style={unlockLabel}>
				<span style={limeSquare} />
				{label}
			</Text>
			<Text style={unlockText}>{text}</Text>
			{img ? (
				<img
					src={img}
					alt={label}
					width={520}
					style={{
						width: "100%",
						height: "auto",
						display: "block",
						marginTop: 12,
					}}
				/>
			) : (
				<Text style={shotPlaceholder}>[ {shot} ]</Text>
			)}
		</div>
	);
}

function UnlockRows() {
	return (
		<Section style={{ marginBottom: 8 }}>
			{UNLOCKS.map((unlock) => (
				<UnlockRow key={unlock.label} {...unlock} />
			))}
		</Section>
	);
}

/* ══════════════════════════════════════════════════════════════════
 * MERGED — A's terminal hero + C's unlocks as redesigned cards.
 * Copy rewritten plain: short sentences, no slogans.
 * Subject: Show what actually ran
 * ════════════════════════════════════════════════════════════════ */

export function SyncBroadcastMerged(props: { unsubscribeUrl?: string }) {
	const unsubscribeUrl = props.unsubscribeUrl ?? UNSUBSCRIBE_PLACEHOLDER;
	return (
		<Html>
			<Head>
				<style>{glowKeyframes}</style>
			</Head>
			<Preview>
				The aistack CLI reads your local usage from Claude Code, Codex, opencode
				and pi-mono and adds it to your stack page.
			</Preview>
			<Body style={styles.body}>
				<Container style={styles.container}>
					<Header />
					<Section style={styles.content}>
						<Text style={styles.sectionLabel}>{"// aistack sync"}</Text>
						<Heading style={styles.h1}>Show your real usage</Heading>
						<Text style={styles.p}>
							Your stack page lists the tools you use. Now it can also show how
							much you use them. The aistack CLI reads your local usage data
							from Claude Code, Codex, opencode and pi-mono, and adds sessions,
							tokens and cost to your stack page.
						</Text>

						<TerminalMock />

						<Section style={styles.ctaWrap}>
							<Link href={SYNC_URL} style={styles.ctaAnimated}>
								Sync your usage ⟶
							</Link>
						</Section>

						<hr style={styles.hr} />

						<Text style={{ ...styles.sectionLabel, marginBottom: 16 }}>
							{"// what you get"}
						</Text>
						<UnlockRows />

						<BoundaryNote />
					</Section>
					<EmailFooter
						productName={EMAIL_CONFIG.productName}
						unsubscribeUrl={unsubscribeUrl}
					/>
				</Container>
			</Body>
		</Html>
	);
}

/* ══════════════════════════════════════════════════════════════════
 * A (original) — terminal hero, payoff as mono rows. Kept for
 * comparison. Subject: Show what actually ran
 * ════════════════════════════════════════════════════════════════ */

const payoffRowLabel: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontSize: 12,
	fontWeight: 700,
	color: colors.textPrimary,
	textTransform: "uppercase" as const,
	letterSpacing: "0.06em",
	margin: 0,
	whiteSpace: "nowrap" as const,
};

const payoffRowText: React.CSSProperties = {
	fontSize: 14,
	lineHeight: "22px",
	color: colors.textSecondary,
	margin: 0,
};

const PAYOFF_ROWS: { label: string; text: string }[] = [
	{
		label: "stack page",
		text: "grows a real time series — it moves with every sync.",
	},
	{ label: "leaderboard", text: "ranks measured stacks. Yours can be on it." },
	{ label: "activity", text: "your syncs join the site's live pulse." },
	{
		label: "views",
		text: "private view counts on your stack. Only you see them.",
	},
	{
		label: "share image",
		text: "your stack as one crisp image, for a README or a post.",
	},
];

export function SyncBroadcastVariantA(props: { unsubscribeUrl?: string }) {
	const unsubscribeUrl = props.unsubscribeUrl ?? UNSUBSCRIBE_PLACEHOLDER;
	return (
		<Html>
			<Head>
				<style>{glowKeyframes}</style>
			</Head>
			<Preview>
				One command prints what ran on your machine. You decide if it publishes.
			</Preview>
			<Body style={styles.body}>
				<Container style={styles.container}>
					<Header />
					<Section style={styles.content}>
						<Text style={styles.sectionLabel}>{"// from your machine"}</Text>
						<Heading style={styles.h1}>Show what actually ran</Heading>
						<Text style={styles.p}>
							You listed the tools you use. Your machine holds the reading
							behind that list — sessions, models, tokens, cost at API prices.
							One command prints it in your terminal, and publishes it only if
							you say so.
						</Text>

						<TerminalMock />

						<Section style={styles.ctaWrap}>
							<Link href={SYNC_URL} style={styles.ctaAnimated}>
								Run the sync ⟶
							</Link>
						</Section>

						<hr style={styles.hr} />

						<Text style={{ ...styles.sectionLabel, marginBottom: 16 }}>
							{"// what lights up"}
						</Text>
						{PAYOFF_ROWS.map((row) => (
							<Row key={row.label} style={{ marginBottom: 12 }}>
								<Column style={{ width: 120, verticalAlign: "top" }}>
									<Text style={payoffRowLabel}>{row.label}</Text>
								</Column>
								<Column style={{ verticalAlign: "top" }}>
									<Text style={payoffRowText}>{row.text}</Text>
								</Column>
							</Row>
						))}

						<BoundaryNote />
					</Section>
					<EmailFooter
						productName={EMAIL_CONFIG.productName}
						unsubscribeUrl={unsubscribeUrl}
					/>
				</Container>
			</Body>
		</Html>
	);
}

/* ══════════════════════════════════════════════════════════════════
 * C (original) — coverage news first, old gray payoff cells. Kept for
 * comparison. Subject: aistack now reads opencode and pi-mono
 * ════════════════════════════════════════════════════════════════ */

const oldCardCell: React.CSSProperties = {
	backgroundColor: colors.bgBody,
	borderTop: `3px solid ${colors.accentLime}`,
	padding: "16px",
};

const oldCardLabel: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontSize: 11,
	fontWeight: 800,
	color: "#5c8a10",
	textTransform: "uppercase" as const,
	letterSpacing: "0.1em",
	margin: "0 0 8px",
};

const oldCardText: React.CSSProperties = {
	fontSize: 13,
	lineHeight: "20px",
	color: colors.textSecondary,
	margin: 0,
};

export function SyncBroadcastVariantC(props: { unsubscribeUrl?: string }) {
	const unsubscribeUrl = props.unsubscribeUrl ?? UNSUBSCRIBE_PLACEHOLDER;
	return (
		<Html>
			<Head>
				<style>{glowKeyframes}</style>
			</Head>
			<Preview>
				Four harnesses, one command — and everything prints on your machine
				before anything sends.
			</Preview>
			<Body style={styles.body}>
				<Container style={styles.container}>
					<Header />
					<Section style={styles.content}>
						<Text style={styles.sectionLabel}>{"// now reading"}</Text>
						<Heading style={styles.h1}>Four harnesses, one command</Heading>
						<Text style={styles.p}>
							The sync CLI now reads <strong>opencode</strong> and{" "}
							<strong>pi-mono</strong>, beside Claude Code and Codex. If it did
							not read your harness before, there is a fair chance it does today
							— and the ask is unchanged: one command, your numbers print in
							your terminal, you decide what publishes.
						</Text>

						<Section style={styles.ctaWrap}>
							<Link href={SYNC_URL} style={styles.ctaAnimated}>
								Sync your machine ⟶
							</Link>
						</Section>

						<hr style={styles.hr} />

						<Text style={{ ...styles.sectionLabel, marginBottom: 16 }}>
							{"// what a measured stack gets"}
						</Text>
						<Section style={{ marginBottom: 8 }}>
							<Row>
								{UNLOCKS.slice(0, 2).map((card, i) => (
									<Column
										key={card.label}
										style={{
											width: "50%",
											padding: i === 0 ? "0 6px 12px 0" : "0 0 12px 6px",
										}}
									>
										<div style={oldCardCell}>
											<Text style={oldCardLabel}>{card.label}</Text>
											<Text style={oldCardText}>{card.text}</Text>
										</div>
									</Column>
								))}
							</Row>
							<Row>
								{UNLOCKS.slice(2, 4).map((card, i) => (
									<Column
										key={card.label}
										style={{
											width: "50%",
											padding: i === 0 ? "0 6px 12px 0" : "0 0 12px 6px",
										}}
									>
										<div style={oldCardCell}>
											<Text style={oldCardLabel}>{card.label}</Text>
											<Text style={oldCardText}>{card.text}</Text>
										</div>
									</Column>
								))}
							</Row>
							<div style={oldCardCell}>
								<Text style={oldCardLabel}>{UNLOCKS[4].label}</Text>
								<Text style={oldCardText}>{UNLOCKS[4].text}</Text>
							</div>
						</Section>

						<BoundaryNote />
					</Section>
					<EmailFooter
						productName={EMAIL_CONFIG.productName}
						unsubscribeUrl={unsubscribeUrl}
					/>
				</Container>
			</Body>
		</Html>
	);
}

/* ── admin preview section with variant selector ───────────────── */

const VARIANTS: {
	id: string;
	name: string;
	subject: string;
	component: React.ReactElement;
}[] = [
	{
		id: "merged",
		name: "Merged (A + C unlocks)",
		subject: "Show your real usage on your stack",
		component: <SyncBroadcastMerged />,
	},
	{
		id: "a",
		name: "A — Terminal (original)",
		subject: "Show what actually ran",
		component: <SyncBroadcastVariantA />,
	},
	{
		id: "c",
		name: "C — Coverage news (original)",
		subject: "aistack now reads opencode and pi-mono",
		component: <SyncBroadcastVariantC />,
	},
];

export function SyncBroadcastPrototypeSection() {
	const [activeId, setActiveId] = useState(VARIANTS[0].id);
	const [htmlById, setHtmlById] = useState<Record<string, string>>({});

	const active = VARIANTS.find((v) => v.id === activeId) ?? VARIANTS[0];
	const html = htmlById[active.id];

	useEffect(() => {
		if (htmlById[active.id] !== undefined) return;
		let cancelled = false;
		render(active.component).then((rendered) => {
			if (!cancelled) {
				setHtmlById((prev) => ({ ...prev, [active.id]: rendered }));
			}
		});
		return () => {
			cancelled = true;
		};
	}, [active, htmlById]);

	return (
		<div className="mb-10 border-2 border-dashed border-amber-500/60 bg-bg-panel">
			<div className="flex items-center gap-3 border-b border-stroke-subtle p-4">
				<FlaskConical className="size-6 text-amber-500" />
				<div>
					<h3 className="font-mono text-lg font-bold text-fg-primary">
						PROTOTYPE · sync broadcast (#133)
					</h3>
					<p className="font-mono text-xs text-fg-muted">
						Preview only — no send path exists for these.
					</p>
				</div>
			</div>

			{/* Variant selector */}
			<div className="flex flex-wrap items-center gap-2 border-b border-stroke-subtle bg-bg-panel-muted px-4 py-2">
				{VARIANTS.map((variant) => (
					<button
						key={variant.id}
						type="button"
						onClick={() => setActiveId(variant.id)}
						className={`px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide transition-colors ${
							variant.id === activeId
								? "bg-amber-500 text-black"
								: "text-fg-muted hover:text-fg-primary"
						}`}
					>
						{variant.name}
					</button>
				))}
				<span className="ml-auto font-mono text-xs text-fg-muted">
					subject: “{active.subject}”
				</span>
			</div>

			<div className="p-4">
				{html === undefined ? (
					<div className="flex items-center justify-center py-12">
						<span className="font-mono text-sm text-fg-muted">
							Rendering...
						</span>
					</div>
				) : (
					<div className="mx-auto max-w-[768px] overflow-hidden border border-stroke-subtle bg-white shadow-md">
						<iframe
							srcDoc={html}
							title={`${active.name} Preview`}
							className="h-[800px] w-full border-0"
							sandbox="allow-same-origin"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
