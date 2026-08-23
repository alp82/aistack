import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import { EmailFooter } from "./EmailFooter";
import {
	colors,
	EMAIL_CONFIG,
	fonts,
	styles,
	UNSUBSCRIBE_PLACEHOLDER,
} from "./styles";

/**
 * One weekly newsletter issue (#201, map #198).
 *
 * The issue is authored in `src/newsletter/issues.ts`, and its item summaries
 * come from the item rows. This component only lays them out.
 *
 * Link targets follow #203. The issue's own links point at the main page, which
 * is the proven landing. One quieter read-in-browser link points at the issue's
 * archive page, and that page opens the way to the other issues. Item links
 * always point at their source, as the re-serving policy requires.
 */

const BASE_URL = EMAIL_CONFIG.websiteUrl;

/** What the render needs about one item. Assembled by `newsletter:issueForRender`. */
export interface NewsletterItem {
	headline: string;
	url: string;
	/** The summary in our own words. Empty is allowed and renders as a bare link. */
	summary?: string;
	/** The source's display name, for the credit line. */
	sourceName?: string;
	/** The source's own publication date, in ms. */
	publishedAt?: number;
	/**
	 * The license notice a source demands. Shown verbatim under the item, which
	 * is what `cc-by` and `permissive-release-notes` require of us.
	 */
	attribution?: string;
}

export interface NewsletterIssueEmailProps {
	number: number;
	slug: string;
	subject: string;
	preview: string;
	intro?: string;
	items: NewsletterItem[];
}

const itemHeadline: React.CSSProperties = {
	fontSize: 17,
	fontWeight: 800,
	lineHeight: "24px",
	letterSpacing: "-0.01em",
	color: colors.textPrimary,
	margin: "0 0 6px",
};

const itemCredit: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontSize: 11,
	fontWeight: 600,
	letterSpacing: "0.08em",
	textTransform: "uppercase",
	color: colors.textMuted,
	margin: "0 0 10px",
};

const itemSummary: React.CSSProperties = {
	fontSize: 15,
	lineHeight: "25px",
	color: colors.textSecondary,
	margin: 0,
};

const itemAttribution: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontSize: 11,
	lineHeight: "18px",
	color: colors.textMuted,
	margin: "8px 0 0",
};

const itemLink: React.CSSProperties = {
	color: colors.textPrimary,
	textDecoration: "underline",
	textDecorationColor: "#a3e635",
	textUnderlineOffset: 3,
};

const readInBrowser: React.CSSProperties = {
	fontFamily: fonts.mono,
	fontSize: 11,
	color: colors.textMuted,
	margin: "0 0 24px",
	letterSpacing: "0.04em",
};

/** "Aug 22, 2026". Absent dates render as nothing, never as "Invalid Date". */
function formatDate(ms?: number): string | null {
	if (typeof ms !== "number" || !Number.isFinite(ms)) return null;
	return new Date(ms).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		timeZone: "UTC",
	});
}

export function NewsletterIssueEmail({
	number,
	slug,
	subject,
	preview,
	intro,
	items,
}: NewsletterIssueEmailProps) {
	const archiveUrl = `${BASE_URL}/news/${slug}`;

	return (
		<Html>
			<Head />
			<Preview>{preview}</Preview>
			<Body style={styles.body}>
				<Container style={styles.container}>
					<Section style={styles.header}>
						<table cellPadding="0" cellSpacing="0" border={0}>
							<tbody>
								<tr>
									<td style={styles.logoSquare} />
									<td style={{ paddingLeft: 12, verticalAlign: "middle" }}>
										<span style={styles.logoText}>AI STACK</span>
									</td>
								</tr>
							</tbody>
						</table>
					</Section>

					<Section style={styles.content}>
						<Text style={styles.sectionLabel}>
							// AI Stack News · Issue #{number}
						</Text>
						<Heading style={{ ...styles.h1, marginBottom: 20 }}>
							{subject}
						</Heading>
						<Text style={readInBrowser}>
							<Link href={archiveUrl} style={{ color: colors.textMuted }}>
								Read this issue in your browser
							</Link>
						</Text>

						{intro ? (
							<Text style={{ ...styles.p, marginBottom: 8 }}>{intro}</Text>
						) : null}

						{items.map((item) => {
							const date = formatDate(item.publishedAt);
							const credit = [item.sourceName, date]
								.filter(Boolean)
								.join(" · ");
							return (
								<Section key={item.url} style={{ margin: 0 }}>
									<Hr style={{ ...styles.hr, margin: "28px 0 24px" }} />
									<Text style={itemHeadline}>
										<Link href={item.url} style={itemLink}>
											{item.headline}
										</Link>
									</Text>
									{credit ? <Text style={itemCredit}>{credit}</Text> : null}
									{item.summary ? (
										<Text style={itemSummary}>{item.summary}</Text>
									) : null}
									{item.attribution ? (
										<Text style={itemAttribution}>{item.attribution}</Text>
									) : null}
								</Section>
							);
						})}

						<Hr style={{ ...styles.hr, margin: "32px 0 28px" }} />

						<Text style={{ ...styles.p, marginBottom: 20 }}>
							AI Stack collects what people actually run. Compare stacks, see
							real usage, and publish your own.
						</Text>
						<Section style={styles.ctaWrap}>
							<Link href={BASE_URL} style={styles.cta}>
								OPEN AI STACK ⟶
							</Link>
						</Section>
					</Section>

					<EmailFooter unsubscribeUrl={UNSUBSCRIBE_PLACEHOLDER} />
				</Container>
			</Body>
		</Html>
	);
}

export default NewsletterIssueEmail;
