import {
	Body,
	Column,
	Container,
	Head,
	Heading,
	Html,
	Img,
	Link,
	Preview,
	Row,
	Section,
	Text,
} from "@react-email/components";
import { EmailFooter } from "./EmailFooter";
import {
	colors,
	EMAIL_CONFIG,
	fonts,
	glowKeyframes,
	styles,
	UNSUBSCRIBE_PLACEHOLDER,
} from "./styles";

const BASE_URL = "https://aistack.to";

// The sync-broadcast design was locked in wayfinder ticket #133: an
// animated hero (the start page's live token counter, recorded as a GIF),
// the terminal mock with the owner's real reading, one CTA to /sync, then
// one row per gain, each backed by a screenshot captured from the live
// site (2026-08-17, stored in /public/email/). Recapture before sending
// if the numbers have drifted - the copy claims they are real.

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

const unlockLabel: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontSize: 11,
	fontWeight: 800,
	color: colors.textPrimary,
	textTransform: "uppercase" as const,
	letterSpacing: "0.08em",
	margin: 0,
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

const UNLOCKS: { label: string; text: string; img: string; alt: string }[] = [
	{
		label: "Usage chart",
		text: "Your stack page shows a usage chart. It updates every time you sync.",
		img: `${BASE_URL}/email/sync-usage.png`,
		alt: "The usage section of a stack page on AI Stack",
	},
	{
		label: "Leaderboard",
		text: "Synced stacks appear on the leaderboard.",
		img: `${BASE_URL}/email/sync-leaderboard.png`,
		alt: "The AI Stack leaderboard, ranked by measured tokens",
	},
	{
		label: "Activity feed",
		text: "Your syncs appear in the site's activity feed.",
		img: `${BASE_URL}/email/sync-activity.png`,
		alt: "Sync entries in the AI Stack activity feed",
	},
	{
		label: "Share image",
		text: "Get an image of your stack with your real numbers, for READMEs and posts.",
		img: `${BASE_URL}/email/sync-share.png`,
		alt: "A stack rendered as a shareable image",
	},
	{
		label: "Supported harnesses",
		text: "The CLI reads Claude Code, Codex, opencode and pi-mono.",
		img: `${BASE_URL}/email/sync-harnesses.png`,
		alt: "The list of files the sync CLI reads",
	},
];

export function SyncBroadcastEmail(props: {
	productName?: string;
	ctaUrl?: string;
	unsubscribeUrl?: string;
}) {
	const {
		productName = EMAIL_CONFIG.productName,
		ctaUrl = EMAIL_CONFIG.websiteUrl,
		unsubscribeUrl = UNSUBSCRIBE_PLACEHOLDER,
	} = props;

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
					{/* Header */}
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

					{/* Hero - the start page's token counter, recorded live. Clickable
					    like the waitlist-launch hero. */}
					<Link href={`${ctaUrl}/sync`} style={{ display: "block" }}>
						<Img
							src={`${BASE_URL}/email/sync-hero.gif`}
							alt="106 billion tokens measured in the last 24 hours on AI Stack"
							width={560}
							height={256}
							style={{
								width: "100%",
								height: "auto",
								display: "block",
							}}
						/>
					</Link>

					{/* Main Content */}
					<Section style={styles.content}>
						<Text style={styles.sectionLabel}>{"// aistack sync"}</Text>
						<Heading style={styles.h1}>Share your real usage</Heading>
						<Text style={styles.p}>
							On top of the tools you use, now you can also show how
							much you use them. The aistack CLI reads your local usage data
							from Claude Code, Codex, opencode and pi-mono. It adds session and
							token count to your profile page.
						</Text>

						{/* Terminal mock with the owner's real reading */}
						<Section
							style={{
								backgroundColor: "#111111",
								padding: "20px 24px",
								margin: "0 0 12px",
							}}
						>
							<Text style={termLime}>$ npx @use-aistack/cli sync</Text>
							<Text style={termLine}>&nbsp;</Text>
							<Text style={termDim}>from your machine · sync preview</Text>
							<Text style={termLine}>&nbsp;</Text>
							<Text style={termLine}>
								searched claude code, codex, opencode, pi-mono
							</Text>
							<Text style={termLine}>* sessions 572 · 30 days</Text>
							<Text style={termLine}>* tokens 4.26B</Text>
							<Text style={termLine}>* cost $4,907 at API prices</Text>
							<Text style={termLime}>
								Auto-sync turned on
							</Text>
						</Section>
						<Text style={{ ...styles.small, margin: "0 0 32px" }}>
							These are real numbers from my own machine.
						</Text>

						{/* CTA */}
						<Section style={styles.ctaWrap}>
							<Link href={`${ctaUrl}/sync`} style={styles.ctaAnimated}>
								Sync your usage ⟶
							</Link>
						</Section>

						<hr style={styles.hr} />

						{/* What you get */}
						<Text style={{ ...styles.sectionLabel, marginBottom: 16 }}>
							{"// what you get"}
						</Text>
						{UNLOCKS.map((unlock) => (
							<Section key={unlock.label} style={{ marginBottom: 36 }}>
								<Text style={unlockLabel}>
									<span style={limeSquare} />
									{unlock.label}
								</Text>
								<Text style={unlockText}>{unlock.text}</Text>
								<Img
									src={unlock.img}
									alt={unlock.alt}
									width={520}
									style={{
										width: "100%",
										height: "auto",
										display: "block",
										marginTop: 12,
									}}
								/>
							</Section>
						))}

						{/* Privacy boundary */}
						<Text
							style={{
								...styles.small,
								borderTop: `2px solid ${colors.borderSubtle}`,
								paddingTop: 20,
							}}
						>
							The CLI only reads token and session statistics. Your chat data never leaves your machine.
							You'll see the full summary in your terminal, and you have to confirm the sync before publishing.
						</Text>
					</Section>

					{/* Footer */}
					<EmailFooter
						productName={productName}
						unsubscribeUrl={unsubscribeUrl}
					/>
				</Container>
			</Body>
		</Html>
	);
}
