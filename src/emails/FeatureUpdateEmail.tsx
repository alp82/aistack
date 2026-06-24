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

const FEATURE_CARDS: {
	label: string;
	title: string;
	blurb: string;
	img: string;
	alt: string;
	imgWidth: number;
}[] = [
	{
		label: "// Showcase",
		title: "Promote Your Projects",
		blurb:
			"Pin the things you've shipped right on your profile. Show the world what you build, not just the tools you use.",
		img: `${BASE_URL}/email/feature-projects.png`,
		alt: "Projects showcased on an AI Stack profile",
		imgWidth: 520,
	},
	{
		label: "// Embed",
		title: "Share Your Stack As An Image",
		blurb:
			"Drop a crisp snapshot of your stack anywhere - a GitHub README, a tweet or a slide.",
		img: `${BASE_URL}/email/feature-share.png`,
		alt: "An AI Stack rendered as a shareable image",
		imgWidth: 520,
	},
	{
		label: "// Your Style",
		title: "Customize Your Colors",
		blurb:
			"Recolor your stack. Pick from a curated set of presets and make it unmistakably yours.",
		img: `${BASE_URL}/email/feature-colors.png`,
		alt: "Accent color presets for an AI Stack",
		imgWidth: 180,
	},
];

const featureLabel: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontSize: 11,
	fontWeight: 800,
	color: colors.accentLime,
	textTransform: "uppercase" as const,
	letterSpacing: "0.1em",
	margin: "0 0 8px",
};

const featureTitle: React.CSSProperties = {
	fontSize: 20,
	fontWeight: 800,
	color: colors.textPrimary,
	letterSpacing: "-0.01em",
	margin: "0 0 8px",
};

const featureBlurb: React.CSSProperties = {
	fontSize: 15,
	lineHeight: "24px",
	color: colors.textSecondary,
	margin: "0 0 16px",
};

const featurePanel: React.CSSProperties = {
	backgroundColor: "#212226",
	padding: "24px 20px",
	textAlign: "center" as const,
	marginBottom: 24,
};

export function FeatureUpdateEmail(props: {
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
				Three new ways to stack on {productName}: projects, shareable images,
				and accent colors
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

					{/* Main Content */}
					<Section style={styles.content}>
						<Text style={styles.sectionLabel}>{"// What's New"}</Text>
						<Heading style={styles.h1}>Three New Ways To Stack</Heading>
						<Text style={styles.p}>
							We've been busy. {productName} just picked up three upgrades to
							help you show off your work and make your stack your own.
						</Text>

						{/* Feature cards */}
						{FEATURE_CARDS.map((card) => (
							<Section key={card.title} style={{ marginBottom: 8 }}>
								<Text style={featureLabel}>{card.label}</Text>
								<Text style={featureTitle}>{card.title}</Text>
								<Text style={featureBlurb}>{card.blurb}</Text>
								<Section style={featurePanel}>
									<Img
										src={card.img}
										alt={card.alt}
										width={card.imgWidth}
										style={{
											maxWidth: "100%",
											height: "auto",
											display: "inline-block",
											margin: "0 auto",
										}}
									/>
								</Section>
							</Section>
						))}

						{/* CTA */}
						<Section style={styles.ctaWrap}>
							<Link href={`${ctaUrl}/stacks/new`} style={styles.ctaAnimated}>
								Customize Your Stack ⟶
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
