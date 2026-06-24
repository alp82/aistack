import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Img,
	Link,
	Preview,
	Row,
	Column,
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

// Tool logos - popular tools on AI Stack
// Using public URLs for email compatibility
const BASE_URL = "https://aistack.to";
const TOOL_LOGOS: { name: string; url: string }[] = [
	{ name: "Perplexity", url: `${BASE_URL}/email/perplexity-logo.png` },
	{ name: "Lovable", url: `${BASE_URL}/email/lovable-logo.png` },
	{ name: "ChatGPT", url: `${BASE_URL}/email/chatgpt-logo.png` },
	{ name: "Cursor", url: `${BASE_URL}/email/cursor-logo.png` },
	{ name: "Claude Code", url: `${BASE_URL}/email/claude-logo.png` },
	{ name: "Opencode", url: `${BASE_URL}/email/opencode-logo.png` },
];

export function WaitlistLaunchEmail(props: {
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
				{productName} is live! Build your perfect AI stack today
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

					{/* Hero Image - Clickable CTA */}
					<Link
						href={ctaUrl}
						style={{
							display: "block",
						}}
					>
						<Section
							style={{
								backgroundColor: "#212226",
								padding: "0 20px",
							}}
						>
							<Img
								src="https://aistack.to/email/hero.gif"
								alt="AI Stack - Click to explore"
								width="560"
								height="280"
								style={{
									width: "100%",
									height: "auto",
									display: "block",
								}}
							/>
						</Section>
					</Link>

					{/* Main Content */}
					<Section style={styles.content}>
						<Text style={styles.sectionLabel}>// The Wait Is Over</Text>
						<Heading style={styles.h1}>We're Live!</Heading>

						{/* Join the Builders callout */}
						<Section
							style={{
								borderLeft: `4px solid ${colors.accentLime}`,
								paddingLeft: 20,
								marginBottom: 32,
							}}
						>
							<Text
								style={{
									fontFamily: fonts.mono,
									fontSize: 14,
									fontWeight: 800,
									color: colors.accentLime,
									textTransform: "uppercase" as const,
									letterSpacing: "0.1em",
									margin: "0 0 8px",
								}}
							>
								Join the Builders
							</Text>
							<Text
								style={{
									fontSize: 16,
									lineHeight: "26px",
									color: colors.textSecondary,
									margin: 0,
								}}
							>
								You signed up early. Now you're part of a growing community
								shaping how we discover, compare, and build with AI tools.
							</Text>
						</Section>

						{/* First CTA - Explore AI Stack */}
						<Section style={styles.ctaWrap}>
							<Link href={ctaUrl} style={styles.ctaAnimated}>
								Explore AI Stack ⟶
							</Link>
						</Section>

						{/* Tool Logos Grid */}
						{TOOL_LOGOS.length > 0 && (
							<Section style={{ marginTop: 32, marginBottom: 32 }}>
								{/* Row 1 - first 3 logos */}
								<Row>
									{TOOL_LOGOS.slice(0, 3).map((tool) => (
										<Column
											key={tool.name}
											style={{
												width: "33.33%",
												padding: "12px",
												verticalAlign: "top" as const,
											}}
										>
											<table
												cellPadding="0"
												cellSpacing="0"
												style={{ width: "100%" }}
											>
												<tr>
													<td align="center">
														<Img
															src={tool.url}
															alt={tool.name}
															width="80"
															height="80"
															style={{
																display: "block",
																outline: "none",
																border: "none",
																textDecoration: "none",
																width: 80,
																height: 80,
																objectFit: "contain" as const,
															}}
														/>
													</td>
												</tr>
												<tr>
													<td
														align="center"
														style={{
															fontFamily: fonts.mono,
															fontSize: 12,
															fontWeight: 600,
															color: colors.textSecondary,
															paddingTop: 4,
														}}
													>
														{tool.name}
													</td>
												</tr>
											</table>
										</Column>
									))}
								</Row>
								{/* Row 2 - last 3 logos */}
								<Row>
									{TOOL_LOGOS.slice(3, 6).map((tool) => (
										<Column
											key={tool.name}
											style={{
												width: "33.33%",
												padding: "12px",
												verticalAlign: "top" as const,
											}}
										>
											<table
												cellPadding="0"
												cellSpacing="0"
												style={{ width: "100%" }}
											>
												<tr>
													<td align="center">
														<Img
															src={tool.url}
															alt={tool.name}
															width="80"
															height="80"
															style={{
																display: "block",
																outline: "none",
																border: "none",
																textDecoration: "none",
																width: 80,
																height: 80,
																objectFit: "contain" as const,
															}}
														/>
													</td>
												</tr>
												<tr>
													<td
														align="center"
														style={{
															fontFamily: fonts.mono,
															fontSize: 12,
															fontWeight: 600,
															color: colors.textSecondary,
															paddingTop: 4,
														}}
													>
														{tool.name}
													</td>
												</tr>
											</table>
										</Column>
									))}
								</Row>
							</Section>
						)}

						<hr style={styles.hr} />

						<Text style={styles.p}>
							{productName} is your new home for understanding the AI landscape.
							Whether you're building your first AI-powered app or optimizing an
							existing stack, we've got you covered.
						</Text>

						{/* Features - 2x2 grid with punchy card style */}
						<Section style={{ marginBottom: 32 }}>
							<Row>
								<Column
									style={{
										width: "50%",
										padding: "0 6px 12px 0",
									}}
								>
									<div
										style={{
											backgroundColor: colors.bgBody,
											borderTop: `3px solid ${colors.accentLime}`,
											padding: "16px",
										}}
									>
										<Text
											style={{
												fontFamily: fonts.mono,
												fontSize: 11,
												fontWeight: 800,
												color: colors.accentLime,
												textTransform: "uppercase" as const,
												letterSpacing: "0.1em",
												margin: "0 0 8px",
											}}
										>
											Community-Driven
										</Text>
										<Text
											style={{
												fontSize: 13,
												lineHeight: "20px",
												color: colors.textSecondary,
												margin: 0,
											}}
										>
											Real insights from builders who use these tools daily
										</Text>
									</div>
								</Column>
								<Column
									style={{
										width: "50%",
										padding: "0 0 12px 6px",
									}}
								>
									<div
										style={{
											backgroundColor: colors.bgBody,
											borderTop: `3px solid ${colors.accentLime}`,
											padding: "16px",
										}}
									>
										<Text
											style={{
												fontFamily: fonts.mono,
												fontSize: 11,
												fontWeight: 800,
												color: colors.accentLime,
												textTransform: "uppercase" as const,
												letterSpacing: "0.1em",
												margin: "0 0 8px",
											}}
										>
											Learning Hub
										</Text>
										<Text
											style={{
												fontSize: 13,
												lineHeight: "20px",
												color: colors.textSecondary,
												margin: 0,
											}}
										>
											Understand what each tool does and when to use it
										</Text>
									</div>
								</Column>
							</Row>
							<Row>
								<Column
									style={{
										width: "50%",
										padding: "0 6px 0 0",
									}}
								>
									<div
										style={{
											backgroundColor: colors.bgBody,
											borderTop: `3px solid ${colors.accentLime}`,
											padding: "16px",
										}}
									>
										<Text
											style={{
												fontFamily: fonts.mono,
												fontSize: 11,
												fontWeight: 800,
												color: colors.accentLime,
												textTransform: "uppercase" as const,
												letterSpacing: "0.1em",
												margin: "0 0 8px",
											}}
										>
											Cost Clarity
										</Text>
										<Text
											style={{
												fontSize: 13,
												lineHeight: "20px",
												color: colors.textSecondary,
												margin: 0,
											}}
										>
											See exactly what your AI stack will cost
										</Text>
									</div>
								</Column>
								<Column
									style={{
										width: "50%",
										padding: "0 0 0 6px",
									}}
								>
									<div
										style={{
											backgroundColor: colors.bgBody,
											borderTop: `3px solid ${colors.accentLime}`,
											padding: "16px",
										}}
									>
										<Text
											style={{
												fontFamily: fonts.mono,
												fontSize: 11,
												fontWeight: 800,
												color: colors.accentLime,
												textTransform: "uppercase" as const,
												letterSpacing: "0.1em",
												margin: "0 0 8px",
											}}
										>
											Stack Builder
										</Text>
										<Text
											style={{
												fontSize: 13,
												lineHeight: "20px",
												color: colors.textSecondary,
												margin: 0,
											}}
										>
											Curate and share your perfect tool combination
										</Text>
									</div>
								</Column>
							</Row>
						</Section>

						{/* Second CTA - Share Your Stack */}
						<Section style={styles.ctaWrap}>
							<Link href={`${ctaUrl}/stacks/new`} style={styles.ctaAnimated}>
								Share Your Stack ⟶
							</Link>
						</Section>
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
